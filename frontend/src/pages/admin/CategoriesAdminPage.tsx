import { useEffect, useMemo, useState } from "react";
import type { Category } from "../../api";
import { useAdmin } from "../../admin-context";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FeedbackBanner } from "../../components/FeedbackBanner";

function CategoryFormDrawer({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { createCategory, updateCategory } = useAdmin();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setName(category?.name ?? ""); setDescription(category?.description ?? ""); }, [category]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (category) await updateCategory(category.id, { name, description });
      else await createCategory({ name, description });
      onClose();
    } catch (reason) { setError((reason as Error).message); }
    finally { setSaving(false); }
  }

  return <><button className="drawer-backdrop" type="button" aria-label="Đóng biểu mẫu" onClick={onClose} /><aside className="form-drawer" aria-label={category ? "Sửa danh mục" : "Thêm danh mục"}>
    <header><div><span className="admin-kicker">{category ? "CHỈNH SỬA DANH MỤC" : "DANH MỤC MỚI"}</span><h2>{category ? category.name : "Thêm danh mục"}</h2></div><button type="button" onClick={onClose}>Đóng</button></header>
    <form onSubmit={submit}>
      <div className="form-section"><label>Tên danh mục<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} placeholder="Linen, Cotton, Kaki..." required autoFocus /></label><label>Mô tả<textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} placeholder="Ghi chú ngắn về nhóm chất liệu này (không bắt buộc)" /></label>{category && category.product_count > 0 && <p className="form-hint">Đổi tên sẽ cập nhật luôn {category.product_count} sản phẩm đang thuộc danh mục này.</p>}</div>
      {error && <p className="form-error">{error}</p>}
      <footer><button className="secondary-action" type="button" onClick={onClose}>Hủy</button><button className="admin-primary" disabled={saving} type="submit">{saving ? "Đang lưu..." : category ? "Lưu thay đổi" : "Tạo danh mục"}</button></footer>
    </form>
  </aside></>;
}

export function CategoriesAdminPage() {
  const { categories, loading, deleteCategory } = useAdmin();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return categories.filter((item) => !keyword || `${item.name} ${item.description ?? ""}`.toLocaleLowerCase().includes(keyword));
  }, [categories, search]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try { await deleteCategory(deleting.id); }
    catch { /* loi da hien o FeedbackBanner */ }
    finally { setDeleteBusy(false); setDeleting(null); }
  }

  return <>
    <FeedbackBanner />
    <section className="admin-toolbar"><div className="admin-search"><span>Tìm danh mục</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoặc mô tả..." /></div><button className="admin-primary" type="button" onClick={() => setEditing(null)}>Thêm danh mục</button></section>
    <section className="admin-card table-card"><header className="table-card-head"><div><span className="admin-kicker">NHÓM CHẤT LIỆU</span><h2>{filtered.length} danh mục</h2></div><span>Danh mục dùng để phân loại sản phẩm và lọc ở cửa hàng</span></header>
      {loading ? <div className="admin-loading">Đang tải danh mục...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Danh mục</th><th>Mô tả</th><th>Sản phẩm</th><th>Ngày tạo</th><th aria-label="Thao tác" /></tr></thead><tbody>{filtered.map((category) => <tr key={category.id}><td><strong>{category.name}</strong></td><td><span className="line-clamp">{category.description || "—"}</span></td><td><span className="stock-count">{category.product_count}</span></td><td>{new Date(category.created_at).toLocaleDateString("vi-VN")}</td><td><div className="row-actions"><button type="button" onClick={() => setEditing(category)}>Sửa</button><button className="danger-link" type="button" onClick={() => setDeleting(category)}>Xóa</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="admin-empty">{categories.length === 0 ? "Chưa có danh mục nào. Bấm “Thêm danh mục” để bắt đầu." : "Không có danh mục phù hợp."}</div>}</div>}
    </section>
    {editing !== undefined && <CategoryFormDrawer category={editing} onClose={() => setEditing(undefined)} />}
    {deleting && <ConfirmDialog title={`Xóa danh mục “${deleting.name}”?`} description={deleting.product_count > 0 ? `Danh mục đang có ${deleting.product_count} sản phẩm nên chưa xóa được. Hãy chuyển các sản phẩm đó sang danh mục khác trước.` : "Danh mục sẽ bị xóa khỏi hệ thống. Thao tác này không ảnh hưởng tới sản phẩm nào."} confirmLabel="Xóa danh mục" confirmDisabled={deleting.product_count > 0} busy={deleteBusy} onCancel={() => setDeleting(null)} onConfirm={() => void confirmDelete()} />}
  </>;
}
