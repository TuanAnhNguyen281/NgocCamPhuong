import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../../admin-context";
import { FeedbackBanner } from "../../components/FeedbackBanner";
import { SalesReport } from "../../components/SalesReport";
import { formatMoney, orderStatusLabel, productStatusLabel } from "../../utils";

export function DashboardPage() {
  const { products, orders, loading, refresh, refreshNotifications } = useAdmin();
  const [reportKey, setReportKey] = useState(0);
  const published = products.filter((item) => item.status === "published").length;
  const lowStock = products.filter((item) => item.stock_quantity <= 5);
  const pending = orders.filter((item) => item.status === "pending").length;
  const revenue = orders.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.total_amount), 0);
  if (loading) return <div className="admin-loading">Đang chuẩn bị dữ liệu cửa hàng...</div>;
  return <>
    <FeedbackBanner />
    <section className="dashboard-welcome"><div><span className="admin-kicker">TÌNH HÌNH HÔM NAY</span><h2>{pending > 0 ? `Có ${pending} đơn đang chờ bạn.` : "Mọi thứ đang ở đúng vị trí."}</h2><p>Theo dõi nhanh sản phẩm, đơn hàng và những việc cần ưu tiên.</p></div><button className="secondary-action" type="button" onClick={() => { void refresh(); void refreshNotifications(); setReportKey((value) => value + 1); }}>Làm mới dữ liệu</button></section>
    <section className="metric-grid">
      <article><span>Sản phẩm đang bán</span><strong>{published}</strong><small>{products.length} sản phẩm trong hệ thống</small></article>
      <article className={pending ? "accent" : ""}><span>Đơn chờ xác nhận</span><strong>{pending}</strong><small>{pending ? "Cần xử lý trong hôm nay" : "Không có đơn đang chờ"}</small></article>
      <article><span>Tổng tồn kho</span><strong>{products.reduce((sum, item) => sum + item.stock_quantity, 0)}</strong><small>{lowStock.length} sản phẩm sắp hết</small></article>
      <article><span>Giá trị đơn hàng</span><strong className="metric-money">{formatMoney(revenue)}</strong><small>Tất cả thời gian, không gồm đơn hủy</small></article>
    </section>
    <SalesReport refreshKey={reportKey} />
    <section className="dashboard-grid">
      <article className="admin-card recent-orders"><header><div><span className="admin-kicker">ĐƠN HÀNG GẦN ĐÂY</span><h3>Dòng xử lý mới nhất</h3></div><Link to="/dashboard/orders">Xem tất cả</Link></header>{orders.slice(0, 5).map((order) => <div className="dashboard-row" key={order.id}><div><strong>{order.order_code}</strong><span>{order.recipient_name ?? order.customer_name}</span></div><span className={`status-pill ${order.status}`}>{orderStatusLabel[order.status] ?? order.status}</span><strong>{formatMoney(order.total_amount)}</strong></div>)}{orders.length === 0 && <p className="admin-empty">Chưa có đơn hàng.</p>}</article>
      <article className="admin-card low-stock"><header><div><span className="admin-kicker">CẦN CHÚ Ý</span><h3>Tồn kho thấp</h3></div><Link to="/dashboard/products">Quản lý kho</Link></header>{lowStock.slice(0, 5).map((product) => <div className="stock-row" key={product.id}><div><strong>{product.name}</strong><span>{product.sku} · {productStatusLabel[product.status] ?? product.status}</span></div><strong>{product.stock_quantity}</strong></div>)}{lowStock.length === 0 && <p className="admin-empty">Tồn kho đang ổn định.</p>}</article>
    </section>
  </>;
}
