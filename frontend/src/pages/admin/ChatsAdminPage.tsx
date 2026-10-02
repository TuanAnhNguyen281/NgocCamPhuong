import { useEffect, useState } from "react";
import { getChatConversations, getManagerChat, sendManagerChat, type ChatConversation, type ChatMessage } from "../../api";
import { useAdmin } from "../../admin-context";
import { useApp } from "../../app-context";
import { ChatThread } from "../../components/ChatThread";
import { formatDateTime } from "../../utils";

const POLL_MS = 5000;

export function ChatsAdminPage() {
  const { auth } = useApp();
  const { refreshNotifications } = useAdmin();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = auth?.token;
  const selected = conversations.find((item) => item.customer_id === selectedId) ?? null;

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        // Mo cuoc tro chuyen truoc de tin moi duoc danh dau da doc, roi moi tai danh sach.
        const thread = selectedId ? await getManagerChat(token, selectedId) : null;
        const list = await getChatConversations(token);
        if (cancelled) return;
        if (thread) setMessages(thread);
        setConversations(list);
        setError("");
      } catch (reason) {
        if (!cancelled) setError((reason as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void poll().then(() => void refreshNotifications());
    const timer = window.setInterval(() => void poll(), POLL_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, selectedId]);

  async function send(body: string) {
    if (!token || !selectedId) return;
    setMessages(await sendManagerChat(token, selectedId, body));
    setConversations(await getChatConversations(token));
  }

  return <>
    {error && <p className="form-error">{error}</p>}
    <section className="admin-card chat-admin">
      <aside className="chat-list" aria-label="Danh sách cuộc trò chuyện">
        <header><span className="admin-kicker">KHÁCH HÀNG</span><h2>{conversations.length} cuộc trò chuyện</h2></header>
        {loading && <div className="admin-loading">Đang tải...</div>}
        {!loading && conversations.length === 0 && <p className="admin-empty">Chưa có khách nào nhắn tin.</p>}
        {conversations.map((item) => <button className={item.customer_id === selectedId ? "selected" : ""} key={item.customer_id} type="button" onClick={() => { setMessages([]); setSelectedId(item.customer_id); }}>
          <span className="chat-avatar">{item.customer_name.slice(0, 1).toUpperCase()}</span>
          <span className="chat-list-text"><strong>{item.customer_name}</strong><small>{item.last_sender_role === "staff" ? "Bạn: " : ""}{item.last_body}</small></span>
          <span className="chat-list-meta"><small>{formatDateTime(item.last_at).slice(0, 5)}</small>{item.unread > 0 && <em className="nav-badge">{item.unread}</em>}</span>
        </button>)}
      </aside>
      <div className="chat-admin-thread">
        {selected ? <>
          <header><div><strong>{selected.customer_name}</strong><small>{selected.customer_email}</small></div></header>
          <ChatThread messages={messages} viewer="staff" emptyText="Đang tải tin nhắn..." onSend={send} />
        </> : <div className="chat-placeholder"><strong>Chọn một cuộc trò chuyện</strong><p>Tin nhắn mới của khách sẽ hiện ở cột bên trái, kèm số tin chưa đọc.</p></div>}
      </div>
    </section>
  </>;
}
