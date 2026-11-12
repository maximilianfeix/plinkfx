import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:4173/", launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] } },
  webServer: { command: "node scripts/serve.ts site 4173", url: "http://localhost:4173/", reuseExistingServer: !process.env.CI },
});
