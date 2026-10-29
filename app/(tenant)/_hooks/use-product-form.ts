"use client";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import type { MenuCategory } from "@/lib/menu/category-types";
import {
  getMenuOwner,
  getProduct,
  listCategories,
  saveProduct,
  menuError,
} from "@/lib/menu/service";
import { parseProductPrice } from "@/lib/menu/product-validation";
import { useProductCustomization } from "@/app/(tenant)/_hooks/use-product-customization";
import { useProductImagePicker } from "@/app/(tenant)/_hooks/use-product-image-picker";
import { useProductImage } from "@/app/(tenant)/_hooks/use-product-image";

export function useProductForm(storeId: string, productId?: string) {
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    available: true,
  });
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string>();
  const picker = useProductImagePicker(setImage);
  const currentImage = useProductImage(imagePath);
  const customization = useProductCustomization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    Promise.all([
      getMenuOwner(storeId),
      listCategories(storeId),
      productId ? getProduct(storeId, productId) : Promise.resolve(null),
    ])
      .then(([owner, items, product]) => {
        if (!active) return;
        setCanManage(owner.canManage);
        setCategories(items);
        if (product) {
          setDraft({
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: String(product.priceCents / 100),
            available: product.available,
          });
          setImagePath(product.imagePath);
          customization.load(product.customization);
        }
      })
      .catch((error) => {
        if (active) setLoadError(menuError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId, productId, retryCount]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading || loadError || !canManage) return;
    if (picker.error) {
      setSaveError(picker.error);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await saveProduct(
        storeId,
        productId,
        {
          name: draft.name,
          description: draft.description,
          categoryId: draft.categoryId,
          priceCents: parseProductPrice(draft.price),
          available: draft.available,
          customization: customization.configuration,
        },
        image,
      );
      window.location.assign(
        `/dashboard/cardapio?salvo=${productId ? "editado" : "criado"}`,
      );
    } catch (error) {
      setSaveError(menuError(error));
      setSaving(false);
    }
  }
  const update = (fields: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...fields }));
  const retry = () => setRetryCount((value) => value + 1);
  const categoryCreated = (category: MenuCategory) => {
    setCategories((items) =>
      [...items, category].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    );
    update({ categoryId: category.id });
  };
  const cancel = (event: MouseEvent<HTMLAnchorElement>) => {
    if (saving) event.preventDefault();
  };

  return {
    draft,
    categories,
    picker,
    currentImage,
    customization,
    loading,
    saving,
    canManage,
    loadError,
    saveError,
    update,
    submit,
    retry,
    categoryCreated,
    cancel,
  };
}
