import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../api";

// Khung tin nhan dung chung cho khach (viewer = customer) va cua hang (viewer = staff).
export function ChatThread({ messages, viewer, onSend, emptyText }: { messages: ChatMessage[]; viewer: "customer" | "staff"; onSend: (body: string) => Promise<void>; emptyText: string }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    try { await onSend(body); setDraft(""); }
    catch (reason) { setError((reason as Error).message); }
    finally { setSending(false); }
  }

  return <div className="chat-thread">
    <div className="chat-messages" ref={listRef} aria-live="polite">
      {messages.length === 0 && <p className="chat-empty">{emptyText}</p>}
      {messages.map((message) => <div className={message.sender_role === viewer ? "chat-bubble mine" : "chat-bubble"} key={message.id}>
        <p>{message.body}</p>
        <small>{message.sender_role === viewer ? "Bạn" : message.sender_name} · {new Date(message.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</small>
      </div>)}
    </div>
    {error && <p className="form-error">{error}</p>}
    <form className="chat-form" onSubmit={submit}>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Nhập tin nhắn..." rows={1} maxLength={2000} aria-label="Tin nhắn" />
      <button type="submit" disabled={sending || !draft.trim()}>{sending ? "Đang gửi" : "Gửi"}</button>
    </form>
  </div>;
}
