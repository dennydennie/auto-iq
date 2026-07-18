"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import type {
  DocumentPresignRequest,
  DocumentPresignResponse,
  RegisterDocumentRequest,
  VehicleDocumentDto,
} from "@auto-iq/contracts/storage";
import type { DocumentType } from "@auto-iq/contracts/enums";
import { DOCUMENT_TYPES } from "@auto-iq/contracts/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { isApiFailure, postJson } from "@/lib/web-api";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

function humanType(type: DocumentType) {
  return type.toLowerCase().replace(/_/g, " ");
}

/**
 * Presigned upload flow for listing ownership documents.
 * Mirrors the photo uploader — one slot per DocumentType enum value.
 */
export function DocumentUploader({
  listingId,
  documents: initialDocuments,
}: {
  listingId: string;
  documents: VehicleDocumentDto[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VehicleDocumentDto[]>(initialDocuments);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [isPending, startTransition] = useTransition();

  const byType = new Map(documents.map((doc) => [doc.documentType, doc]));

  async function upload(file: File, documentType: DocumentType) {
    setUploadingType(documentType);

    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      toast({
        title: "Unsupported file type",
        description: "Use a PDF, JPEG, or PNG file.",
        variant: "error",
      });
      setUploadingType(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: "Documents must be 15 MB or smaller.",
        variant: "error",
      });
      setUploadingType(null);
      return;
    }

    const presignBody: DocumentPresignRequest = {
      listingId,
      documentType,
      contentType: file.type as DocumentPresignRequest["contentType"],
      contentLength: file.size,
    };

    startTransition(async () => {
      const presignResult = await postJson<DocumentPresignResponse>(
        "/api/seller/storage/documents/presign",
        presignBody,
      );
      if (isApiFailure(presignResult)) {
        toast({
          title: "Couldn't start upload",
          description: presignResult.error.message,
          variant: "error",
        });
        setUploadingType(null);
        return;
      }

      const putResponse = await fetch(presignResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      }).catch(() => null);

      if (!putResponse || !putResponse.ok) {
        toast({
          title: "Upload failed",
          description: "The document couldn't be uploaded to storage. Try again.",
          variant: "error",
        });
        setUploadingType(null);
        return;
      }

      const registerBody: RegisterDocumentRequest = {
        storageKey: presignResult.data.storageKey,
        documentType,
        contentType: file.type as RegisterDocumentRequest["contentType"],
        contentLength: file.size,
      };
      const registerResult = await postJson<VehicleDocumentDto>(
        `/api/seller/listings/${listingId}/documents`,
        registerBody,
      );
      if (isApiFailure(registerResult)) {
        toast({
          title: "Upload registered but not saved",
          description: registerResult.error.message,
          variant: "error",
        });
        setUploadingType(null);
        return;
      }

      setDocuments((current) => {
        const next = current.filter((doc) => doc.documentType !== documentType);
        next.push(registerResult.data);
        return next;
      });
      setUploadingType(null);
      toast({
        title: `${humanType(documentType)} uploaded`,
        description: "Saved to your listing draft. Admin reviews before publish.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Documents</CardTitle>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Ownership and roadworthiness paperwork. Admin reviews each document before
              your listing goes live.
            </p>
          </div>
          <Badge variant="outline">{documents.length} / {DOCUMENT_TYPES.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {DOCUMENT_TYPES.map((documentType) => {
            const existing = byType.get(documentType);
            const busy = uploadingType === documentType && isPending;
            const status = existing?.reviewStatus;
            return (
              <label
                key={documentType}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/60 p-4 transition hover:border-[var(--amber-dark)]",
                  existing ? "border-solid border-[var(--ink-100)] bg-white" : "",
                  busy ? "cursor-progress" : "",
                )}
              >
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file, documentType);
                    event.target.value = "";
                  }}
                />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--amber-dark)]">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : existing ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink-900)]">
                    {humanType(documentType)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-500)]">
                    {busy
                      ? "Uploading…"
                      : existing
                        ? `Uploaded. Review status: ${status?.toLowerCase() ?? "pending"}`
                        : "PDF, JPEG, or PNG — up to 15 MB"}
                  </p>
                  {status === "REJECTED" && existing?.reviewNote ? (
                    <p className="mt-2 text-xs text-[var(--reject)]">
                      Rejected: {existing.reviewNote}
                    </p>
                  ) : null}
                </div>
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-300)]" aria-hidden="true" />
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
