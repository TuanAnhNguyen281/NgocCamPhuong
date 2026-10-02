import { useApp } from "../../app-context";
import { ChangePasswordForm } from "../../components/ChangePasswordForm";

export function AdminAccountPage() {
  const { auth } = useApp();
  return <section className="admin-card admin-account">
    <header><div><span className="admin-kicker">BẢO MẬT</span><h3>Đổi mật khẩu</h3></div><span>{auth?.user.email}</span></header>
    <ChangePasswordForm />
  </section>;
}
