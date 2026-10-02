import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { updateProfile } from "../api";
import { useApp } from "../app-context";
import { ChangePasswordForm } from "../components/ChangePasswordForm";

export function AccountPage() {
  const { auth, updateSessionUser } = useApp();
  const [name, setName] = useState(auth?.user.full_name ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (!auth) return <Navigate to="/login" replace state={{ from: "/account" }} />;
  if (auth.user.role !== "customer") return <Navigate to="/dashboard" replace />;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try { const result = await updateProfile(auth!.token, name); updateSessionUser(result.user); setMessage("Đã lưu thông tin cá nhân."); }
    catch (reason) { setMessage((reason as Error).message); }
    finally { setSaving(false); }
  }
  return <section className="customer-workspace"><aside><p className="eyebrow">TÀI KHOẢN</p><h1>Góc<br /><em>của bạn.</em></h1><nav><Link className="active" to="/account">Thông tin cá nhân</Link><Link to="/orders">Đơn hàng của tôi</Link><Link to="/products">Tiếp tục mua hàng</Link></nav></aside><div className="customer-content"><header><p className="eyebrow">HỒ SƠ KHÁCH HÀNG</p><h2>Thông tin của bạn</h2><p>Quản lý thông tin dùng cho tài khoản và theo dõi đơn hàng.</p></header><div className="profile-card"><div className="profile-identity"><span>{auth.user.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{auth.user.full_name}</strong><small>{auth.user.email}</small></div></div><form onSubmit={save}><label>Họ và tên<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email<input value={auth.user.email} disabled /></label>{message && <p className="form-message">{message}</p>}<button className="primary-button" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Lưu thay đổi"}<span>→</span></button></form></div><div className="profile-card password-card"><p className="eyebrow">BẢO MẬT</p><h3>Đổi mật khẩu</h3><ChangePasswordForm /></div></div></section>;
}
