import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { getCustomerOrders, type Order } from "../api";
import { useApp } from "../app-context";
import { formatMoney } from "../utils";

// Trang tam: thanh toan chuyen khoan chua duoc noi voi ngan hang hay cong thanh toan nao.
export function PaymentPage() {
  const { id } = useParams();
  const { auth } = useApp();
  const placed = (useLocation().state as { placed?: string } | null)?.placed;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth || auth.user.role !== "customer") return;
    void getCustomerOrders(auth.token)
      .then((orders) => setOrder(orders.find((item) => item.id === Number(id)) ?? null))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [auth?.token, auth?.user.role, id]);

  if (!auth) return <Navigate to="/login" replace state={{ from: `/payment/${id}` }} />;
  if (auth.user.role !== "customer") return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="page-status loading">Đang tải thông tin thanh toán...</div>;
  if (error || !order) return <div className="page-status error"><strong>Không tìm thấy đơn hàng.</strong><p>{error}</p><Link to="/orders">Về đơn hàng của tôi</Link></div>;

  return <section className="payment-page">
    <header><p className="eyebrow">THANH TOÁN / {order.order_code}</p><h1>Chuyển khoản<br /><em>cho đơn hàng.</em></h1></header>
    {placed && <div className="order-success" role="status"><strong>Đặt hàng thành công — {placed}</strong><p>Đơn của bạn đã được ghi nhận và đang chờ cửa hàng xác nhận.</p></div>}
    <div className="payment-grid">
      <div className="payment-card">
        <span className="payment-badge">ĐANG HOÀN THIỆN</span>
        <h2>Thanh toán trực tuyến chưa hoạt động</h2>
        <p>Tính năng chuyển khoản tự động đang được cửa hàng thiết lập. Hiện tại bạn chưa cần chuyển tiền: cửa hàng sẽ liên hệ qua số điện thoại người nhận để gửi thông tin tài khoản và xác nhận thanh toán.</p>
        <dl>
          <div><dt>Ngân hàng</dt><dd>Sẽ được cập nhật</dd></div>
          <div><dt>Số tài khoản</dt><dd>Sẽ được cập nhật</dd></div>
          <div><dt>Chủ tài khoản</dt><dd>Sẽ được cập nhật</dd></div>
          <div><dt>Nội dung chuyển khoản</dt><dd>{order.order_code}</dd></div>
        </dl>
      </div>
      <aside className="payment-summary">
        <p className="eyebrow">ĐƠN HÀNG</p>
        {order.items.map((item) => <p className="order-card-line" key={item.product_id}><span>{item.product_name} × {item.quantity}</span><strong>{formatMoney(item.line_total)}</strong></p>)}
        <div className="payment-total"><span>Số tiền cần thanh toán</span><strong>{formatMoney(order.total_amount)}</strong></div>
        <p>Người nhận: {order.recipient_name ?? order.customer_name}{order.recipient_phone ? ` · ${order.recipient_phone}` : ""}</p>
        <Link className="underlined-link" to="/orders">Về đơn hàng của tôi <span>→</span></Link>
      </aside>
    </div>
  </section>;
}
