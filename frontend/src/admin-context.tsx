import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  createCategory as apiCreateCategory,
  createManagerProduct,
  deleteCategory as apiDeleteCategory,
  deleteManagerProduct,
  getAdminNotifications,
  getAdminUsers,
  getCategories,
  getManagerOrders,
  getManagerProducts,
  updateManagerOrderStatus,
  updateCategory as apiUpdateCategory,
  updateManagerProduct,
  updateUserRole,
  type AdminNotifications,
  type AdminUser,
  type Category,
  type CategoryPayload,
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
  categories: Category[];
  orders: Order[];
  users: AdminUser[];
  notifications: AdminNotifications;
  // Thong bao noi khi co don moi hoac tin nhan moi trong luc dang lam viec.
  toast: string;
  dismissToast: () => void;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
  error: string;
  notice: string;
  clearMessages: () => void;
  refresh: () => Promise<void>;
  createProduct: (payload: ProductPayload) => Promise<void>;
  updateProduct: (id: number, payload: Partial<ProductPayload>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  createCategory: (payload: CategoryPayload) => Promise<void>;
  updateCategory: (id: number, payload: CategoryPayload) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  updateOrder: (id: number, status: string) => Promise<void>;
  updateRole: (id: number, role: UserRole) => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { auth, refreshProducts: refreshPublicProducts } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotifications>({ pending_orders: 0, unread_chats: 0, new_messages: 0 });
  const [toast, setToast] = useState("");
  const previousNotifications = useRef<AdminNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    if (!auth || auth.user.role === "customer") return;
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextOrders, nextCategories] = await Promise.all([
        getManagerProducts(auth.token),
        getManagerOrders(auth.token),
        getCategories(auth.token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOrders(nextOrders);
      setUsers(auth.user.role === "admin" ? await getAdminUsers(auth.token) : []);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [auth?.token, auth?.user.role]);

  async function refreshNotifications() {
    if (!auth || auth.user.role === "customer") return;
    try {
      const next = await getAdminNotifications(auth.token);
      const previous = previousNotifications.current;
      previousNotifications.current = next;
      setNotifications(next);
      if (!previous) return;
      if (next.pending_orders > previous.pending_orders) {
        setToast(`Có ${next.pending_orders - previous.pending_orders} đơn hàng mới đang chờ xác nhận.`);
        setOrders(await getManagerOrders(auth.token));
      } else if (next.unread_chats > previous.unread_chats) {
        setToast("Có tin nhắn mới từ khách hàng.");
      } else if (next.new_messages > previous.new_messages) {
        setToast("Có lời nhắn mới từ trang Liên hệ.");
      }
    } catch { /* mat ket noi tam thoi: thu lai o lan hoi tiep theo */ }
  }

  // Khong co ket noi thoi gian thuc, nen hoi lai may chu dinh ky.
  useEffect(() => {
    if (!auth || auth.user.role === "customer") return undefined;
    previousNotifications.current = null;
    void refreshNotifications();
    const timer = window.setInterval(() => { if (!document.hidden) void refreshNotifications(); }, 20000);
    return () => window.clearInterval(timer);
  }, [auth?.token, auth?.user.role]);

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

  // Danh muc anh huong ca so dem lan ten tren san pham, nen tai lai ca hai sau moi thay doi.
  async function reloadCatalog(token: string) {
    const [nextProducts, nextCategories] = await Promise.all([getManagerProducts(token), getCategories(token)]);
    setProducts(nextProducts);
    setCategories(nextCategories);
  }

  async function changeCategory(action: (token: string) => Promise<unknown>, message: string) {
    if (!auth) return;
    clearMessages();
    try {
      await action(auth.token);
      await reloadCatalog(auth.token);
      setNotice(message);
      await refreshPublicProducts();
    } catch (reason) {
      setError((reason as Error).message);
      throw reason;
    }
  }

  const createCategory = (payload: CategoryPayload) => changeCategory((token) => apiCreateCategory(token, payload), "Đã tạo danh mục mới.");
  const updateCategory = (id: number, payload: CategoryPayload) => changeCategory((token) => apiUpdateCategory(token, id, payload), "Đã lưu thay đổi danh mục.");
  const deleteCategory = (id: number) => changeCategory((token) => apiDeleteCategory(token, id), "Đã xóa danh mục.");

  async function updateOrder(id: number, status: string) {
    if (!auth) return;
    clearMessages();
    try {
      const updated = await updateManagerOrderStatus(auth.token, id, status);
      setOrders((current) => current.map((item) => item.id === id ? updated : item));
      setNotice(status === "cancelled" ? "Đã hủy đơn hàng và trả số lượng lại kho." : "Đã cập nhật trạng thái đơn hàng.");
      void refreshNotifications();
      // Huy don tra hang lai kho, nen ton kho tren man hinh can duoc tai lai.
      if (status === "cancelled") { setProducts(await getManagerProducts(auth.token)); void refreshPublicProducts(); }
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

  return <AdminContext.Provider value={{ products, categories, orders, users, notifications, toast, dismissToast: () => setToast(""), refreshNotifications, loading, error, notice, clearMessages, refresh, createProduct, updateProduct, deleteProduct, createCategory, updateCategory, deleteCategory, updateOrder, updateRole }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdmin must be used inside AdminProvider");
  return value;
}
