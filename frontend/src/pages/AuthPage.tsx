import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { loginAccount, loginWithGoogle, registerAccount } from "../api";
import { useApp } from "../app-context";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = { accounts: { id: { initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void; renderButton: (element: HTMLElement, options: Record<string, string | number>) => void; cancel: () => void } } };
declare global { interface Window { google?: GoogleIdentity } }

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { auth, saveSession } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleRef = useRef<HTMLDivElement>(null);

  const finish = useCallback((session: Awaited<ReturnType<typeof loginAccount>>) => {
    saveSession(session);
    const fallback = session.user.role === "customer" ? "/" : "/dashboard";
    const requested = (location.state as { from?: string } | null)?.from;
    navigate(requested && session.user.role === "customer" ? requested : fallback, { replace: true });
  }, [location.state, navigate, saveSession]);

  const handleGoogle = useCallback(async (credential: string) => {
    setLoading(true); setError("");
    try { finish(await loginWithGoogle(credential)); }
    catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }, [finish]);

  useEffect(() => {
    if (mode !== "login" || !GOOGLE_CLIENT_ID || !googleRef.current) return;
    let tries = 0;
    const mount = () => {
      if (!googleRef.current || !window.google) { if (tries++ < 40) window.setTimeout(mount, 100); return; }
      googleRef.current.innerHTML = "";
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response) => void handleGoogle(response.credential) });
      window.google.accounts.id.renderButton(googleRef.current, { theme: "outline", size: "large", text: "continue_with", width: Math.min(360, googleRef.current.clientWidth), logo_alignment: "left" });
    };
    mount();
    return () => window.google?.accounts.id.cancel();
  }, [handleGoogle, mode]);

  if (auth) return <Navigate to={auth.user.role === "customer" ? "/" : "/dashboard"} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const result = mode === "login" ? await loginAccount({ email, password }) : await registerAccount({ full_name: name, email, password });
      finish(result);
    } catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }

  async function demo(role: "manager" | "admin") {
    setLoading(true); setError("");
    try { finish(await loginAccount({ email: role === "manager" ? "quanly@ngoccamphuong.local" : "admin@ngoccamphuong.local", password: role === "manager" ? "NgocCam@123" : "NgocAdmin@123" })); }
    catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }

  return <section className="auth-page">
    <div className="auth-intro"><p className="eyebrow">NGỌC CẨM PHƯỜNG / TÀI KHOẢN</p><h1>{mode === "login" ? <>Chào mừng<br /><em>trở lại.</em></> : <>Bắt đầu<br /><em>một câu chuyện.</em></>}</h1><span className="short-rule" /><p>{mode === "login" ? "Đăng nhập để xem đơn hàng, lưu lựa chọn và tiếp tục hành trình cùng những chất liệu tử tế." : "Tạo tài khoản khách hàng để theo dõi đơn hàng và mua vải thuận tiện hơn."}</p><div className="auth-aside-note">MỘT TÀI KHOẢN NHỎ<br /><span>CHO NHỮNG ĐIỀU BẠN ĐANG MAY.</span></div></div>
    <div className="auth-card"><div className="auth-tabs"><Link className={mode === "login" ? "selected" : ""} to="/login">Đăng nhập</Link><Link className={mode === "register" ? "selected" : ""} to="/register">Đăng ký</Link></div><form onSubmit={submit}>{mode === "register" && <label>Họ và tên<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Mật khẩu<input type="password" minLength={mode === "register" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading} type="submit">{loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}<span>→</span></button></form>
      {mode === "login" && <><div className="auth-divider"><span>hoặc tiếp tục với</span></div>{GOOGLE_CLIENT_ID ? <div className="google-button" ref={googleRef} /> : <div className="google-unavailable">Google Login chưa được cấu hình.{import.meta.env.DEV && <><br /><small>Thêm VITE_GOOGLE_CLIENT_ID vào frontend/.env để bật.</small></>}</div>}{import.meta.env.DEV && <div className="demo-accounts"><p className="eyebrow">TÀI KHOẢN TEST LOCAL</p><button type="button" onClick={() => void demo("manager")}><span>Quản lý cửa hàng</span><small>quanly@ngoccamphuong.local</small></button><button type="button" onClick={() => void demo("admin")}><span>Quản trị viên</span><small>admin@ngoccamphuong.local</small></button></div>}</>}
    </div>
  </section>;
}
