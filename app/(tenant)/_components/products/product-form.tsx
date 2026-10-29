"use client";
import { useProductForm } from "@/app/(tenant)/_hooks/use-product-form";
import ProductCustomizationFields from "./product-customization-fields";
import ProductGroupDialog from "./product-group-dialog";
import CategoryCreate from "./category-create";

export default function ProductForm({
  storeId,
  productId,
}: {
  storeId: string;
  productId?: string;
}) {
  const {
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
  } = useProductForm(storeId, productId);
  if (loading) return <p role="status">Carregando formulário…</p>;
  if (loadError)
    return (
      <div className="panel">
        <p role="alert">{loadError}</p>
        <button className="button secondary" onClick={retry}>
          Tentar novamente
        </button>
      </div>
    );
  if (!canManage)
    return (
      <div className="panel">
        <h2>Conclua o cadastro da loja</h2>
        <p>
          Finalize os dados da loja e informe a carteira de recebimento no Anow
          para gerenciar seu cardápio.
        </p>
        <a className="button secondary" href="/dashboard/cardapio">
          Voltar ao cardápio
        </a>
      </div>
    );
  return (
    <>
      <form
        className="dashboard-product-form product-editor mt-4"
        onSubmit={submit}
      >
        <fieldset className="product-form-fields" disabled={saving}>
          <section
            className="product-form-section"
            aria-labelledby="product-basic-title"
          >
            <h2 id="product-basic-title">Dados do produto</h2>
            <label>
              Nome do produto
              <input
                required
                minLength={2}
                maxLength={100}
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Ex.: Produto da casa"
              />
            </label>
            <label>
              Descrição
              <textarea
                rows={3}
                maxLength={500}
                value={draft.description}
                onChange={(event) =>
                  update({ description: event.target.value })
                }
                placeholder="Ingredientes, porção, peso ou outras informações"
              />
            </label>
            <div className="form-grid">
              <label>
                Categoria
                <select
                  required
                  value={draft.categoryId}
                  onChange={(event) =>
                    update({ categoryId: event.target.value })
                  }
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Preço base (R$)
                <input
                  required
                  type="number"
                  min="0.01"
                  max="999999.99"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => update({ price: event.target.value })}
                  placeholder="29,90"
                />
              </label>
            </div>
            {!categories.length && (
              <p>Cadastre uma categoria para organizar seu primeiro produto.</p>
            )}
            <CategoryCreate
              storeId={storeId}
              disabled={saving}
              onCreated={categoryCreated}
            />
            <div className="product-image-field">
              <label>
                Imagem do produto
                <input
                  type="file"
                  required={!productId}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={picker.selectImage}
                  aria-describedby="product-image-hint"
                />
              </label>
              {(picker.preview || currentImage.url) && (
                <img
                  className="product-image-preview"
                  src={picker.preview || currentImage.url}
                  alt="Prévia da imagem do produto"
                  onError={picker.preview ? undefined : currentImage.onError}
                />
              )}
              <p id="product-image-hint">
                JPG, PNG ou WebP, até 5 MB.
                {productId
                  ? " Selecione uma nova imagem apenas se quiser substituir a atual."
                  : ""}
              </p>
              {picker.error && <p role="alert">{picker.error}</p>}
            </div>
            <label className="product-check">
              <input
                type="checkbox"
                checked={draft.available}
                onChange={(event) =>
                  update({ available: event.target.checked })
                }
              />
              Disponível no cardápio
            </label>
          </section>
          <ProductCustomizationFields control={customization} />
        </fieldset>
        {saveError && <p role="alert">{saveError}</p>}
        <div className="dialog-actions">
          <a
            className="button secondary"
            href="/dashboard/cardapio"
            aria-disabled={saving}
            onClick={cancel}
          >
            Cancelar
          </a>
          <button
            className="button primary"
            type="submit"
            disabled={saving || !categories.length}
          >
            {saving ? "Salvando…" : "Salvar produto"}
          </button>
        </div>
      </form>
      <ProductGroupDialog control={customization} />
    </>
  );
}
