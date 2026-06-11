import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { RedisService } from "../redis/redis.service";

type UploadKind = "image" | "document";

interface UploadIntent {
  kind: UploadKind;
  contentType: string;
  contentLength: number;
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

  async presignImage(contentType: string, contentLength: number) {
    return this.presignUpload("image", contentType, contentLength);
  }

  async presignDocument(contentType: string, contentLength: number) {
    return this.presignUpload("document", contentType, contentLength);
  }

  async inspectPendingUpload(storageKey: string, expectedKind: UploadKind): Promise<UploadedObjectMetadata> {
    const intent = await this.loadIntent(storageKey, expectedKind);
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
  }

  async completePendingUpload(storageKey: string): Promise<void> {
    await this.redisService.del(this.intentKey(storageKey));
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

  private async presignUpload(kind: UploadKind, contentType: string, contentLength: number) {
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
        JSON.stringify({ kind, contentType, contentLength } satisfies UploadIntent),
        expiresIn,
      );

      return {
        uploadUrl,
        storageKey,
        expiresAt: new Date(Date.now() + expiresIn * 1_000).toISOString(),
      };
    } catch (error) {
      throw new BadGatewayException({
        code: "PRESIGN_FAILED",
        message: "Failed to prepare upload URL",
        details: [error instanceof Error ? error.message : "Unknown storage error"],
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
    const parsed = JSON.parse(raw) as UploadIntent;
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
    } catch (error) {
      throw new BadRequestException({
        code: "INVALID_FILE_TYPE",
        message: "Uploaded object was not found",
        details: [error instanceof Error ? error.message : "Object lookup failed"],
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
    return `upload-intent:${storageKey}`;
  }

  private bucket(): string {
    return this.config.getOrThrow<string>("STORAGE_BUCKET");
  }

  private presignTtl(): number {
    return this.config.get<number>("STORAGE_PRESIGN_TTL_SECONDS") ?? 900;
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
