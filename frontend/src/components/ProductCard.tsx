import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../api";
import { useApp } from "../app-context";
import { formatMoney, productImage } from "../utils";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const soldOut = product.stock_quantity === 0;
  return <article className="product-card">
    <Link className="product-image-wrap" to={`/products/${product.id}`}>
      <img src={productImage(product)} alt={`${product.name} - chất liệu vải`} />
      <span className="image-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="image-meter">{product.fixed_meters} m / gói</span>
      {soldOut && <span className="sold-out-label">Tạm hết hàng</span>}
    </Link>
    <div className="product-info">
      <div className="product-heading"><div><p className="sku">{product.sku}</p><h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3></div><span className="unit-tag">{product.unit_label}</span></div>
      <p className="description">{product.description || "Chất liệu được tuyển chọn cho những sản phẩm bền đẹp và gần gũi."}</p>
      <div className="product-price"><span>{formatMoney(product.price)}</span><small>/ đơn vị</small></div>
      <div className="product-action">
        <div className="stepper" aria-label={`Số lượng ${product.name}`}><button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button type="button" disabled={quantity >= product.stock_quantity} onClick={() => setQuantity((value) => Math.min(product.stock_quantity, value + 1))}>+</button></div>
        <button className="add-button" disabled={soldOut} type="button" onClick={() => addToCart(product, quantity)}>{soldOut ? "Hết hàng" : "Thêm vào giỏ"}</button>
      </div>
      <div className="product-meta"><span>Tổng {Number(product.fixed_meters) * quantity} m</span><span>Còn {product.stock_quantity} đơn vị</span></div>
    </div>
  </article>;
}
