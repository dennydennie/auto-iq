import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { randomUUID } from "node:crypto";
import { TenantContext } from "../../common/tenancy/tenant-context";
import { RedisService } from "../redis/redis.service";

type UploadKind = "image" | "document";

interface UploadIntent {
  userId: string;
  listingId: string;
  kind: UploadKind;
  contentType: string;
  contentLength: number;
  slot?: string;
  documentType?: string;
}

export interface UploadBinding {
  userId: string;
  listingId: string;
  contentType: string;
  contentLength: number;
  slot?: string;
  documentType?: string;
}

export interface UploadedObjectMetadata {
  byteSize: number;
  contentType: string;
  storageKey: string;
}

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.client = new S3Client({
      endpoint: this.config.getOrThrow<string>("STORAGE_ENDPOINT"),
      region: this.config.getOrThrow<string>("STORAGE_REGION"),
      forcePathStyle: this.config.get<boolean>("STORAGE_FORCE_PATH_STYLE") ?? true,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("STORAGE_ACCESS_KEY"),
        secretAccessKey: this.config.getOrThrow<string>("STORAGE_SECRET_KEY"),
      },
      requestHandler: new NodeHttpHandler({
        connectionTimeout: this.config.get<number>("STORAGE_CONNECT_TIMEOUT_MS") ?? 10_000,
        socketTimeout: this.config.get<number>("STORAGE_SOCKET_TIMEOUT_MS") ?? 30_000,
      }),
    });
  }

  async ping(): Promise<"up" | "down"> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket() }));
      return "up";
    } catch {
      return "down";
    }
  }

  async presignImage(userId: string, listingId: string, slot: string, contentType: string, contentLength: number) {
    return this.presignUpload("image", { userId, listingId, slot, contentType, contentLength }, contentType, contentLength);
  }

  async presignDocument(userId: string, listingId: string, documentType: string, contentType: string, contentLength: number) {
    return this.presignUpload("document", { userId, listingId, documentType, contentType, contentLength }, contentType, contentLength);
  }

  async inspectPendingUpload(
    storageKey: string,
    expectedKind: UploadKind,
    binding: UploadBinding,
  ): Promise<UploadedObjectMetadata> {
    const intent = await this.loadIntent(storageKey, expectedKind);
    assertIntentBinding(intent, binding);
    const claimed = await this.redisService.setIfAbsent(
      this.claimKey(storageKey),
      JSON.stringify(binding),
      this.presignTtl(),
    );
    if (!claimed) {
      throw new BadRequestException({
        code: "UPLOAD_ALREADY_REGISTERED",
        message: "Upload intent has already been claimed",
      });
    }

    try {
      const head = await this.headObject(storageKey);
      const contentType = head.ContentType ?? "";
      const byteSize = head.ContentLength ?? 0;

      if (contentType !== intent.contentType || byteSize !== intent.contentLength) {
        throw new BadRequestException({
          code: "INVALID_FILE_TYPE",
          message: "Uploaded object metadata does not match the presigned request",
        });
      }

      const signature = await this.readSignature(storageKey);
      if (!matchesMagicBytes(contentType, signature)) {
        throw new BadRequestException({
          code: "INVALID_FILE_TYPE",
          message: "Uploaded object bytes do not match the declared content type",
        });
      }

      return { byteSize, contentType, storageKey };
    } catch (error) {
      await this.redisService.del(this.claimKey(storageKey));
      throw error;
    }
  }

  async completePendingUpload(storageKey: string): Promise<void> {
    await this.redisService.del(this.intentKey(storageKey));
    await this.redisService.del(this.claimKey(storageKey));
  }

  async getDisplayUrl(storageKey: string): Promise<string> {
    const baseUrl = this.config.get<string>("STORAGE_PUBLIC_BASE_URL");
    if (baseUrl) {
      return `${baseUrl.replace(/\/$/, "")}/${this.bucket()}/${storageKey}`;
    }
    const expiresIn = 60 * 60;
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket(), Key: storageKey }),
      { expiresIn },
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.client.destroy();
  }

  private async presignUpload(
    kind: UploadKind,
    binding: UploadBinding,
    contentType: string,
    contentLength: number,
  ) {
    this.assertSize(kind, contentLength);
    const storageKey = this.createObjectKey(kind, contentType);
    const expiresIn = this.presignTtl();
    try {
      const uploadUrl = await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket(),
          Key: storageKey,
          ContentType: contentType,
          ContentLength: contentLength,
        }),
        { expiresIn },
      );

      await this.redisService.set(
        this.intentKey(storageKey),
        JSON.stringify({ ...binding, kind, contentType, contentLength } satisfies UploadIntent),
        expiresIn,
      );

      return {
        uploadUrl,
        storageKey,
        expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
      };
    } catch {
      throw new BadGatewayException({
        code: "PRESIGN_FAILED",
        message: "Failed to prepare upload URL",
      });
    }
  }

  private async loadIntent(storageKey: string, expectedKind: UploadKind): Promise<UploadIntent> {
    const raw = await this.redisService.get(this.intentKey(storageKey));
    if (!raw) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Upload intent expired or was not issued by the API",
      });
    }
    const parsed = parseIntent(raw);
    if (parsed.kind !== expectedKind) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Upload kind does not match the register endpoint",
      });
    }
    return parsed;
  }

  private async headObject(storageKey: string) {
    try {
      return await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket(),
        Key: storageKey,
      }));
    } catch {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Uploaded object was not found",
      });
    }
  }

  private async readSignature(storageKey: string): Promise<Uint8Array> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket(),
      Key: storageKey,
      Range: "bytes=0-31",
    }));
    if (!response.Body || !("transformToByteArray" in response.Body)) {
      throw new InternalServerErrorException({
        code: "INVALID_FILE_TYPE",
        message: "Unable to inspect uploaded object bytes",
      });
    }
    return response.Body.transformToByteArray();
  }

  private createObjectKey(kind: UploadKind, contentType: string): string {
    const date = new Date();
    const year = `${date.getUTCFullYear()}`;
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    const fileId = randomUUID();
    const prefix = kind === "image" ? "listing-images" : "seller-documents";
    return `${prefix}/${year}/${month}/${fileId}.${extensionFor(contentType)}`;
  }

  private intentKey(storageKey: string): string {
    return `tenant:${this.tenantKey()}:upload-intent:${storageKey}`;
  }

  private claimKey(storageKey: string): string {
    return `tenant:${this.tenantKey()}:upload-claim:${storageKey}`;
  }

  private tenantKey(): string {
    return TenantContext.current()?.tenantId ?? "unscoped";
  }

  private bucket(): string {
    return this.config.getOrThrow<string>("STORAGE_BUCKET");
  }

  private presignTtl(): number {
    return this.config.get<number>("STORAGE_PRESIGN_TTL_SECONDS") ?? 900;
  }

  private assertSize(kind: UploadKind, contentLength: number): void {
    const key = kind === "image" ? "MAX_IMAGE_UPLOAD_BYTES" : "MAX_DOCUMENT_UPLOAD_BYTES";
    const hardMaximum = kind === "image" ? 10 * 1024 * 1024 : 15 * 1024 * 1024;
    const configuredMaximum = this.config.get<number>(key) ?? hardMaximum;
    const maximum = Math.min(configuredMaximum, hardMaximum);
    if (contentLength > maximum) {
      throw new BadRequestException({
        code: "FILE_TOO_LARGE",
        message: `Uploaded ${kind} exceeds the maximum allowed size`,
      });
    }
  }
}

