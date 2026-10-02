import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AdminProvider } from "../admin-context";
import { useApp } from "../app-context";

const navItems = [
  { to: "/dashboard", label: "Tổng quan", end: true },
  { to: "/dashboard/products", label: "Sản phẩm" },
  { to: "/dashboard/orders", label: "Đơn hàng" },
];

function AdminShell() {
  const { auth, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.pathname.endsWith("/products") ? "Quản lý sản phẩm" : location.pathname.endsWith("/orders") ? "Quản lý đơn hàng" : location.pathname.endsWith("/users") ? "Người dùng & phân quyền" : "Tổng quan cửa hàng";
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>NGỌC CẨM PHƯỜNG</span><strong>Studio Console</strong></div>
      <nav aria-label="Điều hướng quản lý">
        {navItems.map((item) => <NavLink key={item.to} end={item.end} to={item.to}><span>{item.label}</span></NavLink>)}
        {auth?.user.role === "admin" && <NavLink to="/dashboard/users"><span>Người dùng</span></NavLink>}
      </nav>
      <div className="admin-sidebar-foot">
        <button type="button" onClick={() => navigate("/")}>Về cửa hàng</button>
        <button type="button" onClick={() => { logout(); navigate("/"); }}>Đăng xuất</button>
      </div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar">
        <div><p>KHÔNG GIAN VẬN HÀNH</p><h1>{title}</h1></div>
        <div className="admin-profile"><span>{auth?.user.full_name.slice(0, 1).toUpperCase()}</span><div><strong>{auth?.user.full_name}</strong><small>{auth?.user.role === "admin" ? "Quản trị viên" : "Quản lý cửa hàng"}</small></div></div>
      </header>
      <div className="admin-page"><Outlet /></div>
    </main>
  </div>;
}

export function AdminLayout() {
  const { auth } = useApp();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user.role === "customer") return <Navigate to="/" replace />;
  return <AdminProvider><AdminShell /></AdminProvider>;
}
