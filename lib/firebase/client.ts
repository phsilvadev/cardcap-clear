"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseOptions: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredVariables = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseOptions.apiKey],
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", firebaseOptions.authDomain],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseOptions.projectId],
  ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", firebaseOptions.storageBucket],
  [
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    firebaseOptions.messagingSenderId,
  ],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseOptions.appId],
] as const;

export function getFirebaseApp(): FirebaseApp {
  const missing = requiredVariables
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Configure as variáveis do Firebase no arquivo .env.local: ${missing.join(", ")}`,
    );
  }

  return getApps().some((app) => app.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseOptions);
}

export const getFirebaseAuth = () => getAuth(getFirebaseApp());
export const getFirebaseDb = () => getFirestore(getFirebaseApp());
export const getFirebaseStorage = () => getStorage(getFirebaseApp());
export const getFirebaseFunctions = () =>
  getFunctions(getFirebaseApp(), "southamerica-east1");
