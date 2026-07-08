const webUrl = process.env.WEB_BASE_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/vehicles",
  "/buy-a-car",
  "/sell-my-car",
  "/admin/login",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

async function smoke() {
  for (const route of routes) {
    const response = await fetch(new URL(route, webUrl));

    if (!response.ok) {
      throw new Error(`Web smoke failed for ${route} with status ${response.status}`);
    }

    console.log(`${route} -> ${response.status}`);
  }
}

smoke().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
