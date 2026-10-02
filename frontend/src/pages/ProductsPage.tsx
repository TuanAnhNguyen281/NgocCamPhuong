import { useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/ProductGridSkeleton";
import { useApp } from "../app-context";

export function ProductsPage() {
  const { products, productsLoading, productsError } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState("featured");
  const categories = useMemo(() => ["Tất cả", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))) as string[]], [products]);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    const result = products.filter((product) => (category === "Tất cả" || product.category === category) && (!keyword || `${product.name} ${product.sku} ${product.category ?? ""}`.toLocaleLowerCase().includes(keyword)));
    return [...result].sort((a, b) => sort === "price-asc" ? Number(a.price) - Number(b.price) : sort === "price-desc" ? Number(b.price) - Number(a.price) : sort === "name" ? a.name.localeCompare(b.name, "vi") : b.id - a.id);
  }, [category, products, search, sort]);

  return <section className="catalog-page">
    <header className="catalog-hero"><div><p className="eyebrow">BỘ SƯU TẬP / 2026</p><h1>Vải của<br /><em>đời sống thật.</em></h1></div><p>Những chất vải quen thuộc, dễ ứng dụng, phù hợp cho may mặc, trang trí và nhiều điều đẹp đẽ khác. Mỗi đơn vị có số mét cố định để bạn chọn thật nhẹ nhàng.</p></header>
    <div className="catalog-toolbar">
      <label className="catalog-search"><span>Tìm kiếm</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên vải, SKU hoặc chất liệu..." /></label>
      <div className="category-tabs" role="tablist" aria-label="Lọc loại vải">{categories.map((item) => <button className={category === item ? "selected" : ""} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div>
      <label className="sort-control"><span>Sắp xếp</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Mới nhất</option><option value="name">Tên A–Z</option><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></select></label>
    </div>
    <div className="catalog-summary"><span>{filtered.length} chất liệu</span><span>Mét cố định · Giá minh bạch · Tồn kho thực</span></div>
    {productsLoading && products.length === 0 && <ProductGridSkeleton count={6} className="catalog-grid" />}
    {productsError && <p className="notice error">{productsError}</p>}
    {!productsLoading && !productsError && filtered.length === 0 && <div className="empty-state"><strong>Chưa tìm thấy chất liệu phù hợp.</strong><p>Thử đổi từ khóa hoặc chọn lại danh mục.</p><button type="button" onClick={() => { setSearch(""); setCategory("Tất cả"); }}>Xóa bộ lọc</button></div>}
    <div className="product-grid catalog-grid">{filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
  </section>;
}
