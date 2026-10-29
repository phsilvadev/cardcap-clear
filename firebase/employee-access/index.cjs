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