function parseIntent(raw: string): UploadIntent {
  try {
    const parsed = JSON.parse(raw) as UploadIntent;
    if (!parsed.userId || !parsed.listingId || !parsed.kind || !parsed.contentType || !parsed.contentLength) {
      throw new Error("invalid intent");
    }
    return parsed;
  } catch {
    throw new BadRequestException({
      code: "INVALID_FILE_TYPE",
      message: "Upload intent is invalid or expired",
    });
  }
}

function assertIntentBinding(intent: UploadIntent, binding: UploadBinding): void {
  const matches = intent.userId === binding.userId
    && intent.listingId === binding.listingId
    && intent.contentType === binding.contentType
    && intent.contentLength === binding.contentLength
    && intent.slot === binding.slot
    && intent.documentType === binding.documentType;
  if (!matches) {
    throw new BadRequestException({
      code: "UPLOAD_OWNERSHIP_MISMATCH",
      message: "Upload intent does not belong to this listing or seller",
    });
  }
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Unsupported content type",
      });
  }
}

function matchesMagicBytes(contentType: string, bytes: Uint8Array): boolean {
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a;
  }
  if (contentType === "image/webp") {
    return text(bytes, 0, 4) === "RIFF" && text(bytes, 8, 12) === "WEBP";
  }
  if (contentType === "application/pdf") {
    return text(bytes, 0, 5) === "%PDF-";
  }
  return false;
}

function text(bytes: Uint8Array, start: number, end: number): string {
  return Buffer.from(bytes.slice(start, end)).toString("ascii");
}
