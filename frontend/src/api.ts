export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  fixed_meters: string;
  unit_label: string;
  price: string;
  stock_quantity: number;
  status: string;
};

export type UserRole = "customer" | "manager" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  status: string;
};

export type AuthResponse = { token: string; user: User };

export type OrderItem = {
  product_id: number;
  product_name: string;
  fixed_meters: string;
  quantity: number;
  total_meters: string;
  line_total: string;
};

export type OrderHistoryEntry = {
  id: number;
  from_status: string | null;
  to_status: string;
  actor_name: string;
  actor_role: string;
  note: string | null;
  created_at: string;
};

export type PaymentMethod = "cod" | "bank_transfer";

export type Order = {
  id: number;
  order_code: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  note: string | null;
  created_at: string;
  // So giay khach con duoc tu huy, tinh tai thoi diem may chu tra loi.
  cancel_seconds_left: number;
  history: OrderHistoryEntry[];
  email_sent?: boolean;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  total_meters: string;
  items: OrderItem[];
};

export type AdminUser = Pick<User, "id" | "email" | "full_name" | "role" | "status"> & {
  created_at: string;
  last_login_at: string | null;
};

export type Category = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  product_count: number;
};

export type CategoryPayload = { name: string; description?: string | null };

export const contactTopics = ["Tư vấn sản phẩm", "Hỗ trợ đơn hàng", "Đổi trả", "Khác"] as const;

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "new" | "handled";
  created_at: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// fetch nem TypeError "Failed to fetch" khi khong toi duoc may chu (backend chua chay, sai URL, bi CORS chan).
