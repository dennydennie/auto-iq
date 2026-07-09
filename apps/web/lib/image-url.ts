export function shouldBypassNextImageOptimization(src: string | null | undefined) {
  if (!src) return false;

  try {
    const url = new URL(src);
    return (
      url.searchParams.has("X-Amz-Signature") ||
      url.searchParams.has("X-Amz-Credential") ||
      url.hostname.endsWith(".storageapi.dev")
    );
  } catch {
    return false;
  }
}
