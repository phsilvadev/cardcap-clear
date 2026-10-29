import { useEffect, useState } from "react";
import { getProductImageUrl } from "@/lib/menu/service";

export const useProductImage = (imagePath?: string) => {
  const [image, setImage] = useState<{ path: string; url?: string } | null>(
    null,
  );
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!imagePath) return;
    let active = true;
    getProductImageUrl(imagePath)
      .then((url) => {
        if (active) setImage({ path: imagePath, url });
      })
      .catch(() => {
        if (active) setImage({ path: imagePath });
      });
    return () => {
      active = false;
    };
  }, [imagePath]);
  const url =
    image?.path === imagePath && image?.url !== failedUrl
      ? image?.url
      : undefined;
  const loading = Boolean(imagePath && image?.path !== imagePath);
  return { url, loading, onError: () => setFailedUrl(url ?? null) };
};
