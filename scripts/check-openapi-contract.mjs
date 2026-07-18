import { readFileSync } from "node:fs";

const documentPath = process.env.OPENAPI_DOCUMENT;
if (!documentPath) {
  throw new Error("OPENAPI_DOCUMENT is required");
}

const document = JSON.parse(readFileSync(documentPath, "utf8"));
const requiredOperations = [
  ["/api/v1/auth/login", "post", "200"],
  ["/api/v1/auth/otp/verify", "post", "200"],
  ["/api/v1/storage/images/presign", "post", "201"],
  ["/api/v1/storage/documents/presign", "post", "201"],
  ["/api/v1/health/ready", "get", "200"],
  ["/api/v1/health/ready", "get", "503"],
];

const failures = [];
for (const [path, method, response] of requiredOperations) {
  const operation = document.paths?.[path]?.[method];
  if (!operation) {
    failures.push(`${method.toUpperCase()} ${path}: operation is missing`);
    continue;
  }
  if (!operation.responses?.[response]) {
    failures.push(`${method.toUpperCase()} ${path}: response ${response} is missing`);
  }
}

for (const schema of ["ImagePresignDto", "DocumentPresignDto"]) {
  const properties = document.components?.schemas?.[schema]?.properties ?? {};
  if (!properties.listingId) {
    failures.push(`${schema}: listingId is missing from the OpenAPI schema`);
  }
}

for (const schema of ["RegisterImageDto", "RegisterDocumentDto"]) {
  const properties = document.components?.schemas?.[schema]?.properties ?? {};
  for (const property of ["storageKey", "contentType", "contentLength"]) {
    if (!properties[property]) {
      failures.push(`${schema}: ${property} is missing from the OpenAPI schema`);
    }
  }
}

const uploadResponseProperties = document.components?.schemas?.PresignUploadResponseDto?.properties ?? {};
for (const property of ["uploadUrl", "storageKey", "expiresAt"]) {
  if (!uploadResponseProperties[property]) {
    failures.push(`PresignUploadResponseDto: ${property} is missing from the OpenAPI schema`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Verified ${requiredOperations.length} OpenAPI operations and upload DTO bindings.`);
