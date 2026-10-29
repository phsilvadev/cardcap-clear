export const validateProductImage = (file: File | null): string => {
  if (!file) return "Selecione uma imagem para o produto.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Selecione uma imagem JPG, PNG ou WebP.";
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    return "A imagem deve ter até 5 MB e não pode estar vazia.";
  return "";
};
