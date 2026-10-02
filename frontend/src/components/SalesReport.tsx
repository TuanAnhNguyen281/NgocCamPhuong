import { useEffect, useState } from "react";
import { getReport, type Report } from "../api";
import { useApp } from "../app-context";
import { formatMoney, orderStatusLabel, paymentMethodLabel } from "../utils";

const ranges = [7, 30, 90];
const statusOrder = ["pending", "confirmed", "preparing", "shipping", "completed", "cancelled"];

// Lam tron len moc 1/2/5 × 10^n de truc tung co cac vach de doc.
function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => candidate * power >= value) ?? 10;
  return step * power;
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString("vi-VN")} k`;
  return String(value);
}

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export function SalesReport({ refreshKey }: { refreshKey: number }) {
  const { auth } = useApp();
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) return undefined;
    let cancelled = false;
    setError("");
    void getReport(auth.token, days)
      .then((next) => { if (!cancelled) setReport(next); })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); });
    return () => { cancelled = true; };
  }, [auth?.token, days, refreshKey]);

  const filter = <div className="range-filter" role="group" aria-label="Khoảng thời gian">{ranges.map((value) => <button className={days === value ? "selected" : ""} key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{value} ngày</button>)}</div>;

  if (error) return <section className="admin-card report-card"><header><div><span className="admin-kicker">BÁO CÁO BÁN HÀNG</span><h3>Không tải được báo cáo</h3></div>{filter}</header><p className="admin-empty">{error}</p></section>;
  if (!report) return <section className="admin-card report-card"><header><div><span className="admin-kicker">BÁO CÁO BÁN HÀNG</span><h3>Doanh thu theo ngày</h3></div>{filter}</header><div className="admin-loading">Đang tải báo cáo...</div></section>;

  const { summary, daily } = report;
  const max = niceMax(Math.max(...daily.map((item) => item.revenue)));
  const average = summary.orders > 0 ? summary.revenue / summary.orders : 0;
  const totalPlaced = summary.orders + summary.cancelled;
  const topMax = Math.max(1, ...report.top_products.map((item) => item.revenue));
  const statusCounts = new Map(report.by_status.map((item) => [item.status, item.orders]));
  const labelEvery = Math.ceil(daily.length / 7);

  return <>
    <section className="admin-card report-card">
      <header><div><span className="admin-kicker">BÁO CÁO BÁN HÀNG</span><h3>Doanh thu theo ngày</h3></div>{filter}</header>
      <div className="report-tiles">
        <div><span>Doanh thu</span><strong>{formatMoney(summary.revenue)}</strong><small>Không gồm đơn đã hủy</small></div>
        <div><span>Số đơn</span><strong>{summary.orders}</strong><small>{summary.meters.toLocaleString("vi-VN")} mét vải</small></div>
        <div><span>Giá trị trung bình</span><strong>{formatMoney(Math.round(average))}</strong><small>Trên mỗi đơn</small></div>
        <div><span>Đơn đã hủy</span><strong>{summary.cancelled}</strong><small>{totalPlaced > 0 ? `${Math.round((summary.cancelled / totalPlaced) * 100)}% tổng số đơn đặt` : "Chưa có đơn"}</small></div>
      </div>
      {summary.orders === 0 ? <p className="admin-empty">Chưa có đơn hàng nào trong {days} ngày qua.</p> : <figure className="bar-chart" aria-label={`Doanh thu ${days} ngày gần nhất`}>
        <div className="bar-chart-scale" aria-hidden="true"><span>{compactMoney(max)}</span><span>{compactMoney(max / 2)}</span><span>0</span></div>
        <div className="bar-chart-plot">
          {daily.map((item, index) => <div className="bar-column" key={item.day} tabIndex={0} aria-label={`${shortDay(item.day)}: ${formatMoney(item.revenue)}, ${item.orders} đơn`}>
            <div className="bar" style={{ height: `${(item.revenue / max) * 100}%`, minHeight: item.revenue > 0 ? 3 : 0 }} />
            <div className={index > daily.length / 2 ? "bar-tip left" : "bar-tip"} role="tooltip"><strong>{shortDay(item.day)}</strong><span>{formatMoney(item.revenue)}</span><span>{item.orders} đơn</span></div>
          </div>)}
        </div>
        <div className="bar-chart-axis" aria-hidden="true">{daily.map((item, index) => <span key={item.day}>{index % labelEvery === 0 || index === daily.length - 1 ? shortDay(item.day) : ""}</span>)}</div>
        <details className="chart-table"><summary>Xem dạng bảng</summary><table className="admin-table"><thead><tr><th>Ngày</th><th>Doanh thu</th><th>Số đơn</th></tr></thead><tbody>{daily.filter((item) => item.orders > 0).map((item) => <tr key={item.day}><td>{shortDay(item.day)}</td><td>{formatMoney(item.revenue)}</td><td>{item.orders}</td></tr>)}</tbody></table></details>
      </figure>}
    </section>
    <section className="report-grid">
      <article className="admin-card"><header><div><span className="admin-kicker">{days} NGÀY QUA</span><h3>Sản phẩm bán chạy</h3></div></header>
        {report.top_products.length === 0 ? <p className="admin-empty">Chưa có dữ liệu bán hàng.</p> : <div className="rank-bars">{report.top_products.map((item) => <div className="rank-row" key={item.product_name}><div className="rank-label"><strong>{item.product_name}</strong><span>{item.quantity} đơn vị · {item.meters.toLocaleString("vi-VN")} m</span></div><div className="rank-track"><div className="rank-bar" style={{ width: `${(item.revenue / topMax) * 100}%` }} /></div><span className="rank-value">{formatMoney(item.revenue)}</span></div>)}</div>}
      </article>
      <article className="admin-card"><header><div><span className="admin-kicker">{days} NGÀY QUA</span><h3>Đơn theo trạng thái</h3></div></header>
        <div className="status-breakdown">{statusOrder.map((status) => <div key={status}><span className={`status-pill ${status}`}>{orderStatusLabel[status]}</span><strong>{statusCounts.get(status) ?? 0}</strong></div>)}</div>
        <div className="payment-breakdown"><span className="admin-kicker">THEO PHƯƠNG THỨC THANH TOÁN</span>{report.by_payment.length === 0 ? <p>Chưa có đơn.</p> : report.by_payment.map((item) => <div key={item.payment_method}><span>{paymentMethodLabel[item.payment_method] ?? item.payment_method}</span><strong>{item.orders} đơn · {formatMoney(item.revenue)}</strong></div>)}</div>
      </article>
    </section>
  </>;
}
