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

export type OrderRead = {
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
  items: OrderItemRead[];
};
