// Builds a deployment package without evaluating unrelated payment/WhatsApp secrets.
// Run: node scripts/prepare-customer-deploy.cjs
// Then: firebase deploy --config .next/customer-deploy.firebase.json --only functions:employee-access:customerOperations,functions:employee-access:publicCheckout --project cardap-e0bf0
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "firebase", "employee-access");
const target = path.join(root, ".next", "customer-deploy");
fs.mkdirSync(target, { recursive: true });
for (const file of fs.readdirSync(source)) {
  if (
    (file.endsWith(".cjs") && !file.endsWith(".test.cjs")) ||
    ["package.json", "package-lock.json"].includes(file)
  )
    fs.copyFileSync(path.join(source, file), path.join(target, file));
}
fs.writeFileSync(
  path.join(target, "index.cjs"),
  `
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { createCustomer } = require("./customer.cjs");
const { createCheckout } = require("./checkout.cjs");
initializeApp();
const deps = { db: getFirestore(), auth: getAuth(), HttpsError, timestamp: () => FieldValue.serverTimestamp() };
exports.customerOperations = onCall({ region: "southamerica-east1", maxInstances: 5, timeoutSeconds: 60 }, createCustomer(deps).handler);
exports.publicCheckout = onCall({ region: "southamerica-east1", maxInstances: 5, timeoutSeconds: 60, enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true" }, createCheckout({ ...deps, pixEnabled: () => process.env.CHECKOUT_PIX_ENABLED === "true" }).handler);
`,
);
if (!fs.existsSync(path.join(target, "node_modules")))
  fs.symlinkSync(
    path.join(source, "node_modules"),
    path.join(target, "node_modules"),
    "junction",
  );
fs.writeFileSync(
  path.join(root, ".next", "customer-deploy.firebase.json"),
  JSON.stringify(
    {
      functions: [
        {
          source: "customer-deploy",
          codebase: "employee-access",
          ignore: [
            "node_modules",
            ".git",
            "*.log",
            "**/*.test.cjs",
            "backfill-store-search.cjs",
          ],
        },
      ],
    },
    null,
    2,
  ),
);
console.log(
  "Prepared .next/customer-deploy.firebase.json (customerOperations + publicCheckout).",
);