async function apiFetch(path: string, init?: RequestInit) {
  try {
    return await fetch(apiUrl + path, init);
  } catch {
    throw new Error(`Không kết nối được máy chủ (${apiUrl}). Kiểm tra backend đã chạy chưa rồi thử lại.`);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await apiFetch(path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Khong the ket noi may chu");
  return payload as T;
}

export async function getProducts(): Promise<Product[]> {
  const response = await apiFetch("/api/products");
  if (!response.ok) throw new Error("Khong the tai danh sach san pham");
  return response.json();
}

export async function getProduct(id: number): Promise<Product> {
  const response = await apiFetch(`/api/products/${id}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Khong the tai chi tiet san pham");
  return payload as Product;
}

export async function getHealth(): Promise<boolean> {
  try {
    const response = await apiFetch("/api/health");
    return response.ok;
  } catch {
    return false;
  }
}

export async function registerAccount(payload: { full_name: string; email: string; password: string }) {
  return request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function loginAccount(payload: { email: string; password: string }) {
  return request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function loginWithGoogle(credential: string) {
  return request<AuthResponse>("/api/auth/google", { method: "POST", body: JSON.stringify({ credential }) });
}

export async function getCurrentUser(token: string) {
  return request<{ user: User }>("/api/auth/me", {}, token);
}

export async function updateProfile(token: string, full_name: string) {
  return request<{ user: User }>("/api/auth/me", { method: "PATCH", body: JSON.stringify({ full_name }) }, token);
}

export type OrderPayload = {
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  note?: string;
  payment_method: PaymentMethod;
  items: Array<{ product_id: number; quantity: number }>;
};

export async function createOrder(token: string | undefined, payload: OrderPayload) {
  return request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function getCustomerOrders(token: string) {
  return request<Order[]>("/api/customer/orders", {}, token);
}

export async function cancelCustomerOrder(token: string, id: number) {
  return request<Order>(`/api/customer/orders/${id}/cancel`, { method: "POST" }, token);
}

export async function getManagerProducts(token: string) {
  return request<Product[]>("/api/manager/products", {}, token);
}

export async function uploadProductImage(token: string, file: File) {
  if (file.size > 4 * 1024 * 1024) throw new Error("Anh khong duoc vuot qua 4 MB");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const body = new FormData();
  body.append("image", file);
  const response = await apiFetch("/api/manager/uploads/product-image", { method: "POST", headers, body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Khong the tai anh len");
  return payload as { url: string };
}

export async function createManagerProduct(token: string, payload: Omit<Product, "id" | "image_url" | "is_deleted"> & { image_url?: string | null }) {
  return request<Product>("/api/manager/products", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateManagerProduct(token: string, id: number, payload: Partial<Product>) {
  return request<Product>(`/api/manager/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function deleteManagerProduct(token: string, id: number) {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const response = await apiFetch(`/api/manager/products/${id}`, { method: "DELETE", headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "Khong the xoa san pham");
  }
}

export async function getManagerOrders(token: string) {
  return request<Order[]>("/api/manager/orders", {}, token);
}

export async function updateManagerOrderStatus(token: string, id: number, status: string) {
  return request<Order>(`/api/manager/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
}

export async function getCategories(token: string) {
  return request<Category[]>("/api/manager/categories", {}, token);
}

export async function createCategory(token: string, payload: CategoryPayload) {
  return request<Category>("/api/manager/categories", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function updateCategory(token: string, id: number, payload: CategoryPayload) {
  return request<Category>(`/api/manager/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token);
}

export async function deleteCategory(token: string, id: number) {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const response = await apiFetch(`/api/manager/categories/${id}`, { method: "DELETE", headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "Khong the xoa danh muc");
  }
}

export async function sendContactMessage(payload: { name: string; email: string; topic: string; message: string }) {
  return request<{ status: string }>("/api/contact", { method: "POST", body: JSON.stringify(payload) });
}

export async function getContactMessages(token: string) {
  return request<ContactMessage[]>("/api/manager/contact-messages", {}, token);
}

export async function updateContactMessageStatus(token: string, id: number, status: ContactMessage["status"]) {
  return request<ContactMessage>(`/api/manager/contact-messages/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
}

export async function getAdminUsers(token: string) {
  return request<AdminUser[]>("/api/admin/users", {}, token);
}

export async function updateUserRole(token: string, id: number, role: UserRole) {
  return request<AdminUser>(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token);
}

export type Report = {
  days: number;
  summary: { revenue: number; completed_revenue: number; orders: number; cancelled: number; meters: number };
  daily: Array<{ day: string; revenue: number; orders: number }>;
  by_status: Array<{ status: string; orders: number }>;
  by_payment: Array<{ payment_method: string; orders: number; revenue: number }>;
  top_products: Array<{ product_name: string; quantity: number; meters: number; revenue: number }>;
};

export async function getReport(token: string, days: number) {
  return request<Report>(`/api/manager/reports?days=${days}`, {}, token);
}

export type AdminNotifications = { pending_orders: number; unread_chats: number; new_messages: number };

export async function getAdminNotifications(token: string) {
  return request<AdminNotifications>("/api/manager/notifications", {}, token);
}

export type ChatMessage = { id: number; sender_role: "customer" | "staff"; sender_name: string; body: string; created_at: string };

export type ChatConversation = {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  last_body: string;
  last_sender_role: "customer" | "staff";
  last_at: string;
  unread: number;
};

export async function getCustomerChat(token: string) {
  return request<ChatMessage[]>("/api/customer/chat", {}, token);
}

export async function getCustomerChatUnread(token: string) {
  return request<{ unread: number }>("/api/customer/chat/unread", {}, token);
}

export async function sendCustomerChat(token: string, body: string) {
  return request<ChatMessage[]>("/api/customer/chat", { method: "POST", body: JSON.stringify({ body }) }, token);
}

export async function getChatConversations(token: string) {
  return request<ChatConversation[]>("/api/manager/chats", {}, token);
}

export async function getManagerChat(token: string, customerId: number) {
  return request<ChatMessage[]>(`/api/manager/chats/${customerId}`, {}, token);
}

export async function sendManagerChat(token: string, customerId: number, body: string) {
  return request<ChatMessage[]>(`/api/manager/chats/${customerId}`, { method: "POST", body: JSON.stringify({ body }) }, token);
}

export async function changePassword(token: string, payload: { current_password?: string; new_password: string }) {
  return request<{ status: string }>("/api/auth/password", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function requestPasswordReset(email: string) {
  return request<{ status: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, new_password: string) {
  return request<{ status: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password }) });
}
