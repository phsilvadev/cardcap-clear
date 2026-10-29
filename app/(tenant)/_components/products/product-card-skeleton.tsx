export default function ProductCardSkeleton() {
  return (
    <div className="menu-product-row menu-product-skeleton" aria-hidden="true">
      <span className="menu-product-visual menu-skeleton-block" />
      <div className="menu-product-copy menu-skeleton-copy">
        <span className="menu-skeleton-block menu-skeleton-name" />
        <span className="menu-skeleton-block menu-skeleton-category" />
        <span className="menu-skeleton-block menu-skeleton-price" />
        <span className="menu-skeleton-block menu-skeleton-availability" />
      </div>
      <div className="menu-product-actions menu-skeleton-actions">
        <span className="menu-skeleton-block" />
        <span className="menu-skeleton-block" />
        <span className="menu-skeleton-block" />
      </div>
    </div>
  );
}
