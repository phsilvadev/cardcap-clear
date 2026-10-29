"use client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getMetadata, ref } from "firebase/storage";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "@/lib/firebase/client";
import { validateMenuProduct } from "@/lib/menu/product-validation";
import { validateMenuCategory } from "@/lib/menu/category-validation";
import { evaluateStoreReadiness } from "./readiness";

async function hasCategory(storeId: string) {
  let cursor: QueryDocumentSnapshot | undefined;
  for (;;) {
    const page = await getDocs(
      query(
        collection(getFirebaseDb(), "tenants", storeId, "categories"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(1),
      ),
    );
    const item = page.docs[0];
    if (!item) return false;
    const data = item.data();
    if (
      data.storeId === storeId &&
      !validateMenuCategory({ name: data.name, description: data.description })
    )
      return true;
    cursor = item;
  }
}
async function hasAvailableProduct(storeId: string) {
  let cursor: QueryDocumentSnapshot | undefined;
  const db = getFirebaseDb();
  for (;;) {
    const page = await getDocs(
      query(
        collection(db, "tenants", storeId, "products"),
        where("available", "==", true),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(1),
      ),
    );
    const item = page.docs[0];
    if (!item) return false;
    cursor = item;
    const product = item.data();
    const fields = {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      priceCents: product.priceCents,
      available: product.available,
      ...(product.customization !== undefined
        ? { customization: product.customization }
        : {}),
    };
    if (
      product.storeId !== storeId ||
      validateMenuProduct(fields) ||
      product.imagePath !== `tenants/${storeId}/products/${item.id}/image`
    )
      continue;
    const category = (
      await getDoc(
        doc(db, "tenants", storeId, "categories", product.categoryId),
      )
    ).data();
    if (
      !category ||
      category.storeId !== storeId ||
      validateMenuCategory({
        name: category.name,
        description: category.description,
      })
    )
      continue;
    try {
      const metadata = await getMetadata(
        ref(getFirebaseStorage(), product.imagePath),
      );
      if (
        metadata.size > 0 &&
        metadata.size <= 5 * 1024 * 1024 &&
        ["image/jpeg", "image/png", "image/webp"].includes(
          metadata.contentType ?? "",
        )
      )
        return true;
    } catch (error) {
      if ((error as { code?: string }).code !== "storage/object-not-found")
        throw error;
    }
  }
}
export async function getStoreReadiness(storeId: string) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (!storeId || auth.currentUser?.uid !== storeId)
    throw new Error(
      "Entre com a conta do proprietário para conferir o cadastro da loja.",
    );
  const tenant = (
    await getDoc(doc(getFirebaseDb(), "tenants", storeId))
  ).data();
  if (!tenant || tenant.ownerUid !== storeId)
    throw new Error("Não foi possível confirmar o cadastro desta loja.");
  const [categoriesReady, productReady] = await Promise.all([
    hasCategory(storeId),
    hasAvailableProduct(storeId),
  ]);
  const items = evaluateStoreReadiness(tenant, categoriesReady, productReady);
  return {
    items,
    completed: items.filter((item) => item.complete).length,
    total: items.length,
  };
}
