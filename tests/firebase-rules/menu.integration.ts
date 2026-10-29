import { test, expect } from "@playwright/test";
import { initializeApp, deleteApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getDoc,
  getFirestore,
  doc,
  deleteDoc,
  terminate,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  getBytes,
  ref,
  deleteObject,
} from "firebase/storage";
import {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "../../lib/firebase/client";
import {
  createCategory,
  listCategories,
  saveProduct,
  getProduct,
  listProducts,
  setProductAvailability,
  removeProduct,
} from "../../lib/menu/service";
import { parseProductPrice } from "../../lib/menu/product-validation";

const projectId = "demo-cardap-test";
let ownerUid: string;
let otherUid: string;
let productId: string;
let categoryId: string;
let otherApp: ReturnType<typeof initializeApp>;
let otherAuth: ReturnType<typeof getAuth>;
let otherDb: ReturnType<typeof getFirestore>;
let otherStorage: ReturnType<typeof getStorage>;
const password = "Test-Only!12345";
const ownerEmail = "owner@example.test";
const image = new File(
  [
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXs0AAAAASUVORK5CYII=",
      "base64",
    ),
  ],
  "produto.png",
  { type: "image/png" },
);
async function seedTenant(uid: string, status = "configured") {
  const response = await fetch(
    `http://127.0.0.1:8180/v1/projects/${projectId}/databases/(default)/documents/tenants/${uid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          ownerUid: { stringValue: uid },
          name: { stringValue: "Loja de teste" },
          status: { stringValue: status },
          asaasWalletId: { stringValue: "test_wallet_only" },
        },
      }),
    },
  );
  expect(response.ok).toBe(true);
}
test.describe.serial("CRUD do cardápio com regras reais nos emuladores", () => {
  test.beforeAll(async () => {
    if (
      process.env.GCLOUD_PROJECT !== projectId ||
      !process.env.FIRESTORE_EMULATOR_HOST ||
      !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !process.env.FIREBASE_STORAGE_EMULATOR_HOST
    )
      throw new Error(
        "Execute somente pelo comando test:menu:rules nos emuladores demo-cardap-test.",
      );
    Object.assign(process.env, {
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-cardap-test.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${projectId}.appspot.com`,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
      NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
    });
    const app = getFirebaseApp();
    connectAuthEmulator(getFirebaseAuth(), "http://127.0.0.1:9190", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(getFirebaseDb(), "127.0.0.1", 8180);
    connectStorageEmulator(getFirebaseStorage(), "127.0.0.1", 9299);
    otherApp = initializeApp(app.options, "other-owner");
    otherAuth = getAuth(otherApp);
    otherDb = getFirestore(otherApp);
    otherStorage = getStorage(otherApp);
    connectAuthEmulator(otherAuth, "http://127.0.0.1:9190", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(otherDb, "127.0.0.1", 8180);
    connectStorageEmulator(otherStorage, "127.0.0.1", 9299);
    ownerUid = (
      await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        ownerEmail,
        password,
      )
    ).user.uid;
    otherUid = (
      await createUserWithEmailAndPassword(
        otherAuth,
        "other@example.test",
        password,
      )
    ).user.uid;
    await seedTenant(ownerUid);
    await seedTenant(otherUid);
  });
  test.afterAll(async () => {
    if (otherDb) await terminate(otherDb);
    if (otherApp) await deleteApp(otherApp);
    await terminate(getFirebaseDb());
    await deleteApp(getFirebaseApp());
  });
  test("cria categoria e rejeita duplicata", async () => {
    const category = await createCategory(ownerUid, "Pratos principais");
    categoryId = category.id;
    expect((await listCategories(ownerUid)).map((item) => item.id)).toContain(
      categoryId,
    );
    await expect(createCategory(ownerUid, "Pratos principais")).rejects.toThrow(
      "Já existe",
    );
  });
  test("cadastra produto com foto, complementos e divisão", async () => {
    productId = await saveProduct(
      ownerUid,
      undefined,
      {
        name: "Pizza da casa",
        description: "Produto de teste",
        categoryId,
        priceCents: parseProductPrice("39,90"),
        available: true,
        customization: {
          groups: [
            {
              name: "Adicionais",
              min: 0,
              max: 1,
              repeat: false,
              options: [{ name: "Queijo", priceCents: 500 }],
            },
          ],
          division: {
            maxParts: 2,
            pricing: "highest",
            options: [
              { name: "Calabresa", priceCents: 3990 },
              { name: "Mussarela", priceCents: 3590 },
            ],
          },
        },
      },
      image,
    );
    const product = await getProduct(ownerUid, productId);
    expect(product.priceCents).toBe(3990);
    expect(product.customization?.groups[0].options[0].name).toBe("Queijo");
    expect(
      (await getBytes(ref(getFirebaseStorage(), product.imagePath))).byteLength,
    ).toBeGreaterThan(0);
    expect(
      (await listProducts(ownerUid)).products.map((item) => item.id),
    ).toContain(productId);
  });
  test("edita sem perder foto e altera disponibilidade", async () => {
    const product = await getProduct(ownerUid, productId);
    await saveProduct(
      ownerUid,
      productId,
      { ...product, name: "Pizza atualizada", priceCents: 4590 },
      null,
    );
    await saveProduct(
      ownerUid,
      productId,
      { ...product, name: "Pizza atualizada", priceCents: 4590 },
      image,
    );
    await setProductAvailability(ownerUid, productId, false);
    const updated = await getProduct(ownerUid, productId);
    expect(updated.name).toBe("Pizza atualizada");
    expect(updated.priceCents).toBe(4590);
    expect(updated.available).toBe(false);
    expect(updated.imagePath).toBe(product.imagePath);
    expect(updated.customization).toEqual(product.customization);
  });
  test("outro tenant não lê nem exclui produto ou imagem", async () => {
    await expect(
      getDoc(doc(otherDb, "tenants", ownerUid, "products", productId)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      deleteDoc(doc(otherDb, "tenants", ownerUid, "products", productId)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      deleteObject(
        ref(otherStorage, `tenants/${ownerUid}/products/${productId}/image`),
      ),
    ).rejects.toMatchObject({ code: "storage/unauthorized" });
    await expect(
      getBytes(
        ref(otherStorage, `tenants/${ownerUid}/products/${productId}/image`),
      ),
    ).rejects.toMatchObject({ code: "storage/unauthorized" });
  });
  test("loja pendente não exclui produtos", async () => {
    await seedTenant(ownerUid, "pending");
    await expect(
      deleteDoc(
        doc(getFirebaseDb(), "tenants", ownerUid, "products", productId),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      deleteObject(
        ref(
          getFirebaseStorage(),
          `tenants/${ownerUid}/products/${productId}/image`,
        ),
      ),
    ).rejects.toMatchObject({ code: "storage/unauthorized" });
    await seedTenant(ownerUid, "suspended");
    await expect(
      deleteDoc(
        doc(getFirebaseDb(), "tenants", ownerUid, "products", productId),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      deleteObject(
        ref(
          getFirebaseStorage(),
          `tenants/${ownerUid}/products/${productId}/image`,
        ),
      ),
    ).rejects.toMatchObject({ code: "storage/unauthorized" });
    await seedTenant(ownerUid);
  });
  test("exclui produto e imagem com a conta proprietária", async () => {
    expect(await removeProduct(ownerUid, productId)).toBe("Produto excluído.");
    expect(
      (
        await getDoc(
          doc(getFirebaseDb(), "tenants", ownerUid, "products", productId),
        )
      ).exists(),
    ).toBe(false);
    await expect(
      getBytes(
        ref(
          getFirebaseStorage(),
          `tenants/${ownerUid}/products/${productId}/image`,
        ),
      ),
    ).rejects.toMatchObject({ code: "storage/object-not-found" });
  });
});
