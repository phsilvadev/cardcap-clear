"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { validateProductImage } from "@/lib/menu/image-validation";

export const useProductImagePicker = (
  onChange: (file: File | null) => void,
) => {
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const message = validateProductImage(file);
    setError(message);
    if (message) {
      event.target.value = "";
      setPreview("");
      setName("");
      onChange(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
    setName(file.name);
    onChange(file);
  };

  return { preview, name, error, selectImage };
};
