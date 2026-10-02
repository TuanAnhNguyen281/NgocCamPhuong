import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getCustomerOrders, type Order } from "../api";
import { useApp } from "../app-context";
import { formatMoney, orderStatusLabel } from "../utils";

export function CustomerOrdersPage() {
  const { auth } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!auth || auth.user.role !== "customer") return;
    void getCustomerOrders(auth.token).then(setOrders).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [auth?.token, auth?.user.role]);
  if (!auth) return <Navigate to="/login" replace state={{ from: "/orders" }} />;
  if (auth.user.role !== "customer") return <Navigate to="/dashboard" replace />;
  return <section className="customer-workspace"><aside><p className="eyebrow">TÀI KHOẢN</p><h1>Đơn hàng<br /><em>của bạn.</em></h1><nav><Link to="/account">Thông tin cá nhân</Link><Link className="active" to="/orders">Đơn hàng của tôi</Link><Link to="/products">Tiếp tục mua hàng</Link></nav></aside><div className="customer-content"><header><p className="eyebrow">LỊCH SỬ MUA HÀNG</p><h2>Theo dõi từng lựa chọn</h2><p>Số mét, tổng tiền và tiến trình của tất cả đơn hàng.</p></header>{loading && <p className="notice">Đang tải đơn hàng...</p>}{error && <p className="notice error">{error}</p>}{!loading && !error && orders.length === 0 && <div className="empty-state"><strong>Bạn chưa có đơn hàng nào.</strong><p>Khám phá bộ sưu tập để bắt đầu đơn đầu tiên.</p><Link to="/products">Xem sản phẩm</Link></div>}<div className="customer-order-list">{orders.map((order) => <article className="customer-order-card" key={order.id}><header><div><span>{order.order_code}</span><h3>{order.items.map((item) => item.product_name).join(" · ")}</h3></div><span className={`status-pill ${order.status}`}>{orderStatusLabel[order.status] ?? order.status}</span></header><div className="customer-order-metrics"><div><span>Số lượng</span><strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị</strong></div><div><span>Tổng mét</span><strong>{order.total_meters} m</strong></div><div><span>Giá trị</span><strong>{formatMoney(order.total_amount)}</strong></div></div><p>{order.shipping_address}</p></article>)}</div></div></section>;
}
