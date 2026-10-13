import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
import buyer from "./playwright.buyer.config";

const brave = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? (existsSync(brave) ? brave : undefined);
const servers = Array.isArray(buyer.webServer) ? buyer.webServer : [];
export default defineConfig({ ...buyer, webServer: [servers[0], { ...servers[1], url: "http://localhost:3200", command: "pnpm exec next dev --hostname localhost --port 3200" }], testMatch: "authentication.spec.ts", use: {
  ...buyer.use, baseURL: "http://localhost:3200", headless: true, launchOptions: { executablePath },
} });
