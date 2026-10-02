export type ProductRow = {
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
  is_deleted: boolean;
};

export type UserRow = {
  id: number;
  email: string;
  password_hash: string | null;
  full_name: string;
  role: "customer" | "manager" | "admin";
  status: string;
  google_subject: string | null;
  created_at?: string;
  last_login_at?: string | null;
};

export type OrderItemRead = {
  product_id: number;
  product_name: string;
  fixed_meters: string;
  quantity: number;
  total_meters: string;
  line_total: string;
};

export type OrderHistoryRead = {
  id: number;
  from_status: string | null;
  to_status: string;
  actor_name: string;
  actor_role: string;
  note: string | null;
  created_at: string;
};

export type OrderRead = {
  id: number;
  order_code: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  note: string | null;
  created_at: string;
  // So giay khach con duoc tu huy don; 0 khi het han hoac don khong con o trang thai cho xac nhan.
  cancel_seconds_left: number;
  history: OrderHistoryRead[];
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  total_meters: string;
  items: OrderItemRead[];
};
