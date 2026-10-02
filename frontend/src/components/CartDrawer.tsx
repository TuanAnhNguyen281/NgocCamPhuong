import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PaymentMethod } from "../api";
import { useApp } from "../app-context";
import { formatMoney, productImage } from "../utils";

const phonePattern = /^(0|\+84)\d{9,10}$/;

export function CartDrawer() {
  const { auth, cartLines, cartOpen, setCartOpen, updateCartQuantity, placeOrder } = useApp();
  const navigate = useNavigate();
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = useMemo(() => cartLines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0), [cartLines]);
  const isCustomer = auth?.user.role === "customer";

  // Mac dinh nguoi nhan la chu tai khoan; khach van sua duoc neu gui cho nguoi khac.
  useEffect(() => { if (auth?.user.role === "customer") setRecipientName((current) => current || auth.user.full_name); }, [auth?.user.full_name, auth?.user.role]);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) {
      setCartOpen(false);
      navigate("/login", { state: { from: "/products" } });
      return;
    }
    if (!isCustomer) {
      setError("Tài khoản quản lý không thể tạo đơn mua hàng.");
      return;
    }
    if (recipientName.trim().length < 2) { setError("Vui lòng nhập họ tên người nhận."); return; }
    if (!phonePattern.test(phone.replace(/[\s.-]/g, ""))) { setError("Số điện thoại chưa đúng. Ví dụ: 0912 345 678."); return; }
    if (address.trim().length < 5) { setError("Vui lòng nhập địa chỉ nhận hàng."); return; }
    setSubmitting(true);
    setError("");
    try {
      const order = await placeOrder({ recipient_name: recipientName.trim(), recipient_phone: phone, shipping_address: address.trim(), note: note.trim() || undefined, payment_method: paymentMethod });
      setAddress(""); setNote("");
      navigate(order.payment_method === "bank_transfer" ? `/payment/${order.id}` : "/orders", { state: { placed: order.order_code, emailSent: order.email_sent === true } });
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
        <form className="cart-checkout" onSubmit={checkout} noValidate>
          {isCustomer && <>
            <p className="eyebrow">THÔNG TIN NGƯỜI NHẬN</p>
            <div className="checkout-grid">
              <label>Họ và tên<input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} autoComplete="name" maxLength={160} /></label>
              <label>Số điện thoại<input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="0912 345 678" maxLength={16} /></label>
            </div>
            <label>Địa chỉ nhận hàng<textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" rows={2} maxLength={500} /></label>
            <label>Ghi chú cho cửa hàng<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Giờ nhận hàng, yêu cầu đóng gói... (không bắt buộc)" rows={2} maxLength={500} /></label>
            <fieldset className="payment-options"><legend className="eyebrow">PHƯƠNG THỨC THANH TOÁN</legend>
              <label className={paymentMethod === "cod" ? "selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} /><span><strong>Thanh toán khi nhận hàng</strong><small>Trả tiền mặt cho người giao (COD)</small></span></label>
              <label className={paymentMethod === "bank_transfer" ? "selected" : ""}><input type="radio" name="payment" checked={paymentMethod === "bank_transfer"} onChange={() => setPaymentMethod("bank_transfer")} /><span><strong>Chuyển khoản ngân hàng</strong><small>Xem hướng dẫn chuyển khoản sau khi đặt</small></span></label>
            </fieldset>
          </>}
          <div className="cart-total"><span>TẠM TÍNH</span><strong>{formatMoney(total)}</strong></div>
          {error && <p className="form-error">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting}>{submitting ? "Đang tạo đơn..." : auth ? "Xác nhận đặt hàng" : "Đăng nhập để đặt hàng"}</button>
          {isCustomer && <p className="checkout-hint">Bạn có thể tự hủy đơn trong vòng 5 phút sau khi đặt.</p>}
        </form>
      </>}
    </aside>
  </>;
}
