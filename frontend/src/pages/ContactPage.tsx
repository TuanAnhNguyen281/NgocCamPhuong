import { useState } from "react";
import { contactTopics, sendContactMessage } from "../api";
import { useApp } from "../app-context";

export function ContactPage() {
  const { auth } = useApp();
  const [name, setName] = useState(auth?.user.full_name ?? "");
  const [email, setEmail] = useState(auth?.user.email ?? "");
  const [topic, setTopic] = useState<string>(contactTopics[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError("");
    try {
      await sendContactMessage({ name, email, topic, message });
      setMessage("");
      setSent(true);
    } catch (reason) { setError((reason as Error).message); }
    finally { setSending(false); }
  }

  return <section className="contact-page">
    <header><p className="eyebrow">LIÊN HỆ / HỖ TRỢ</p><h1>Hãy kể chúng tôi nghe<br /><em>bạn đang tìm gì.</em></h1><p>Cần chọn chất liệu, kiểm tra đơn hàng hoặc hỏi về chính sách? Gửi một lời nhắn, cửa hàng sẽ phản hồi sớm nhất có thể.</p></header>
    <div className="contact-grid">
      <div className="contact-details"><div><span>EMAIL</span><strong>hello@ngoccamphuong.local</strong></div><div><span>GIỜ HỖ TRỢ</span><strong>08:30 — 18:00<br />Thứ Hai đến Thứ Bảy</strong></div><div><span>CHÍNH SÁCH MUA HÀNG</span><p>Sản phẩm bán theo đơn vị có số mét cố định. Đơn chỉ được xác nhận sau khi cửa hàng kiểm tra tồn kho.</p></div><div><span>ĐỔI TRẢ</span><p>Liên hệ trong vòng 48 giờ nếu sản phẩm giao sai hoặc có lỗi từ cửa hàng.</p></div></div>
      {sent ? <div className="contact-success"><span>ĐÃ GỬI LỜI NHẮN</span><h2>Cảm ơn bạn.</h2><p>Cửa hàng đã ghi nhận thông tin và sẽ phản hồi trong thời gian hỗ trợ.</p><button type="button" onClick={() => setSent(false)}>Gửi lời nhắn khác</button></div> : <form className="contact-form" onSubmit={submit}><label>Họ và tên<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={160} autoComplete="name" required /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} autoComplete="email" required /></label><label>Chủ đề<select value={topic} onChange={(event) => setTopic(event.target.value)}>{contactTopics.map((item) => <option key={item}>{item}</option>)}</select></label><label>Nội dung<textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} minLength={5} maxLength={2000} required placeholder="Bạn cần chúng tôi hỗ trợ điều gì?" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={sending} type="submit">{sending ? "Đang gửi..." : "Gửi lời nhắn"} <span>→</span></button></form>}
    </div>
  </section>;
}
