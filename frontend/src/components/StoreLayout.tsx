import { Outlet, useLocation } from "react-router-dom";
import { CartDrawer } from "./CartDrawer";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StoreLayout() {
  const location = useLocation();
  const compact = location.pathname === "/login" || location.pathname === "/register";
  return <div className="app-shell">
    <SiteHeader />
    <main><Outlet /></main>
    {!compact && <SiteFooter />}
    <CartDrawer />
  </div>;
}
