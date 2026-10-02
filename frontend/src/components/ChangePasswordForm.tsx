import { useState } from "react";
import { changePassword } from "../api";
import { useApp } from "../app-context";

export function ChangePasswordForm() {
  const { auth } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setDone(false);
    if (next.length < 8) { setError("Mật khẩu mới cần ít nhất 8 ký tự."); return; }
    if (next !== confirm) { setError("Hai lần nhập mật khẩu mới chưa khớp."); return; }
    if (!auth) return;
    setSaving(true);
    try {
      await changePassword(auth.token, { current_password: current || undefined, new_password: next });
      setCurrent(""); setNext(""); setConfirm(""); setDone(true);
    } catch (reason) { setError((reason as Error).message); }
    finally { setSaving(false); }
  }

  return <form className="password-form" onSubmit={submit}>
    <label>Mật khẩu hiện tại<input type="password" value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" /><small>Để trống nếu bạn chỉ đăng nhập bằng Google và chưa từng đặt mật khẩu.</small></label>
    <label>Mật khẩu mới<input type="password" value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
    <label>Nhập lại mật khẩu mới<input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
    {error && <p className="form-error">{error}</p>}
    {done && <p className="form-message" role="status">Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.</p>}
    <button className="primary-button" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Đổi mật khẩu"}<span>→</span></button>
  </form>;
}
