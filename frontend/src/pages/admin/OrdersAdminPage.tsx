import { useMemo, useState } from "react";
import type { Order } from "../../api";
import { useAdmin } from "../../admin-context";
import { FeedbackBanner } from "../../components/FeedbackBanner";
import { formatMoney, orderStatusLabel } from "../../utils";

const transitions: Record<string, string[]> = { pending: ["pending", "confirmed", "cancelled"], confirmed: ["confirmed", "preparing", "cancelled"], preparing: ["preparing", "shipping", "cancelled"], shipping: ["shipping", "completed"], completed: ["completed"], cancelled: ["cancelled"] };

export function OrdersAdminPage() {
  const { orders, loading, updateOrder } = useAdmin();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const filtered = useMemo(() => { const keyword = search.trim().toLocaleLowerCase(); return orders.filter((item) => (status === "all" || item.status === status) && (!keyword || `${item.order_code} ${item.customer_name} ${item.customer_email}`.toLocaleLowerCase().includes(keyword))); }, [orders, search, status]);

  async function changeStatus(order: Order, nextStatus: string) {
    setUpdating(order.id);
    try { await updateOrder(order.id, nextStatus); }
    finally { setUpdating(null); }
  }

  return <>
    <FeedbackBanner />
    <section className="admin-toolbar"><div className="admin-search"><span>Tìm đơn hàng</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã đơn, tên hoặc email..." /></div><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(orderStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></section>
    <section className="admin-card table-card"><header className="table-card-head"><div><span className="admin-kicker">ĐƠN HÀNG</span><h2>{filtered.length} đơn cần theo dõi</h2></div><span>Chọn trạng thái kế tiếp để cập nhật quy trình</span></header>{loading ? <div className="admin-loading">Đang tải đơn hàng...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mã đơn / Khách hàng</th><th>Sản phẩm</th><th>Tổng mét</th><th>Giá trị</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><div className="order-cell"><strong>{order.order_code}</strong><span>{order.customer_name} · {order.customer_email}</span></div></td><td><span className="line-clamp">{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(" · ")}</span></td><td>{order.total_meters} m</td><td><strong>{formatMoney(order.total_amount)}</strong></td><td><select className={`status-select ${order.status}`} disabled={updating === order.id} value={order.status} onChange={(event) => void changeStatus(order, event.target.value)}>{(transitions[order.status] ?? [order.status]).map((value) => <option key={value} value={value}>{orderStatusLabel[value] ?? value}</option>)}</select></td><td><button className="table-detail-button" type="button" onClick={() => setSelected(order)}>Chi tiết</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="admin-empty">Không có đơn hàng phù hợp.</div>}</div>}</section>
    {selected && <><button className="drawer-backdrop" type="button" aria-label="Đóng chi tiết" onClick={() => setSelected(null)} /><aside className="order-detail-drawer"><header><div><span className="admin-kicker">CHI TIẾT ĐƠN HÀNG</span><h2>{selected.order_code}</h2></div><button type="button" onClick={() => setSelected(null)}>Đóng</button></header><div className="order-detail-section"><span>Khách hàng</span><strong>{selected.customer_name}</strong><p>{selected.customer_email}<br />{selected.shipping_address}</p></div><div className="order-detail-section"><span>Sản phẩm</span>{selected.items.map((item) => <div className="order-detail-line" key={item.product_id}><div><strong>{item.product_name}</strong><small>{item.fixed_meters} m × {item.quantity}</small></div><strong>{formatMoney(item.line_total)}</strong></div>)}</div><div className="order-detail-total"><div><span>Tổng số mét</span><strong>{selected.total_meters} m</strong></div><div><span>Tổng thanh toán</span><strong>{formatMoney(selected.total_amount)}</strong></div></div></aside></>}
  </>;
}
