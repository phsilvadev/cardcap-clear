import { defineConfig } from "@playwright/test";
Object.assign(process.env, {
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-cardap-test.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-cardap-test",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo-cardap-test.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
});
export default defineConfig({
  testDir: "./tests/firebase-rules",
  testMatch: "**/*.integration.ts",
  workers: 1,
  timeout: 60000,
});
