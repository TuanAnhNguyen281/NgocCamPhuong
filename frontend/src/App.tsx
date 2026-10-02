import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./app-context";
import { AdminLayout } from "./components/AdminLayout";
import { StoreLayout } from "./components/StoreLayout";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { ContactPage } from "./pages/ContactPage";
import { CustomerOrdersPage } from "./pages/CustomerOrdersPage";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { StoryPage } from "./pages/StoryPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { OrdersAdminPage } from "./pages/admin/OrdersAdminPage";
import { ProductsAdminPage } from "./pages/admin/ProductsAdminPage";
import { UsersAdminPage } from "./pages/admin/UsersAdminPage";

function App() {
  return <AppProvider>
    <HashRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="story" element={<StoryPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="orders" element={<CustomerOrdersPage />} />
        </Route>
        <Route path="dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsAdminPage />} />
          <Route path="orders" element={<OrdersAdminPage />} />
          <Route path="users" element={<UsersAdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </AppProvider>;
}

export default App;
