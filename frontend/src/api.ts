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

export type Order = {
  id: number;
  order_code: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
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

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(apiUrl + path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Khong the ket noi may chu");
  return payload as T;
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(apiUrl + "/api/products?status=published");
  if (!response.ok) throw new Error("Khong the tai danh sach san pham");
  return response.json();
}

export async function getProduct(id: number): Promise<Product> {
  const response = await fetch(apiUrl + `/api/products/${id}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "Khong the tai chi tiet san pham");
  return payload as Product;
}

export async function getHealth(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl + "/api/health");
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

export async function createOrder(token: string | undefined, payload: { shipping_address: string; items: Array<{ product_id: number; quantity: number }>; customer_name?: string; customer_email?: string }) {
  return request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function getCustomerOrders(token: string) {
  return request<Order[]>("/api/customer/orders", {}, token);
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
  const response = await fetch(apiUrl + "/api/manager/uploads/product-image", { method: "POST", headers, body });
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
  const response = await fetch(apiUrl + `/api/manager/products/${id}`, { method: "DELETE", headers });
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

export async function getAdminUsers(token: string) {
  return request<AdminUser[]>("/api/admin/users", {}, token);
}

export async function updateUserRole(token: string, id: number, role: UserRole) {
  return request<AdminUser>(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }, token);
}
