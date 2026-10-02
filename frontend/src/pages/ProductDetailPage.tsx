import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct, type Product } from "../api";
import { useApp } from "../app-context";
import { ImageLightbox } from "../components/ImageLightbox";
import { ProductCard } from "../components/ProductCard";
import { formatMoney, productImage } from "../utils";

export function ProductDetailPage() {
  const { id } = useParams();
  const { products, addToCart } = useApp();
  const [product, setProduct] = useState<Product | null>(() => products.find((item) => item.id === Number(id)) ?? null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const numericId = Number(id);
    const cached = products.find((item) => item.id === numericId);
    if (cached) { setProduct(cached); setLoading(false); return; }
    if (!Number.isInteger(numericId)) { setError("Sản phẩm không hợp lệ"); setLoading(false); return; }
    setLoading(true);
    void getProduct(numericId).then(setProduct).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [id, products]);

  const related = useMemo(() => products.filter((item) => item.id !== product?.id && (!product?.category || item.category === product.category)).slice(0, 2), [product, products]);
  if (loading) return <div className="page-status loading">Đang tải chi tiết sản phẩm...</div>;
  if (error || !product) return <div className="page-status error"><strong>Không tìm thấy sản phẩm.</strong><p>{error}</p><Link to="/products">Quay lại bộ sưu tập</Link></div>;
  const soldOut = product.stock_quantity === 0;
  return <>
    <section className="product-detail-page">
      <div className="detail-breadcrumb"><Link to="/products">Sản phẩm</Link><span>/</span><span>{product.name}</span></div>
      <div className="detail-layout">
        <figure className="detail-media">{product.image_url ? <button className="detail-zoom" type="button" onClick={() => setZoomed(true)} aria-label="Xem ảnh lớn"><img src={product.image_url} alt={product.name} /><span>Xem ảnh lớn</span></button> : <img src={productImage(product)} alt={product.name} />}<figcaption><span>{product.sku}</span><span>{product.category || "Chất liệu chọn lọc"}</span></figcaption></figure>
        <div className="detail-content"><p className="eyebrow">{product.category || "BỘ SƯU TẬP"} / {product.sku}</p><h1>{product.name}</h1><p className="detail-description">{product.description || "Chất liệu được chọn kỹ cho những thiết kế gần gũi, bền đẹp và dễ đồng hành trong đời sống hàng ngày."}</p><div className="detail-price">{formatMoney(product.price)}<span>/ {product.unit_label}</span></div>
          <dl className="detail-specs"><div><dt>Mét cố định</dt><dd>{product.fixed_meters} m / đơn vị</dd></div><div><dt>Tồn kho hiện tại</dt><dd>{product.stock_quantity} đơn vị</dd></div><div><dt>Tình trạng</dt><dd>{soldOut ? "Tạm hết hàng" : "Có thể đặt ngay"}</dd></div></dl>
          <div className="detail-purchase"><div><span>Số lượng</span><div className="detail-stepper"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><strong>{quantity}</strong><button type="button" disabled={quantity >= product.stock_quantity} onClick={() => setQuantity((value) => Math.min(product.stock_quantity, value + 1))}>+</button></div></div><div className="detail-total"><span>Tổng chiều dài</span><strong>{Number(product.fixed_meters) * quantity} mét</strong></div></div>
          <button className="detail-add" disabled={soldOut} type="button" onClick={() => addToCart(product, quantity)}>{soldOut ? "Tạm hết hàng" : `Thêm ${quantity} đơn vị vào giỏ`}</button>
          <p className="detail-note">Giá và số mét được giữ cố định theo từng đơn vị. Số lượng thực tế sẽ được xác nhận khi tạo đơn.</p>
        </div>
      </div>
    </section>
    {zoomed && product.image_url && <ImageLightbox src={product.image_url} alt={product.name} onClose={() => setZoomed(false)} />}
    {related.length > 0 && <section className="related-products"><header><p className="eyebrow">CÓ THỂ BẠN CŨNG THÍCH</p><h2>Những chất liệu gần nhau.</h2></header><div className="product-grid featured-grid">{related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}</div></section>}
  </>;
}
