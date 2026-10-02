export function ProductGridSkeleton({ count, className }: { count: number; className: string }) {
  return <div className={`product-grid ${className}`} aria-busy="true" aria-label="Đang tải bộ sưu tập">
    {Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index} aria-hidden="true">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-line short" />
      <div className="skeleton skeleton-line medium" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line button" />
    </div>)}
  </div>;
}
