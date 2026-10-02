import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useApp } from "../app-context";

const links = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/products", label: "Sản phẩm" },
  { to: "/story", label: "Câu chuyện" },
  { to: "/contact", label: "Liên hệ" },
];

export function SiteHeader() {
  const { auth, cartCount, setCartOpen, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return <header className="site-header">
    <Link className="wordmark" to="/" aria-label="Ngọc Cẩm Phường - Trang chủ">
      <span className="wordmark-main">Ngọc Cẩm Phường</span>
      <span className="wordmark-sub">VẢI ĐẸP CHO NHỮNG ĐIỀU BÌNH DỊ</span>
    </Link>
    <button className="nav-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Danh mục</button>
    <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Điều hướng chính">
      {links.map((item) => <NavLink key={item.to} end={item.end} to={item.to} onClick={() => setMenuOpen(false)}>{item.label}</NavLink>)}
    </nav>
    <div className="header-actions">
      {auth ? <>
        <Link className="header-account" to={auth.user.role === "customer" ? "/account" : "/dashboard"}>
          {auth.user.role === "customer" ? auth.user.full_name : "Khu quản lý"}
        </Link>
        <button className="logout-link" type="button" onClick={logout}>Đăng xuất</button>
      </> : <Link className="login-link" to="/login">Đăng nhập</Link>}
      <button className="cart-toggle" type="button" onClick={() => setCartOpen(true)}>
        Giỏ hàng <span>({cartCount})</span>
      </button>
    </div>
  </header>;
}
