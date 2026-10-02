import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createManagerProduct,
  deleteManagerProduct,
  getAdminUsers,
  getManagerOrders,
  getManagerProducts,
  updateManagerOrderStatus,
  updateManagerProduct,
  updateUserRole,
  type AdminUser,
  type Order,
  type Product,
  type UserRole,
} from "./api";
import { useApp } from "./app-context";

export type ProductPayload = {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  fixed_meters: number;
  unit_label: string;
  price: number;
  stock_quantity: number;
  status: string;
};

type AdminContextValue = {
  products: Product[];
  orders: Order[];
  users: AdminUser[];
  loading: boolean;
  error: string;
  notice: string;
  clearMessages: () => void;
  refresh: () => Promise<void>;
  createProduct: (payload: ProductPayload) => Promise<void>;
  updateProduct: (id: number, payload: Partial<ProductPayload>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  updateOrder: (id: number, status: string) => Promise<void>;
  updateRole: (id: number, role: UserRole) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { auth, refreshProducts: refreshPublicProducts } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    if (!auth || auth.user.role === "customer") return;
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextOrders] = await Promise.all([
        getManagerProducts(auth.token),
        getManagerOrders(auth.token),
      ]);
      setProducts(nextProducts);
      setOrders(nextOrders);
      setUsers(auth.user.role === "admin" ? await getAdminUsers(auth.token) : []);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [auth?.token, auth?.user.role]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function createProduct(payload: ProductPayload) {
    if (!auth) return;
    clearMessages();
    try {
      const created = await createManagerProduct(auth.token, payload as never);
      setProducts((current) => [created, ...current]);
      setNotice("Đã tạo sản phẩm mới.");
      await refreshPublicProducts();
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  async function updateProduct(id: number, payload: Partial<ProductPayload>) {
    if (!auth) return;
    clearMessages();
    try {
      const updated = await updateManagerProduct(auth.token, id, payload as Partial<Product>);
      setProducts((current) => current.map((item) => item.id === id ? updated : item));
      setNotice("Đã lưu thay đổi sản phẩm.");
      await refreshPublicProducts();
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  async function deleteProduct(id: number) {
    if (!auth) return;
    clearMessages();
    try {
      await deleteManagerProduct(auth.token, id);
      setProducts((current) => current.filter((item) => item.id !== id));
      setNotice("Đã xóa sản phẩm khỏi danh mục.");
      await refreshPublicProducts();
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  async function updateOrder(id: number, status: string) {
    if (!auth) return;
    clearMessages();
    try {
      const updated = await updateManagerOrderStatus(auth.token, id, status);
      setOrders((current) => current.map((item) => item.id === id ? updated : item));
      setNotice("Đã cập nhật trạng thái đơn hàng.");
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  async function updateRole(id: number, role: UserRole) {
    if (!auth) return;
    clearMessages();
    try {
      const updated = await updateUserRole(auth.token, id, role);
      setUsers((current) => current.map((item) => item.id === id ? { ...item, ...updated } : item));
      setNotice("Đã cập nhật vai trò người dùng.");
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  return <AdminContext.Provider value={{ products, orders, users, loading, error, notice, clearMessages, refresh, createProduct, updateProduct, deleteProduct, updateOrder, updateRole }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside AdminProvider");
  return value;
}
