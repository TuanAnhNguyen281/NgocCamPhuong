import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartDrawer } from "./CartDrawer";
import { ChatWidget } from "./ChatWidget";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StoreLayout() {
  const location = useLocation();
  const compact = ["/login", "/register", "/forgot-password", "/reset-password"].includes(location.pathname);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);

  return <div className="app-shell">
    <div className="route-progress" key={location.key} aria-hidden="true" />
    <SiteHeader />
    <main className="page-enter" key={location.pathname}><Outlet /></main>
    {!compact && <SiteFooter />}
    <CartDrawer />
    <ChatWidget />
  </div>;
}
