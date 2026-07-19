import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tmp/airadar-frontend/test-results",
  fullyParallel: false,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "es-ES",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve_frontend.mjs --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
