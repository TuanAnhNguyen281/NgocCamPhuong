import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../app-context";
import { formatMoney, productImage } from "../utils";

export function CartDrawer() {
  const { auth, cartLines, cartOpen, setCartOpen, updateCartQuantity, placeOrder } = useApp();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = useMemo(() => cartLines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0), [cartLines]);

  async function checkout() {
    if (!auth) {
      setCartOpen(false);
      navigate("/login", { state: { from: "/products" } });
      return;
    }
    if (auth.user.role !== "customer") {
      setError("Tài khoản quản lý không thể tạo đơn mua hàng.");
      return;
    }
    if (address.trim().length < 5) {
      setError("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await placeOrder(address.trim());
      setAddress("");
      navigate("/orders");
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartOpen) return null;
  return <>
    <button className="drawer-backdrop" type="button" aria-label="Đóng giỏ hàng" onClick={() => setCartOpen(false)} />
    <aside className="cart-panel" aria-label="Giỏ hàng">
      <div className="cart-panel-head">
        <div><p className="eyebrow">GIỎ HÀNG</p><h2>Những lựa chọn<br /><em>của bạn.</em></h2></div>
        <button type="button" onClick={() => setCartOpen(false)} aria-label="Đóng giỏ hàng">Đóng</button>
      </div>
      {cartLines.length === 0 ? <div className="cart-empty"><strong>Giỏ hàng đang trống.</strong><p>Hãy chọn một chất liệu để bắt đầu.</p></div> : <>
        <div className="cart-lines">
          {cartLines.map(({ product, quantity }) => <div className="cart-line" key={product.id}>
            <img src={productImage(product)} alt="" />
            <div><strong>{product.name}</strong><span>{product.fixed_meters} m × {quantity} · {formatMoney(product.price)}</span>
              <div className="cart-line-controls"><button type="button" onClick={() => updateCartQuantity(product, quantity - 1)}>−</button><span>{quantity}</span><button type="button" onClick={() => updateCartQuantity(product, quantity + 1)}>+</button></div>
            </div>
          </div>)}
        </div>
        <div className="cart-checkout">
          <div className="cart-total"><span>TẠM TÍNH</span><strong>{formatMoney(total)}</strong></div>
          {auth?.user.role === "customer" && <label>Địa chỉ nhận hàng<textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" rows={3} /></label>}
          {error && <p className="form-error">{error}</p>}
          <button className="checkout-button" type="button" disabled={submitting} onClick={() => void checkout()}>{submitting ? "Đang tạo đơn..." : auth ? "Xác nhận đặt hàng" : "Đăng nhập để đặt hàng"}</button>
        </div>
      </>}
    </aside>
  </>;
}
