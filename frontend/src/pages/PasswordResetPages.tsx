import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { requestPasswordReset, resetPassword } from "../api";

function Intro({ title, text }: { title: React.ReactNode; text: string }) {
  return <div className="auth-intro"><p className="eyebrow">NGỌC CẨM PHƯỜNG / TÀI KHOẢN</p><h1>{title}</h1><span className="short-rule" /><p>{text}</p></div>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try { await requestPasswordReset(email); setSent(true); }
    catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }

  return <section className="auth-page">
    <Intro title={<>Quên<br /><em>mật khẩu?</em></>} text="Nhập email đã đăng ký. Chúng tôi sẽ gửi một liên kết để bạn đặt lại mật khẩu." />
    <div className="auth-card">
      {sent ? <div className="auth-result"><p className="eyebrow">ĐÃ GHI NHẬN YÊU CẦU</p><h2>Hãy kiểm tra hộp thư.</h2><p>Nếu <strong>{email}</strong> đã đăng ký, một liên kết đặt lại mật khẩu sẽ được gửi tới đó. Liên kết có hiệu lực trong 30 phút.</p><Link className="underlined-link" to="/login">Về trang đăng nhập <span>→</span></Link></div>
        : <form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading} type="submit">{loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}<span>→</span></button><Link className="auth-secondary-link" to="/login">Quay lại đăng nhập</Link></form>}
    </div>
  </section>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password.length < 8) { setError("Mật khẩu mới cần ít nhất 8 ký tự."); return; }
    if (password !== confirm) { setError("Hai lần nhập mật khẩu chưa khớp."); return; }
    setLoading(true);
    try { await resetPassword(token, password); setDone(true); }
    catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }

  return <section className="auth-page">
    <Intro title={<>Đặt lại<br /><em>mật khẩu.</em></>} text="Chọn một mật khẩu mới cho tài khoản của bạn. Liên kết này chỉ dùng được một lần." />
    <div className="auth-card">
      {!token ? <div className="auth-result"><h2>Liên kết không hợp lệ.</h2><p>Hãy mở lại liên kết trong email, hoặc yêu cầu một liên kết mới.</p><Link className="underlined-link" to="/forgot-password">Yêu cầu liên kết mới <span>→</span></Link></div>
        : done ? <div className="auth-result"><p className="eyebrow">HOÀN TẤT</p><h2>Mật khẩu đã được đổi.</h2><p>Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p><Link className="underlined-link" to="/login">Đăng nhập <span>→</span></Link></div>
        : <form onSubmit={submit}><label>Mật khẩu mới<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required autoFocus /></label><label>Nhập lại mật khẩu mới<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading} type="submit">{loading ? "Đang lưu..." : "Đặt lại mật khẩu"}<span>→</span></button>{error && <Link className="auth-secondary-link" to="/forgot-password">Yêu cầu liên kết mới</Link>}</form>}
    </div>
  </section>;
}
