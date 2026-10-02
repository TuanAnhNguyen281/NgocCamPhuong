import { useEffect, useState } from "react";
import { uploadProductImage, type Product } from "../api";
import { useAdmin, type ProductPayload } from "../admin-context";
import { useApp } from "../app-context";
import { ImageLightbox } from "./ImageLightbox";

const emptyProduct: ProductPayload = {
  sku: "",
  name: "",
  description: "",
  category: "",
  image_url: "",
  fixed_meters: 1,
  unit_label: "gói",
  price: 0,
  stock_quantity: 0,
  status: "draft",
};

export function ProductFormDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { categories, createProduct, updateProduct } = useAdmin();
  const { auth } = useApp();
  const [form, setForm] = useState<ProductPayload>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  // Anh vua chon tu may, hien ngay trong luc dang tai len Cloudinary.
  const [localPreview, setLocalPreview] = useState("");
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setForm(product ? {
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "",
      image_url: product.image_url ?? "",
      fixed_meters: Number(product.fixed_meters),
      unit_label: product.unit_label,
      price: Number(product.price),
      stock_quantity: product.stock_quantity,
      status: product.status,
    } : emptyProduct);
  }, [product]);

  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  function field<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !auth) return;
    setUploading(true); setLocalError("");
    setLocalPreview(URL.createObjectURL(file));
    try {
      const result = await uploadProductImage(auth.token, file);
      field("image_url", result.url);
    } catch (reason) {
      setLocalError((reason as Error).message);
    } finally {
      setLocalPreview("");
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setLocalError("");
    try {
      if (product) await updateProduct(product.id, form);
      else await createProduct(form);
      onClose();
    } catch (reason) {
      setLocalError((reason as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const previewImage = localPreview || form.image_url || "";
  const previewName = form.name || "Ảnh sản phẩm";
  // San pham cu co the mang ten danh muc da bi xoa; van hien de khong mat lua chon.
  const categoryOptions = form.category && !categories.some((item) => item.name === form.category) ? [form.category, ...categories.map((item) => item.name)] : categories.map((item) => item.name);

  return <><button className="drawer-backdrop" type="button" aria-label="Đóng biểu mẫu" onClick={onClose} /><aside className="form-drawer" aria-label={product ? "Sửa sản phẩm" : "Thêm sản phẩm"}>
    <header><div><span className="admin-kicker">{product ? "CHỈNH SỬA SẢN PHẨM" : "SẢN PHẨM MỚI"}</span><h2>{product ? product.name : "Thêm vào danh mục"}</h2></div><button type="button" onClick={onClose}>Đóng</button></header>
    <form onSubmit={submit}>
      <div className="form-section"><h3>Thông tin cơ bản</h3><div className="form-grid two"><label>Tên sản phẩm<input value={form.name} onChange={(event) => field("name", event.target.value)} required /></label><label>SKU<input value={form.sku} onChange={(event) => field("sku", event.target.value)} required /></label></div><div className="form-grid two"><label>Danh mục<select value={form.category ?? ""} onChange={(event) => field("category", event.target.value)}><option value="">Chưa phân loại</option>{categoryOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label>Trạng thái<select value={form.status} onChange={(event) => field("status", event.target.value)}><option value="draft">Bản nháp</option><option value="published">Đang bán</option><option value="hidden">Đang ẩn</option><option value="archived">Ngừng bán</option></select></label></div><label>Mô tả<textarea rows={4} value={form.description ?? ""} onChange={(event) => field("description", event.target.value)} placeholder="Mô tả chất liệu và ứng dụng..." /></label></div>
      <div className="form-section"><h3>Hình ảnh</h3>
        {previewImage ? <div className={uploading ? "image-preview uploading" : "image-preview"}>
          <button className="image-preview-frame" type="button" onClick={() => setZoomed(true)} aria-label="Xem ảnh lớn"><img src={previewImage} alt={`Xem trước ${previewName}`} />{uploading && <span>Đang tải ảnh lên...</span>}</button>
          <div className="image-preview-actions"><button type="button" onClick={() => setZoomed(true)}>Xem ảnh lớn</button><button className="danger-link" type="button" disabled={uploading} onClick={() => field("image_url", "")}>Gỡ ảnh</button></div>
        </div> : <div className="image-preview empty">Chưa có ảnh. Chọn một ảnh bên dưới để xem trước.</div>}
        <label>Upload ảnh sản phẩm<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleImageUpload(event)} disabled={uploading} /><small>{uploading ? "Đang tải ảnh lên Cloudinary..." : "JPG, PNG hoặc WebP · tối đa 4 MB"}</small></label><label>URL hình ảnh<input type="url" value={form.image_url ?? ""} onChange={(event) => field("image_url", event.target.value)} placeholder="Có thể nhập URL ảnh thủ công" /></label></div>
      <div className="form-section"><h3>Quy cách & tồn kho</h3><div className="form-grid two"><label>Mét cố định<input type="number" min="0.01" step="0.01" value={form.fixed_meters} onChange={(event) => field("fixed_meters", Number(event.target.value))} required /></label><label>Tên đơn vị<input value={form.unit_label} onChange={(event) => field("unit_label", event.target.value)} required /></label><label>Giá bán<input type="number" min="0" step="1000" value={form.price} onChange={(event) => field("price", Number(event.target.value))} required /></label><label>Tồn kho<input type="number" min="0" step="1" value={form.stock_quantity} onChange={(event) => field("stock_quantity", Number(event.target.value))} required /></label></div></div>
      {localError && <p className="form-error">{localError}</p>}
      <footer><button className="secondary-action" type="button" onClick={onClose}>Hủy</button><button className="admin-primary" disabled={saving || uploading} type="submit">{uploading ? "Đang tải ảnh..." : saving ? "Đang lưu..." : product ? "Lưu thay đổi" : "Tạo sản phẩm"}</button></footer>
    </form>
  </aside>
  {zoomed && previewImage && <ImageLightbox src={previewImage} alt={previewName} onClose={() => setZoomed(false)} />}
  </>;
}
