import type { OrderHistoryEntry } from "../api";
import { formatDateTime, orderStatusLabel } from "../utils";

const roleLabel: Record<string, string> = { customer: "Khách hàng", manager: "Quản lý", admin: "Quản trị viên" };

export function OrderTimeline({ history }: { history: OrderHistoryEntry[] }) {
  if (history.length === 0) return <p className="timeline-empty">Chưa có lịch sử.</p>;
  return <ol className="order-timeline">
    {history.map((entry) => <li className={entry.to_status} key={entry.id}>
      <span className="timeline-dot" aria-hidden="true" />
      <div>
        <strong>{entry.from_status ? orderStatusLabel[entry.to_status] ?? entry.to_status : "Đặt hàng"}</strong>
        <small>{formatDateTime(entry.created_at)} · {entry.actor_name} ({roleLabel[entry.actor_role] ?? entry.actor_role})</small>
        {entry.note && <p>{entry.note}</p>}
      </div>
    </li>)}
  </ol>;
}
