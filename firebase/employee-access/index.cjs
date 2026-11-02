const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { createAccessLinkHandler } = require("./handler.cjs");
initializeApp();
exports.employeeAccessLink = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createAccessLinkHandler({ db: getFirestore(), auth: getAuth(), HttpsError }),
);

const { createCourierHandler } = require("./create-courier.cjs");
exports.employeeCreateCourier = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createCourierHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const { createCourierSessionHandler } = require("./courier-session.cjs");
const {
  createEnableCourierAccessHandler,
} = require("./enable-courier-access.cjs");
exports.courierGetSession = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createCourierSessionHandler({
    db: getFirestore(),
    auth: getAuth(),
    HttpsError,
  }),
);
exports.employeeEnableCourierAccess = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createEnableCourierAccessHandler({
    db: getFirestore(),
    auth: getAuth(),
    HttpsError,
  }),
);

const { createWaiterSessionHandler } = require("./waiter-session.cjs");
const {
  createEnableWaiterAccessHandler,
} = require("./enable-waiter-access.cjs");
const { createWaiterHandler } = require("./create-waiter.cjs");
exports.waiterGetSession = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createWaiterSessionHandler({
    db: getFirestore(),
    auth: getAuth(),
    HttpsError,
  }),
);
exports.employeeEnableWaiterAccess = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createEnableWaiterAccessHandler({
    db: getFirestore(),
    auth: getAuth(),
    HttpsError,
  }),
);
exports.employeeCreateWaiter = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createWaiterHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const { createOperationsHandler } = require("./operations.cjs");
exports.tenantSetOperations = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createOperationsHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const { createTenantOrders } = require("./tenant-orders.cjs");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const tenantOrders = createTenantOrders({
  db: getFirestore(),
  HttpsError,
  timestamp: () => FieldValue.serverTimestamp(),
});
exports.tenantOrderOperations = onCall(
  { region: "southamerica-east1", maxInstances: 5, timeoutSeconds: 120 },
  tenantOrders.handler,
);
exports.tenantOrderCreated = onDocumentCreated(
  {
    document: "tenants/{storeId}/orders/{orderId}",
    region: "southamerica-east1",
    maxInstances: 5,
    retry: true,
  },
  async (event) => {
    if (event.data?.data()?.status === "new")
      await tenantOrders.autoAccept(event.params.storeId, event.params.orderId);
  },
);

const { createLoginTransfer } = require("./login-transfer.cjs");
exports.tenantLoginTransfer = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createLoginTransfer({ db: getFirestore(), auth: getAuth(), HttpsError }),
);

