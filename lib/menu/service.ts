"use client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "@/lib/firebase/client";
import type { MenuProduct, MenuProductInput } from "./types";
import type { MenuCategory } from "./category-types";
import { validateMenuProduct } from "./product-validation";
import { validateProductImage } from "./image-validation";
import { normalizeProductCustomization } from "./customization";
import {
  getMenuCategoryId,
  normalizeMenuCategory,
  validateMenuCategory,
} from "./category-validation";

export async function getMenuOwner(storeId: string) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  if (auth.currentUser?.uid !== storeId)
    throw new Error("Entre com a conta do proprietário desta loja.");
  const tenant = (
    await getDoc(doc(getFirebaseDb(), "tenants", storeId))
  ).data();
  if (!tenant || tenant.ownerUid !== storeId || tenant.status === "suspended")
    throw new Error("Você não tem acesso a esta loja.");
  return {
    canManage:
      tenant.status === "configured" &&
      typeof tenant.asaasWalletId === "string" &&
      /^[a-zA-Z0-9_-]{10,100}$/.test(tenant.asaasWalletId),
  };
}
async function requireManagement(storeId: string) {
  if (!(await getMenuOwner(storeId)).canManage)
    throw new Error(
      "Conclua os dados da loja e informe a carteira de recebimento no Anow antes de cadastrar ou alterar produtos.",
    );
}
function readProduct(
  item: { id: string; data: () => DocumentData },
  storeId: string,
): MenuProduct {
  const data = item.data();
  const fields = {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    priceCents: data.priceCents,
    available: data.available,
    ...(data.customization !== undefined
      ? { customization: data.customization }
      : {}),
  };
  if (
    data.storeId !== storeId ||
    validateMenuProduct(fields) ||
    data.imagePath !== `tenants/${storeId}/products/${item.id}/image`
  )
    throw new Error("Não foi possível carregar os dados do produto.");
  return { ...fields, id: item.id, storeId, imagePath: data.imagePath };
}
export async function listProducts(
  storeId: string,
  cursor?: QueryDocumentSnapshot,
) {
  await getMenuOwner(storeId);
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), "tenants", storeId, "products"),
      orderBy("name"),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(50),
    ),
  );
  return {
    products: snapshot.docs.map((item) => readProduct(item, storeId)),
    cursor: snapshot.docs.at(-1),
    hasMore: snapshot.size === 50,
  };
}
export async function getProduct(storeId: string, productId: string) {
  await getMenuOwner(storeId);
  const snapshot = await getDoc(
    doc(getFirebaseDb(), "tenants", storeId, "products", productId),
  );
  if (!snapshot.exists()) throw new Error("Produto não encontrado.");
  return readProduct(snapshot, storeId);
}
export async function listCategories(storeId: string): Promise<MenuCategory[]> {
  await getMenuOwner(storeId);
  const categories: MenuCategory[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  // Every request respects the rules' 50-document limit.
  for (;;) {
    const snapshot = await getDocs(
      query(
        collection(getFirebaseDb(), "tenants", storeId, "categories"),
        orderBy("name"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(50),
      ),
    );
    for (const item of snapshot.docs) {
      const data = item.data();
      if (
        data.storeId !== storeId ||
        validateMenuCategory({ name: data.name, description: data.description })
      )
        throw new Error("Categoria inválida.");
      categories.push({
        id: item.id,
        storeId,
        name: data.name,
        description: data.description,
      });
    }
    if (snapshot.size < 50) return categories;
    cursor = snapshot.docs.at(-1);
  }
}
export async function createCategory(storeId: string, name: string) {
  const fields = normalizeMenuCategory({ name, description: "" });
  const error = validateMenuCategory(fields);
  if (error) throw new Error(error);
  await requireManagement(storeId);
  const reference = doc(
    getFirebaseDb(),
    "tenants",
    storeId,
    "categories",
    getMenuCategoryId(fields.name),
  );
  await runTransaction(getFirebaseDb(), async (transaction) => {
    if ((await transaction.get(reference)).exists())
      throw new Error("Já existe uma categoria com esse nome.");
    transaction.set(reference, {
      ...fields,
      storeId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return { id: reference.id, storeId, ...fields };
}
export async function saveProduct(
  storeId: string,
  productId: string | undefined,
  input: MenuProductInput,
  image: File | null,
) {
  const error =
    validateMenuProduct(input) ||
    (!productId || image ? validateProductImage(image) : "");
  if (error) throw new Error(error);
  await requireManagement(storeId);
  const db = getFirebaseDb();
  const reference = productId
    ? doc(db, "tenants", storeId, "products", productId)
    : doc(collection(db, "tenants", storeId, "products"));
  const imagePath = `tenants/${storeId}/products/${reference.id}/image`;
  const categoryRef = doc(
    db,
    "tenants",
    storeId,
    "categories",
    input.categoryId,
  );
  if ((await getDoc(categoryRef)).data()?.storeId !== storeId)
    throw new Error("Selecione uma categoria desta loja.");
  if (image)
    await uploadBytes(ref(getFirebaseStorage(), imagePath), image, {
      contentType: image.type,
    });
  const fields = {
    name: input.name.trim(),
    description: input.description.trim(),
    categoryId: input.categoryId,
    priceCents: input.priceCents,
    available: input.available,
    customization: normalizeProductCustomization(
      input.customization ?? { groups: [], division: null },
    ),
  };
  await runTransaction(db, async (transaction) => {
    const category = await transaction.get(categoryRef);
    const existing = await transaction.get(reference);
    if (category.data()?.storeId !== storeId)
      throw new Error("Selecione uma categoria desta loja.");
    if (
      productId &&
      (!existing.exists() || existing.data().storeId !== storeId)
    )
      throw new Error("Produto não encontrado.");
    if (productId)
      transaction.update(reference, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    else
      transaction.set(reference, {
        ...fields,
        storeId,
        imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  });
  return reference.id;
}
export async function setProductAvailability(
  storeId: string,
  productId: string,
  available: boolean,
) {
  await requireManagement(storeId);
  await updateDoc(
    doc(getFirebaseDb(), "tenants", storeId, "products", productId),
    { available, updatedAt: serverTimestamp() },
  );
}
export async function removeProduct(storeId: string, productId: string) {
  await requireManagement(storeId);
  await deleteDoc(
    doc(getFirebaseDb(), "tenants", storeId, "products", productId),
  );
  try {
    await deleteObject(
      ref(
        getFirebaseStorage(),
        `tenants/${storeId}/products/${productId}/image`,
      ),
    );
  } catch (error) {
    if ((error as { code?: string }).code !== "storage/object-not-found")
      return "Produto excluído. Não foi possível remover a imagem do armazenamento.";
  }
  return "Produto excluído.";
}
export const getProductImageUrl = (imagePath: string) =>
  getDownloadURL(ref(getFirebaseStorage(), imagePath));
export function menuError(error: unknown) {
  if (error instanceof TypeError)
    return "Não foi possível concluir a operação. Verifique sua conexão e tente novamente.";
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied" || code === "storage/unauthorized")
    return "Você não tem permissão para esta operação. Confira o cadastro da loja e as regras do Firebase.";
  if (
    code === "unavailable" ||
    code === "auth/network-request-failed" ||
    code === "storage/retry-limit-exceeded"
  )
    return "Não foi possível conectar ao Firebase. Tente novamente.";
  if (code === "storage/quota-exceeded")
    return "O armazenamento atingiu o limite. Tente novamente mais tarde.";
  if (code) return "Não foi possível concluir a operação. Tente novamente.";
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
