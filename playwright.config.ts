import { defineConfig } from "@playwright/test";

// A suíte geral valida o sistema completo; os testes de pré-lançamento alternam o modo.
process.env.CARDAP_PRELAUNCH_ONLY = "false";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
      args: [
        "--host-resolver-rules=MAP cardap.* 127.0.0.1",
        "--no-proxy-server",
      ],
    },
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
  },
});
