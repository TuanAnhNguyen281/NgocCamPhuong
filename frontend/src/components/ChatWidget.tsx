import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCustomerChat, getCustomerChatUnread, sendCustomerChat, type ChatMessage } from "../api";
import { useApp } from "../app-context";
import { ChatThread } from "./ChatThread";

// Khong co ket noi thoi gian thuc: khi mo thi hoi lai nhanh, khi dong chi dem tin chua doc.
const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 30000;

export function ChatWidget() {
  const { auth } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const token = auth?.user.role === "customer" ? auth.token : null;

  useEffect(() => {
    if (!token) { setMessages([]); setUnread(0); return undefined; }
    let cancelled = false;
    const poll = () => {
      if (document.hidden) return;
      if (open) void getCustomerChat(token).then((next) => { if (!cancelled) { setMessages(next); setUnread(0); } }).catch(() => undefined);
      else void getCustomerChatUnread(token).then((next) => { if (!cancelled) setUnread(next.unread); }).catch(() => undefined);
    };
    poll();
    const timer = window.setInterval(poll, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, open]);

  // Khu quan ly co trang tro chuyen rieng.
  if (auth && auth.user.role !== "customer") return null;

  return <div className="chat-widget">
    {open && <section className="chat-panel" aria-label="Trò chuyện với cửa hàng">
      <header><div><p className="eyebrow">HỖ TRỢ TRỰC TUYẾN</p><strong>Trò chuyện với cửa hàng</strong></div><button type="button" onClick={() => setOpen(false)}>Đóng</button></header>
      {token
        ? <ChatThread messages={messages} viewer="customer" emptyText="Bạn cần tư vấn chất liệu hay hỏi về đơn hàng? Hãy gửi tin nhắn, cửa hàng sẽ trả lời trong giờ hỗ trợ." onSend={async (body) => setMessages(await sendCustomerChat(token, body))} />
        : <div className="chat-login"><p>Đăng nhập để trò chuyện với cửa hàng và xem lại các tin nhắn trước đó.</p><Link className="underlined-link" to="/login" onClick={() => setOpen(false)}>Đăng nhập <span>→</span></Link></div>}
    </section>}
    <button className="chat-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Đóng trò chuyện" : `Mở trò chuyện${unread ? `, ${unread} tin chưa đọc` : ""}`}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
      <span>{open ? "Đóng" : "Trò chuyện"}</span>
      {!open && unread > 0 && <em>{unread}</em>}
    </button>
  </div>;
}
