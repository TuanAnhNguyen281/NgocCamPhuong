import { useMemo, useState } from "react";
import type { Product } from "../../api";
import { useAdmin } from "../../admin-context";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FeedbackBanner } from "../../components/FeedbackBanner";
import { ProductFormDrawer } from "../../components/ProductFormDrawer";
import { formatMoney, productImage, productStatusLabel } from "../../utils";

export function ProductsAdminPage() {
  const { products, loading, deleteProduct } = useAdmin();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return products.filter((item) => (status === "all" || item.status === status) && (!keyword || `${item.name} ${item.sku} ${item.category ?? ""}`.toLocaleLowerCase().includes(keyword)));
  }, [products, search, status]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try { await deleteProduct(deleting.id); setDeleting(null); }
    finally { setDeleteBusy(false); }
  }

  return <>
    <FeedbackBanner />
    <section className="admin-toolbar"><div className="admin-search"><span>Tìm sản phẩm</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, SKU hoặc danh mục..." /></div><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả</option><option value="published">Đang bán</option><option value="draft">Bản nháp</option><option value="hidden">Đang ẩn</option><option value="archived">Ngừng bán</option></select></label><button className="admin-primary" type="button" onClick={() => setEditing(null)}>Thêm sản phẩm</button></section>
    <section className="admin-card table-card"><header className="table-card-head"><div><span className="admin-kicker">DANH MỤC HÀNG HÓA</span><h2>{filtered.length} sản phẩm</h2></div><span>Cập nhật trực tiếp giá, quy cách và tồn kho</span></header>
      {loading ? <div className="admin-loading">Đang tải sản phẩm...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Sản phẩm</th><th>Quy cách</th><th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="product-cell"><img src={productImage(product)} alt="" /><div><strong>{product.name}</strong><span>{product.sku} · {product.category || "Chưa phân loại"}</span></div></div></td><td>{product.fixed_meters} m / {product.unit_label}</td><td><strong>{formatMoney(product.price)}</strong></td><td><span className={product.stock_quantity <= 5 ? "stock-count low" : "stock-count"}>{product.stock_quantity}</span></td><td><span className={`status-pill ${product.status}`}>{productStatusLabel[product.status] ?? product.status}</span></td><td><div className="row-actions"><button type="button" onClick={() => setEditing(product)}>Sửa</button><button className="danger-link" type="button" onClick={() => setDeleting(product)}>Xóa</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="admin-empty">Không có sản phẩm phù hợp với bộ lọc.</div>}</div>}
    </section>
    {editing !== undefined && <ProductFormDrawer product={editing} onClose={() => setEditing(undefined)} />}
    {deleting && <ConfirmDialog title={`Xóa “${deleting.name}”?`} description="Sản phẩm sẽ biến mất khỏi danh mục và cửa hàng. Dữ liệu trong các đơn hàng cũ vẫn được giữ nguyên." busy={deleteBusy} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />}
  </>;
}
