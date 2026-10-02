import { useEffect } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AdminProvider, useAdmin } from "../admin-context";
import { useApp } from "../app-context";

const titles: Record<string, string> = {
  products: "Quản lý sản phẩm",
  categories: "Quản lý danh mục",
  orders: "Quản lý đơn hàng",
  chats: "Trò chuyện với khách",
  messages: "Lời nhắn từ khách",
  users: "Người dùng & phân quyền",
  account: "Tài khoản của tôi",
};

function AdminShell() {
  const { auth, logout } = useApp();
  const { notifications, toast, dismissToast } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const section = location.pathname.split("/")[2] ?? "";
  const title = titles[section] ?? "Tổng quan cửa hàng";
  const navItems = [
    { to: "/dashboard", label: "Tổng quan", end: true, badge: 0 },
    { to: "/dashboard/products", label: "Sản phẩm", badge: 0 },
    { to: "/dashboard/categories", label: "Danh mục", badge: 0 },
    { to: "/dashboard/orders", label: "Đơn hàng", badge: notifications.pending_orders },
    { to: "/dashboard/chats", label: "Trò chuyện", badge: notifications.unread_chats },
    { to: "/dashboard/messages", label: "Lời nhắn", badge: notifications.new_messages },
  ];

  // Tab dang o nen van thay duoc so don dang cho qua tieu de trang.
  useEffect(() => {
    document.title = notifications.pending_orders > 0 ? `(${notifications.pending_orders}) Đơn chờ xử lý · Ngọc Cẩm Phường` : "Ngọc Cẩm Phường";
    return () => { document.title = "Ngọc Cẩm Phường"; };
  }, [notifications.pending_orders]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(dismissToast, 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return <div className="admin-shell">
    <div className="route-progress" key={location.key} aria-hidden="true" />
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>NGỌC CẨM PHƯỜNG</span><strong>Studio Console</strong></div>
      <nav aria-label="Điều hướng quản lý">
        {navItems.map((item) => <NavLink key={item.to} end={item.end} to={item.to}><span>{item.label}</span>{item.badge > 0 && <em className="nav-badge" aria-label={`${item.badge} mục chờ xử lý`}>{item.badge}</em>}</NavLink>)}
        {auth?.user.role === "admin" && <NavLink to="/dashboard/users"><span>Người dùng</span></NavLink>}
      </nav>
      <div className="admin-sidebar-foot">
        <button type="button" onClick={() => navigate("/dashboard/account")}>Đổi mật khẩu</button>
        <button type="button" onClick={() => navigate("/")}>Về cửa hàng</button>
        <button type="button" onClick={() => { logout(); navigate("/"); }}>Đăng xuất</button>
      </div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar">
        <div><p>KHÔNG GIAN VẬN HÀNH</p><h1>{title}</h1></div>
        <div className="admin-profile"><span>{auth?.user.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{auth?.user.full_name}</strong><small>{auth?.user.role === "admin" ? "Quản trị viên" : "Quản lý cửa hàng"}</small></div></div>
      </header>
      {notifications.pending_orders > 0 && section !== "orders" && <Link className="pending-alert" to="/dashboard/orders"><span className="pending-dot" aria-hidden="true" /><span><strong>{notifications.pending_orders} đơn hàng đang chờ xác nhận.</strong> Khách có thể tự hủy trong 5 phút đầu; hãy xác nhận sớm.</span><em>Xử lý ngay →</em></Link>}
      <div className="admin-page page-enter" key={location.pathname}><Outlet /></div>
    </main>
    {toast && <div className="admin-toast" role="status"><span>{toast}</span><button type="button" onClick={dismissToast}>Đóng</button></div>}
  </div>;
}

export function AdminLayout() {
  const { auth } = useApp();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user.role === "customer") return <Navigate to="/" replace />;
  return <AdminProvider><AdminShell /></AdminProvider>;
}