const { getStorage } = require("firebase-admin/storage");
const { createStoreLogoHandler } = require("./store-logo.cjs");
exports.tenantSaveLogo = onCall(
  {
    region: "southamerica-east1",
    maxInstances: 3,
    concurrency: 10,
    memory: "256MiB",
  },
  createStoreLogoHandler({
    db: getFirestore(),
    bucket: getStorage().bucket(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const { createStoreProfileHandler } = require("./store-profile.cjs");
exports.tenantSaveProfile = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createStoreProfileHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const {
  createReceivingHandler,
  createStorefrontHandler,
} = require("./storefront.cjs");
exports.tenantSetReceivingOrders = onCall(
  { region: "southamerica-east1", maxInstances: 5 },
  createReceivingHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);
const publicImageCache = new Map();
exports.publicStorefront = onCall(
  { region: "southamerica-east1", maxInstances: 5, concurrency: 20 },
  createStorefrontHandler({
    db: getFirestore(),
    HttpsError,
    imageUrl: async (path) => {
      const cached = publicImageCache.get(path);
      if (cached && cached.expires > Date.now()) return cached.url;
      try {
        const bucket = getStorage().bucket();
        const [metadata] = await bucket.file(path).getMetadata();
        const token =
          metadata.metadata?.firebaseStorageDownloadTokens?.split(",")[0];
        const url = token
          ? `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(token)}`
          : null;
        if (publicImageCache.size >= 1000) publicImageCache.clear();
        publicImageCache.set(path, { url, expires: Date.now() + 60000 });
        return url;
      } catch (error) {
        if (error.code === 404) return null;
        throw new HttpsError(
          "unavailable",
          "Não foi possível carregar as imagens. Tente novamente.",
        );
      }
    },
  }),
);

const { createSalon } = require("./salon.cjs");
exports.salonOperations = onCall(
  { region: "southamerica-east1", maxInstances: 5, timeoutSeconds: 60 },
  createSalon({
    db: getFirestore(),
    auth: getAuth(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }).handler,
);

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { createStoreSearchSync } = require("./store-search.cjs");
exports.tenantStoreSearchUpdated = onDocumentWritten(
  {
    document: "tenants/{storeId}",
    region: "southamerica-east1",
    retry: true,
    maxInstances: 5,
  },
  createStoreSearchSync({ db: getFirestore() }),
);

const { defineSecret } = require("firebase-functions/params");
const { onRequest } = require("firebase-functions/v2/https");
const { createCheckout } = require("./checkout.cjs");
const { createCheckoutPix, validWebhookToken } = require("./checkout-pix.cjs");
const { createAsaas } = require("./asaas.cjs");
const asaasApiKey = defineSecret("ASAAS_API_KEY");
const asaasWebhookToken = defineSecret("ASAAS_WEBHOOK_TOKEN");
const checkout = createCheckout({
  db: getFirestore(),
  HttpsError,
  timestamp: () => FieldValue.serverTimestamp(),
  pixEnabled: () => process.env.CHECKOUT_PIX_ENABLED === "true",
});
const checkoutOptions = {
  region: "southamerica-east1",
  maxInstances: 5,
  timeoutSeconds: 60,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
exports.publicCheckout = onCall(checkoutOptions, checkout.handler);
const pix = createCheckoutPix({
  db: getFirestore(),
  checkout,
  HttpsError,
  timestamp: () => FieldValue.serverTimestamp(),
  provider: createAsaas({
    apiKey: () => asaasApiKey.value(),
    environment: process.env.ASAAS_ENVIRONMENT || "sandbox",
  }),
});
exports.publicCheckoutPix = onCall(
  { ...checkoutOptions, secrets: [asaasApiKey] },
  pix.handler,
);
exports.asaasCheckoutWebhook = onRequest(
  {
    region: "southamerica-east1",
    maxInstances: 5,
    secrets: [asaasApiKey, asaasWebhookToken],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).end();
      return;
    }
    if (
      !validWebhookToken(
        req.get("asaas-access-token"),
        asaasWebhookToken.value(),
      )
    ) {
      res.status(401).end();
      return;
    }
    if (
      req.rawBody?.length > 65536 ||
      typeof req.body?.payment?.id !== "string" ||
      !/^pay_[a-zA-Z0-9_-]+$/.test(req.body.payment.id)
    ) {
      res.status(400).end();
      return;
    }
    try {
      await pix.applyPayment(req.body.payment.id);
      res.status(200).json({ received: true });
    } catch {
      res.status(503).json({ received: false });
    }
  },
);

const { createWaitlistHandler } = require("./waitlist.cjs");
exports.publicJoinWaitlist = onCall(
  {
    region: "southamerica-east1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  createWaitlistHandler({
    db: getFirestore(),
    HttpsError,
    timestamp: () => FieldValue.serverTimestamp(),
  }),
);

const { createEvolution } = require("./evolution.cjs");
const { createWhatsAppHandler } = require("./whatsapp.cjs");
const evolutionApiKey = defineSecret("EVOLUTION_API_KEY");
exports.tenantWhatsAppIntegration = onCall(
  {
    region: "southamerica-east1",
    maxInstances: 5,
    timeoutSeconds: 60,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
    secrets: [evolutionApiKey],
  },
  createWhatsAppHandler({
    db: getFirestore(),
    HttpsError,
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      "cardap",
    timestamp: () => FieldValue.serverTimestamp(),
    provider: createEvolution({
      baseUrl: () => process.env.EVOLUTION_API_URL || "",
      apiKey: () => evolutionApiKey.value(),
    }),
  }),
);
