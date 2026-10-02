import { useEffect, useMemo, useState } from "react";
import { getContactMessages, updateContactMessageStatus, type ContactMessage } from "../../api";
import { useAdmin } from "../../admin-context";
import { useApp } from "../../app-context";

const statusLabel: Record<ContactMessage["status"], string> = { new: "Chưa xử lý", handled: "Đã xử lý" };

export function MessagesAdminPage() {
  const { auth } = useApp();
  const { refreshNotifications } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!auth) return;
    void getContactMessages(auth.token).then(setMessages).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, [auth?.token]);

  const filtered = useMemo(() => messages.filter((item) => status === "all" || item.status === status), [messages, status]);

  async function changeStatus(item: ContactMessage, next: ContactMessage["status"]) {
    if (!auth) return;
    setUpdating(item.id); setError("");
    try {
      const updated = await updateContactMessageStatus(auth.token, item.id, next);
      setMessages((current) => current.map((row) => row.id === updated.id ? updated : row));
      setSelected((current) => current?.id === updated.id ? updated : current);
      void refreshNotifications();
    } catch (reason) { setError((reason as Error).message); }
    finally { setUpdating(null); }
  }

  return <>
    {error && <p className="form-error">{error}</p>}
    <section className="admin-toolbar"><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả</option><option value="new">Chưa xử lý</option><option value="handled">Đã xử lý</option></select></label></section>
    <section className="admin-card table-card"><header className="table-card-head"><div><span className="admin-kicker">LỜI NHẮN TỪ KHÁCH</span><h2>{filtered.length} lời nhắn</h2></div><span>Gửi từ trang Liên hệ của cửa hàng</span></header>
      {loading ? <div className="admin-loading">Đang tải lời nhắn...</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người gửi</th><th>Chủ đề</th><th>Nội dung</th><th>Ngày gửi</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="order-cell"><strong>{item.name}</strong><span>{item.email}</span></div></td><td>{item.topic}</td><td><span className="line-clamp">{item.message}</span></td><td>{new Date(item.created_at).toLocaleString("vi-VN")}</td><td><select className={`status-select ${item.status === "new" ? "pending" : "completed"}`} disabled={updating === item.id} value={item.status} onChange={(event) => void changeStatus(item, event.target.value as ContactMessage["status"])}>{(Object.keys(statusLabel) as ContactMessage["status"][]).map((value) => <option key={value} value={value}>{statusLabel[value]}</option>)}</select></td><td><button className="table-detail-button" type="button" onClick={() => setSelected(item)}>Chi tiết</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="admin-empty">Chưa có lời nhắn nào.</div>}</div>}
    </section>
    {selected && <><button className="drawer-backdrop" type="button" aria-label="Đóng chi tiết" onClick={() => setSelected(null)} /><aside className="order-detail-drawer"><header><div><span className="admin-kicker">LỜI NHẮN / {selected.topic.toUpperCase()}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)}>Đóng</button></header><div className="order-detail-section"><span>Người gửi</span><strong>{selected.name}</strong><p><a href={`mailto:${selected.email}`}>{selected.email}</a><br />{new Date(selected.created_at).toLocaleString("vi-VN")}</p></div><div className="order-detail-section"><span>Nội dung</span><p style={{ whiteSpace: "pre-wrap" }}>{selected.message}</p></div><div className="order-detail-section"><span>Trạng thái</span><button className="secondary-action" type="button" disabled={updating === selected.id} onClick={() => void changeStatus(selected, selected.status === "new" ? "handled" : "new")}>{selected.status === "new" ? "Đánh dấu đã xử lý" : "Đánh dấu chưa xử lý"}</button></div></aside></>}
  </>;
}
