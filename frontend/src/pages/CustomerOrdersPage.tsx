import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { cancelCustomerOrder, getCustomerOrders, type Order } from "../api";
import { useApp } from "../app-context";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { OrderTimeline } from "../components/OrderTimeline";
import { formatCountdown, formatDateTime, formatMoney, orderStatusLabel, paymentMethodLabel } from "../utils";

// Han tu huy tinh theo dong ho cua trinh duyet ke tu luc nhan du lieu, de dem nguoc khong can goi lai may chu.
type LoadedOrder = Order & { cancelDeadline: number };
const withDeadline = (order: Order): LoadedOrder => ({ ...order, cancelDeadline: Date.now() + order.cancel_seconds_left * 1000 });

export function CustomerOrdersPage() {
  const { auth, refreshProducts } = useApp();
  const location = useLocation();
  const placed = location.state as { placed?: string; emailSent?: boolean } | null;
  const [orders, setOrders] = useState<LoadedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<LoadedOrder | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    if (!auth || auth.user.role !== "customer") return;
    void getCustomerOrders(auth.token).then((next) => setOrders(next.map(withDeadline))).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [auth?.token, auth?.user.role]);

  const anyCancellable = orders.some((order) => order.status === "pending" && order.cancelDeadline > now);
  useEffect(() => {
    if (!anyCancellable) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [anyCancellable]);

  if (!auth) return <Navigate to="/login" replace state={{ from: "/orders" }} />;
  if (auth.user.role !== "customer") return <Navigate to="/dashboard" replace />;

  async function confirmCancel() {
    if (!cancelling || !auth) return;
    setCancelBusy(true); setError(""); setNotice("");
    try {
      const updated = withDeadline(await cancelCustomerOrder(auth.token, cancelling.id));
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setNotice(`Đã hủy đơn ${updated.order_code}. Số lượng đã được trả lại kho.`);
      void refreshProducts();
    } catch (reason) {
      setError((reason as Error).message);
      // Don co the vua duoc cua hang xac nhan; tai lai de hien dung trang thai.
      void getCustomerOrders(auth.token).then((next) => setOrders(next.map(withDeadline))).catch(() => undefined);
    } finally {
      setCancelBusy(false); setCancelling(null);
    }
  }

  return <section className="customer-workspace"><aside><p className="eyebrow">TÀI KHOẢN</p><h1>Đơn hàng<br /><em>của bạn.</em></h1><nav><Link to="/account">Thông tin cá nhân</Link><Link className="active" to="/orders">Đơn hàng của tôi</Link><Link to="/products">Tiếp tục mua hàng</Link></nav></aside><div className="customer-content"><header><p className="eyebrow">LỊCH SỬ MUA HÀNG</p><h2>Theo dõi từng lựa chọn</h2><p>Số mét, tổng tiền và tiến trình của tất cả đơn hàng.</p></header>
    {placed?.placed && <div className="order-success" role="status"><strong>Đặt hàng thành công — {placed.placed}</strong><p>{placed.emailSent ? `Email xác nhận đã được gửi tới ${auth.user.email}.` : "Cửa hàng sẽ liên hệ với bạn để xác nhận đơn."} Bạn có thể tự hủy đơn trong vòng 5 phút.</p></div>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {loading && <p className="notice loading">Đang tải đơn hàng...</p>}
    {error && <p className="notice error">{error}</p>}
    {!loading && !error && orders.length === 0 && <div className="empty-state"><strong>Bạn chưa có đơn hàng nào.</strong><p>Khám phá bộ sưu tập để bắt đầu đơn đầu tiên.</p><Link to="/products">Xem sản phẩm</Link></div>}
    <div className="customer-order-list">{orders.map((order) => {
      const secondsLeft = order.status === "pending" ? Math.max(0, Math.ceil((order.cancelDeadline - now) / 1000)) : 0;
      const open = expanded === order.id;
      return <article className="customer-order-card" key={order.id}>
        <header><div><span>{order.order_code} · {formatDateTime(order.created_at)}</span><h3>{order.items.map((item) => item.product_name).join(" · ")}</h3></div><span className={`status-pill ${order.status}`}>{orderStatusLabel[order.status] ?? order.status}</span></header>
        <div className="customer-order-metrics"><div><span>Số lượng</span><strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị</strong></div><div><span>Tổng mét</span><strong>{order.total_meters} m</strong></div><div><span>Giá trị</span><strong>{formatMoney(order.total_amount)}</strong></div></div>
        {secondsLeft > 0 && <div className="cancel-window" role="status"><p>Bạn còn <strong>{formatCountdown(secondsLeft)}</strong> để tự hủy đơn này. Sau thời gian đó, hoặc khi cửa hàng đã xác nhận, đơn không thể hủy.</p><button type="button" onClick={() => setCancelling(order)}>Hủy đơn</button></div>}
        {order.status === "pending" && secondsLeft === 0 && <p className="cancel-closed">Đã hết thời gian tự hủy. Cần thay đổi, vui lòng nhắn cho cửa hàng.</p>}
        <div className="order-card-actions"><button type="button" onClick={() => setExpanded(open ? null : order.id)} aria-expanded={open}>{open ? "Ẩn chi tiết" : "Xem chi tiết và lịch sử"}</button>{order.payment_method === "bank_transfer" && order.status !== "cancelled" && order.payment_status !== "paid" && <Link to={`/payment/${order.id}`}>Hướng dẫn chuyển khoản</Link>}</div>
        {open && <div className="order-card-detail">
          <div><span>Sản phẩm</span>{order.items.map((item) => <p className="order-card-line" key={item.product_id}><span>{item.product_name} · {item.fixed_meters} m × {item.quantity}</span><strong>{formatMoney(item.line_total)}</strong></p>)}</div>
          <div><span>Người nhận</span><p>{order.recipient_name ?? order.customer_name}{order.recipient_phone ? ` · ${order.recipient_phone}` : ""}<br />{order.shipping_address}</p>{order.note && <p>Ghi chú: {order.note}</p>}</div>
          <div><span>Thanh toán</span><p>{paymentMethodLabel[order.payment_method] ?? order.payment_method}</p></div>
          <div><span>Lịch sử đơn hàng</span><OrderTimeline history={order.history} /></div>
        </div>}
      </article>;
    })}</div></div>
    {cancelling && <ConfirmDialog title={`Hủy đơn ${cancelling.order_code}?`} description="Đơn sẽ được hủy ngay và số lượng trả lại kho. Thao tác này không hoàn tác được." confirmLabel="Hủy đơn hàng" busyLabel="Đang hủy..." busy={cancelBusy} onCancel={() => setCancelling(null)} onConfirm={() => void confirmCancel()} />}
  </section>;
}
