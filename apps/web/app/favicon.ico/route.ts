const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#0A1E4D"/>
  <path d="M32 7 54 20v24L32 57 10 44V20L32 7Z" fill="#FFC72C"/>
  <path d="M32 14 48 23v18L32 50 16 41V23l16-9Z" fill="#0A1E4D"/>
  <text x="32" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#FFC72C">B</text>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "cache-control": "public, max-age=31536000, immutable",
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}
