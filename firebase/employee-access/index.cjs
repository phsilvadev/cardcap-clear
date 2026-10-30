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
