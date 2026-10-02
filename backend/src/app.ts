import cors from "cors";
import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { config } from "./config.js";
import type { PoolClient } from "pg";
import { pool } from "./db.js";
import { mailerReady, sendOrderConfirmation, sendPasswordReset } from "./mailer.js";
import { hashPassword, signToken, verifyPassword, verifyToken, type AuthUser, type UserRole } from "./auth.js";
import type { OrderRead, ProductRow, UserRow } from "./types.js";

const app = express();
const allowedOrigins = new Set(config.isProduction ? config.frontendOrigins : [...config.frontendOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]);
app.use(cors({ origin: (origin, callback) => {
  callback(null, !origin || allowedOrigins.has(origin));
} }));
app.use(express.json());

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  // Vercel Functions gioi han request body 4.5 MB, nen anh phai nho hon muc do.
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(new HttpError(400, "Chi chap nhan anh JPG, PNG hoac WebP"));
  },
});

function cloudinaryReady() {
  return Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret);
}

function uploadProductImage(file: Express.Multer.File) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: config.cloudinaryFolder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary khong tra ve URL anh"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

const productCreateSchema = z.object({
  sku: z.string().min(2).max(80),
  name: z.string().min(2).max(200),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  fixed_meters: z.coerce.number().positive(),
  unit_label: z.string().min(1).max(40).default("don vi"),
  price: z.coerce.number().nonnegative(),
  stock_quantity: z.coerce.number().int().nonnegative(),
  status: z.enum(["draft", "published", "hidden", "archived"]).default("draft"),
});
const productPatchSchema = productCreateSchema.partial();
const registerSchema = z.object({ full_name: z.string().min(2).max(160), email: z.string().email(), password: z.string().min(8).max(120) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(120) });
const googleSchema = z.object({ credential: z.string().min(20) });
const profilePatchSchema = z.object({ full_name: z.string().min(2).max(160) });
const orderCreateSchema = z.object({
  customer_name: z.string().min(2).max(160).optional(),
  customer_email: z.string().email().optional(),
  recipient_name: z.string().trim().min(2).max(160),
  // Bo khoang trang, dau cham, gach noi truoc khi kiem tra so dien thoai Viet Nam.
  recipient_phone: z.string().transform((value) => value.replace(/[\s.-]/g, "")).pipe(z.string().regex(/^(0|\+84)\d{9,10}$/)),
  shipping_address: z.string().trim().min(5).max(500),
  note: z.string().trim().max(500).nullable().optional(),
  payment_method: z.enum(["cod", "bank_transfer"]).default("cod"),
  items: z.array(z.object({ product_id: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),
});
const statusSchema = z.object({ status: z.enum(["pending", "confirmed", "preparing", "shipping", "completed", "cancelled"]), note: z.string().trim().max(500).nullable().optional() });
const roleSchema = z.object({ role: z.enum(["customer", "manager", "admin"]) });
const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  topic: z.enum(["Tư vấn sản phẩm", "Hỗ trợ đơn hàng", "Đổi trả", "Khác"]),
  message: z.string().trim().min(5).max(2000),
});
const categorySchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).nullable().optional() });
const contactStatusSchema = z.object({ status: z.enum(["new", "handled"]) });
const CANCEL_WINDOW_MINUTES = 5;
// Cac cot TIMESTAMP luu NOW() theo mui gio cua phien ket noi; doi sang timestamptz de tra ve dung thoi diem.
const utc = (column: string) => `${column} AT TIME ZONE current_setting('TimeZone')`;
const contactProjection = `id, name, email, topic, message, status, ${utc("created_at")} AS created_at`;
const productProjection = `id, sku, name, description, category, image_url, fixed_meters::text,
  unit_label, price::text, stock_quantity, status, is_deleted`;

function sendError(response: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    response.status(400).json({ message: "Du lieu khong hop le", issues: error.issues });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  // 23505 = unique_violation. SKU cua san pham da xoa mem van con giu trong bang.
  if ((error as { code?: string }).code === "23505" && (error as { constraint?: string }).constraint === "products_sku_key") {
    response.status(409).json({ message: "SKU da ton tai, vui long chon SKU khac" });
    return;
  }
  if ((error as { code?: string }).code === "23505" && (error as { constraint?: string }).constraint === "categories_name_key") {
    response.status(409).json({ message: "Ten danh muc da ton tai" });
    return;
  }
  console.error(error);
  response.status(500).json({ message: "Loi may chu" });
}

function toAuthUser(row: Pick<UserRow, "id" | "email" | "full_name" | "role" | "status">): AuthUser {
  return { id: row.id, email: row.email, full_name: row.full_name, role: row.role, status: row.status };
}

function tokenUser(request: Request) {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyToken(header.slice(7), config.jwtSecret);
}

function requireRole(request: Request, response: Response, roles: UserRole[]) {
  const user = tokenUser(request);
  if (!user) {
    response.status(401).json({ message: "Vui long dang nhap" });
    return null;
  }
  if (!roles.includes(user.role)) {
    response.status(403).json({ message: "Ban khong co quyen thuc hien thao tac nay" });
    return null;
  }
  return user;
}

function optionalCustomer(request: Request) {
  const user = tokenUser(request);
  return user?.role === "customer" ? user : null;
}

async function findUserByEmail(email: string) {
  const result = await pool.query<UserRow>(
    `SELECT id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return result.rows[0] ?? null;
}

function authResponse(response: Response, row: UserRow) {
  const user = toAuthUser(row);
  response.json({ token: signToken(user, config.jwtSecret), user });
}

async function verifyGoogleCredential(credential: string) {
  if (!config.googleClientId) throw new HttpError(503, "Google login chua duoc cau hinh o backend");
  const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!verification.ok) throw new HttpError(401, "Google credential khong hop le");
  const profile = await verification.json() as { aud?: string; iss?: string; email?: string; email_verified?: string; sub?: string; name?: string };
  const validIssuer = profile.iss === "accounts.google.com" || profile.iss === "https://accounts.google.com";
  if (profile.aud !== config.googleClientId || !validIssuer || profile.email_verified !== "true" || !profile.email || !profile.sub) {
    throw new HttpError(401, "Khong the xac minh tai khoan Google");
  }
  return profile;
}

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["preparing", "cancelled"], preparing: ["shipping", "cancelled"], shipping: ["completed"], completed: [], cancelled: [],
};

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", project: "Ngoc Cam Phuong", runtime: "node" });
});

app.post("/api/auth/register", async (request, response) => {
  try {
    const data = registerSchema.parse(request.body);
    if (await findUserByEmail(data.email)) throw new HttpError(409, "Email da duoc dang ky");
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role, status) VALUES ($1, $2, $3, 'customer', 'active') RETURNING id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at`,
      [data.email.toLowerCase(), hashPassword(data.password), data.full_name],
    );
    authResponse(response, result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/auth/login", async (request, response) => {
  try {
    const data = loginSchema.parse(request.body);
    const user = await findUserByEmail(data.email);
    if (!user || user.status !== "active" || !verifyPassword(data.password, user.password_hash)) throw new HttpError(401, "Email hoac mat khau khong dung");
    await pool.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [user.id]);
    authResponse(response, { ...user, last_login_at: new Date().toISOString() });
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/auth/google", async (request, response) => {
  try {
    const { credential } = googleSchema.parse(request.body);
    const profile = await verifyGoogleCredential(credential);
    let user = await pool.query<UserRow>(
      `SELECT id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at FROM users WHERE google_subject = $1 OR LOWER(email) = LOWER($2)`,
      [profile.sub, profile.email],
    ).then((result) => result.rows[0] ?? null);
    if (user && user.status !== "active") throw new HttpError(403, "Tai khoan da bi khoa");
    if (!user) {
      const created = await pool.query<UserRow>(
        `INSERT INTO users (email, full_name, role, status, google_subject) VALUES ($1, $2, 'customer', 'active', $3) RETURNING id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at`,
        [profile.email!.toLowerCase(), profile.name ?? profile.email!.split("@")[0], profile.sub],
      );
      user = created.rows[0];
    } else if (!user.google_subject) {
      const linked = await pool.query<UserRow>(
        `UPDATE users SET google_subject = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at`,
        [profile.sub, user.id],
      );
      user = linked.rows[0];
    }
    await pool.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [user.id]);
    authResponse(response, user);
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/auth/me", async (request, response) => {
  try {
    const user = requireRole(request, response, ["customer", "manager", "admin"]);
    if (!user) return;
    const result = await pool.query<UserRow>(`SELECT id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at FROM users WHERE id = $1`, [user.id]);
    if (!result.rows[0] || result.rows[0].status !== "active") throw new HttpError(401, "Phien dang nhap khong con hieu luc");
    response.json({ user: toAuthUser(result.rows[0]) });
  } catch (error) {
    sendError(response, error);
  }
});

app.patch("/api/auth/me", async (request, response) => {
  try {
    const user = requireRole(request, response, ["customer", "manager", "admin"]);
    if (!user) return;
    const data = profilePatchSchema.parse(request.body);
    const result = await pool.query<UserRow>(`UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, password_hash, full_name, role, status, google_subject, created_at, last_login_at`, [data.full_name, user.id]);
    response.json({ user: toAuthUser(result.rows[0]) });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/products", async (_request, response) => {
  try {
    const result = await pool.query<ProductRow>(`SELECT ${productProjection} FROM products WHERE status = 'published' AND is_deleted = FALSE ORDER BY created_at DESC, id DESC`);
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/products/:id", async (request, response) => {
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const result = await pool.query<ProductRow>(
      `SELECT ${productProjection} FROM products WHERE id = $1 AND status = 'published' AND is_deleted = FALSE`,
      [id],
    );
    if (!result.rows[0]) throw new HttpError(404, "Khong tim thay san pham");
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

// products.category luu ten danh muc; chi nhan ten da co trong bang categories.
async function resolveCategory(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const result = await pool.query<{ name: string }>("SELECT name FROM categories WHERE LOWER(name) = LOWER($1)", [trimmed]);
  if (!result.rows[0]) throw new HttpError(400, "Danh muc khong ton tai, vui long tao danh muc truoc");
  return result.rows[0].name;
}

async function createProduct(request: Request, response: Response) {
  try {
    const data = productCreateSchema.parse(request.body);
    const category = await resolveCategory(data.category);
    const result = await pool.query<ProductRow>(
      `INSERT INTO products (sku, name, description, category, image_url, fixed_meters, unit_label, price, stock_quantity, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${productProjection}`,
      [data.sku, data.name, data.description ?? null, category, data.image_url || null, data.fixed_meters, data.unit_label, data.price, data.stock_quantity, data.status],
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
}

app.post("/api/products", (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  void createProduct(request, response);
});

app.get("/api/manager/products", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const result = await pool.query<ProductRow>(`SELECT ${productProjection} FROM products WHERE is_deleted = FALSE ORDER BY updated_at DESC`);
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/manager/uploads/product-image", (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  if (!cloudinaryReady()) {
    response.status(503).json({ message: "Cloudinary chua duoc cau hinh o backend" });
    return;
  }
  productImageUpload.single("image")(request, response, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        response.status(400).json({ message: "Anh khong duoc vuot qua 4 MB" });
        return;
      }
      sendError(response, error);
      return;
    }
    if (!request.file) {
      response.status(400).json({ message: "Vui long chon anh san pham" });
      return;
    }
    void uploadProductImage(request.file)
      .then((url) => response.status(201).json({ url }))
      .catch((uploadError) => sendError(response, uploadError));
  });
});

app.post("/api/manager/products", (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  void createProduct(request, response);
});

app.patch("/api/manager/products/:id", async (request, response) => {
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const data = productPatchSchema.parse(request.body);
    if (data.category !== undefined) data.category = await resolveCategory(data.category);
    if (data.image_url === "") data.image_url = null;
    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    if (entries.length === 0) throw new HttpError(400, "Khong co du lieu cap nhat");
    const allowed = new Set(["sku", "name", "description", "category", "image_url", "fixed_meters", "unit_label", "price", "stock_quantity", "status"]);
    const safeEntries = entries.filter(([key]) => allowed.has(key));
    const sets = safeEntries.map(([key], index) => `${key} = $${index + 1}`);
    const values: unknown[] = safeEntries.map(([, value]) => value);
    values.push(id);
    const result = await pool.query<ProductRow>(`UPDATE products SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length} AND is_deleted = FALSE RETURNING ${productProjection}`, values);
    if (!result.rows[0]) throw new HttpError(404, "Khong tim thay san pham");
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.delete("/api/manager/products/:id", async (request, response) => {
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const result = await pool.query<{ id: number }>(
      `UPDATE products
       SET is_deleted = TRUE, status = 'archived', updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
      [id],
    );
    if (!result.rows[0]) throw new HttpError(404, "Khong tim thay san pham");
    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
});

const categoryProjection = `c.id, c.name, c.description, ${utc("c.created_at")} AS created_at,
  (SELECT COUNT(*)::int FROM products p WHERE p.is_deleted = FALSE AND LOWER(p.category) = LOWER(c.name)) AS product_count`;

app.get("/api/manager/categories", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const result = await pool.query(`SELECT ${categoryProjection} FROM categories c ORDER BY c.name`);
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/manager/categories", async (request, response) => {
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const data = categorySchema.parse(request.body);
    const result = await pool.query<{ id: number }>("INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id", [data.name, data.description || null]);
    const created = await pool.query(`SELECT ${categoryProjection} FROM categories c WHERE c.id = $1`, [result.rows[0].id]);
    response.status(201).json(created.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.patch("/api/manager/categories/:id", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  const client = await pool.connect();
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const data = categorySchema.parse(request.body);
    await client.query("BEGIN");
    const current = await client.query<{ name: string }>("SELECT name FROM categories WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rows[0]) throw new HttpError(404, "Khong tim thay danh muc");
    await client.query("UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3", [data.name, data.description || null, id]);
    // Doi ten danh muc thi doi luon tren cac san pham dang dung ten cu.
    if (current.rows[0].name !== data.name) await client.query("UPDATE products SET category = $1, updated_at = NOW() WHERE LOWER(category) = LOWER($2)", [data.name, current.rows[0].name]);
    await client.query("COMMIT");
    const updated = await pool.query(`SELECT ${categoryProjection} FROM categories c WHERE c.id = $1`, [id]);
    response.json(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

app.delete("/api/manager/categories/:id", async (request, response) => {
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const current = await pool.query<{ product_count: number }>(`SELECT ${categoryProjection} FROM categories c WHERE c.id = $1`, [id]);
    if (!current.rows[0]) throw new HttpError(404, "Khong tim thay danh muc");
    if (current.rows[0].product_count > 0) throw new HttpError(409, `Danh muc dang co ${current.rows[0].product_count} san pham, hay chuyen san pham sang danh muc khac truoc khi xoa`);
    // San pham da xoa mem khong con hien o dau, nen bo ten danh muc khoi chung.
    await pool.query("UPDATE products SET category = NULL WHERE is_deleted = TRUE AND LOWER(category) = (SELECT LOWER(name) FROM categories WHERE id = $1)", [id]);
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    response.status(204).send();
  } catch (error) {
    sendError(response, error);
  }
});

const orderProjection = `id, order_code, customer_id, customer_name, customer_email, recipient_name, recipient_phone, note, shipping_address, payment_method, payment_status, status, total_amount::text, total_meters::text,
  ${utc("created_at")} AS created_at,
  CASE WHEN status = 'pending' THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (created_at + INTERVAL '${CANCEL_WINDOW_MINUTES} minutes' - LOCALTIMESTAMP))))::int ELSE 0 END AS cancel_seconds_left`;

type OrderActor = { id: number | null; name: string; role: string };

async function addOrderHistory(client: PoolClient, orderId: number, fromStatus: string | null, toStatus: string, actor: OrderActor, note?: string | null) {
  await client.query(
    "INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, actor_name, actor_role, note) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [orderId, fromStatus, toStatus, actor.id, actor.name, actor.role, note || null],
  );
}

// Huy don thi tra lai dung so luong da tru khi dat.
async function restoreOrderStock(client: PoolClient, orderId: number) {
  await client.query(
    `UPDATE products p SET stock_quantity = p.stock_quantity + i.quantity, updated_at = NOW()
     FROM (SELECT product_id, SUM(quantity)::int AS quantity FROM order_items WHERE order_id = $1 GROUP BY product_id) i
     WHERE p.id = i.product_id`,
    [orderId],
  );
}

async function loadOrders(where = "", values: unknown[] = []) {
  const result = await pool.query<Omit<OrderRead, "items" | "history">>(`SELECT ${orderProjection} FROM orders ${where} ORDER BY created_at DESC, id DESC`, values);
  const ids = result.rows.map((row) => row.id);
  if (ids.length === 0) return [];
  const [itemResult, historyResult] = await Promise.all([
    pool.query<OrderRead["items"][number] & { order_id: number }>(`SELECT order_id, product_id, product_name_snapshot AS product_name, fixed_meters_snapshot::text AS fixed_meters, quantity, total_meters::text, line_total::text FROM order_items WHERE order_id = ANY($1) ORDER BY id`, [ids]),
    pool.query<OrderRead["history"][number] & { order_id: number }>(`SELECT id, order_id, from_status, to_status, actor_name, actor_role, note, ${utc("created_at")} AS created_at FROM order_status_history WHERE order_id = ANY($1) ORDER BY id`, [ids]),
  ]);
  return result.rows.map((row): OrderRead => ({
    ...row,
    items: itemResult.rows.filter((item) => item.order_id === row.id).map(({ order_id: _orderId, ...item }) => item),
    history: historyResult.rows.filter((entry) => entry.order_id === row.id).map(({ order_id: _orderId, ...entry }) => entry),
  }));
}

async function loadOrder(id: number) {
  return (await loadOrders("WHERE id = $1", [id]))[0];
}

app.post("/api/orders", async (request, response) => {
  const client = await pool.connect();
  try {
    const data = orderCreateSchema.parse(request.body);
    const customer = optionalCustomer(request);
    const customerName = data.customer_name ?? customer?.full_name;
    const customerEmail = data.customer_email ?? customer?.email;
    if (!customerName || !customerEmail) throw new HttpError(400, "Can bo sung thong tin khach hang");
    const quantities = new Map<number, number>();
    for (const item of data.items) quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + item.quantity);
    await client.query("BEGIN");
    const lockedProducts: Array<ProductRow & { quantity: number }> = [];
    let totalAmount = 0;
    let totalMeters = 0;
    for (const [productId, quantity] of quantities) {
      const result = await client.query<ProductRow>(`SELECT ${productProjection} FROM products WHERE id = $1 AND is_deleted = FALSE FOR UPDATE`, [productId]);
      const product = result.rows[0];
      if (!product || product.status !== "published") throw new HttpError(404, "San pham khong con ban");
      if (product.stock_quantity < quantity) throw new HttpError(409, `San pham ${product.name} khong du ton kho`);
      lockedProducts.push({ ...product, quantity });
      totalAmount += Number(product.price) * quantity;
      totalMeters += Number(product.fixed_meters) * quantity;
    }
    const orderCode = `NCP-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const orderResult = await client.query<{ id: number }>(
      `INSERT INTO orders (order_code, customer_id, customer_name, customer_email, recipient_name, recipient_phone, note, shipping_address, payment_method, payment_status, status, total_amount, total_meters, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending','pending',$10,$11,NOW()) RETURNING id`,
      [orderCode, customer?.id ?? null, customerName, customerEmail, data.recipient_name, data.recipient_phone, data.note || null, data.shipping_address, data.payment_method, totalAmount, totalMeters],
    );
    const orderId = orderResult.rows[0].id;
    for (const product of lockedProducts) {
      const lineTotal = Number(product.price) * product.quantity;
      const itemMeters = Number(product.fixed_meters) * product.quantity;
      await client.query("UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2", [product.quantity, product.id]);
      await client.query(`INSERT INTO order_items (order_id, product_id, product_name_snapshot, fixed_meters_snapshot, unit_price_snapshot, quantity, total_meters, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [orderId, product.id, product.name, product.fixed_meters, product.price, product.quantity, itemMeters, lineTotal]);
    }
    await addOrderHistory(client, orderId, null, "pending", { id: customer?.id ?? null, name: customerName, role: "customer" });
    await client.query("COMMIT");
    const order = await loadOrder(orderId);
    const emailSent = await sendOrderConfirmation(order);
    response.status(201).json({ ...order, email_sent: emailSent });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

app.get("/api/customer/orders", async (request, response) => {
  const user = requireRole(request, response, ["customer"]);
  if (!user) return;
  try {
    response.json(await loadOrders("WHERE customer_id = $1", [user.id]));
  } catch (error) {
    sendError(response, error);
  }
});

// Khach chi tu huy duoc khi don con cho xac nhan va chua qua CANCEL_WINDOW_MINUTES phut ke tu luc dat.
app.post("/api/customer/orders/:id/cancel", async (request, response) => {
  const user = requireRole(request, response, ["customer"]);
  if (!user) return;
  const client = await pool.connect();
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    await client.query("BEGIN");
    const current = await client.query<{ status: string; in_window: boolean }>(
      `SELECT status, (created_at + INTERVAL '${CANCEL_WINDOW_MINUTES} minutes' > LOCALTIMESTAMP) AS in_window FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
      [id, user.id],
    );
    if (!current.rows[0]) throw new HttpError(404, "Khong tim thay don hang");
    if (current.rows[0].status === "cancelled") throw new HttpError(409, "Don hang da duoc huy truoc do");
    if (current.rows[0].status !== "pending") throw new HttpError(409, "Don hang da duoc cua hang xac nhan nen khong the huy. Vui long lien he cua hang de duoc ho tro");
    if (!current.rows[0].in_window) throw new HttpError(409, `Da qua ${CANCEL_WINDOW_MINUTES} phut ke tu luc dat nen khong the tu huy. Vui long lien he cua hang de duoc ho tro`);
    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id]);
    await restoreOrderStock(client, id);
    await addOrderHistory(client, id, "pending", "cancelled", { id: user.id, name: user.full_name, role: "customer" }, "Khách hàng tự hủy đơn");
    await client.query("COMMIT");
    response.json(await loadOrder(id));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

app.get("/api/manager/orders", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    response.json(await loadOrders());
  } catch (error) {
    sendError(response, error);
  }
});

app.patch("/api/manager/orders/:id/status", async (request, response) => {
  const user = requireRole(request, response, ["manager", "admin"]);
  if (!user) return;
  const client = await pool.connect();
  try {
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const { status, note } = statusSchema.parse(request.body);
    await client.query("BEGIN");
    const current = await client.query<{ status: string }>("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rows[0]) throw new HttpError(404, "Khong tim thay don hang");
    const previous = current.rows[0].status;
    if (status !== previous) {
      if (!allowedTransitions[previous]?.includes(status)) throw new HttpError(409, "Khong the chuyen trang thai don hang");
      await client.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
      if (status === "cancelled") await restoreOrderStock(client, id);
      await addOrderHistory(client, id, previous, status, { id: user.id, name: user.full_name, role: user.role }, note);
    }
    await client.query("COMMIT");
    response.json(await loadOrder(id));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

const reportDaysSchema = z.coerce.number().int().refine((value) => [7, 30, 90].includes(value)).catch(30);

app.get("/api/manager/reports", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const days = reportDaysSchema.parse(request.query.days);
    // Gom theo ngay cua Viet Nam, khong theo ngay UTC cua may chu.
    const today = "(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
    const orderDay = `((${utc("o.created_at")}) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;
    const inRange = `${orderDay} > ${today} - $1::int`;
    const [daily, summary, byStatus, byPayment, topProducts] = await Promise.all([
      pool.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'cancelled'), 0)::float AS revenue,
                COUNT(o.id) FILTER (WHERE o.status <> 'cancelled')::int AS orders
         FROM generate_series(${today} - ($1::int - 1), ${today}, INTERVAL '1 day') AS d(day)
         LEFT JOIN orders o ON ${orderDay} = d.day::date
         GROUP BY d.day ORDER BY d.day`,
        [days],
      ),
      pool.query(
        `SELECT COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'cancelled'), 0)::float AS revenue,
                COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'completed'), 0)::float AS completed_revenue,
                COUNT(*) FILTER (WHERE o.status <> 'cancelled')::int AS orders,
                COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled,
                COALESCE(SUM(o.total_meters) FILTER (WHERE o.status <> 'cancelled'), 0)::float AS meters
         FROM orders o WHERE ${inRange}`,
        [days],
      ),
      pool.query(`SELECT o.status, COUNT(*)::int AS orders FROM orders o WHERE ${inRange} GROUP BY o.status`, [days]),
      pool.query(`SELECT o.payment_method, COUNT(*)::int AS orders, COALESCE(SUM(o.total_amount), 0)::float AS revenue FROM orders o WHERE ${inRange} AND o.status <> 'cancelled' GROUP BY o.payment_method ORDER BY revenue DESC`, [days]),
      pool.query(
        `SELECT i.product_name_snapshot AS product_name, SUM(i.quantity)::int AS quantity, SUM(i.total_meters)::float AS meters, SUM(i.line_total)::float AS revenue
         FROM order_items i JOIN orders o ON o.id = i.order_id
         WHERE ${inRange} AND o.status <> 'cancelled'
         GROUP BY i.product_name_snapshot ORDER BY revenue DESC, product_name LIMIT 5`,
        [days],
      ),
    ]);
    response.json({ days, summary: summary.rows[0], daily: daily.rows, by_status: byStatus.rows, by_payment: byPayment.rows, top_products: topProducts.rows });
  } catch (error) {
    sendError(response, error);
  }
});

const passwordSchema = z.string().min(8).max(120);
const changePasswordSchema = z.object({ current_password: z.string().max(120).optional(), new_password: passwordSchema });
const forgotPasswordSchema = z.object({ email: z.string().trim().email() });
const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), new_password: passwordSchema });
const RESET_TOKEN_MINUTES = 30;
const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

app.post("/api/auth/password", async (request, response) => {
  try {
    const user = requireRole(request, response, ["customer", "manager", "admin"]);
    if (!user) return;
    const data = changePasswordSchema.parse(request.body);
    const current = await pool.query<{ password_hash: string | null }>("SELECT password_hash FROM users WHERE id = $1 AND status = 'active'", [user.id]);
    if (!current.rows[0]) throw new HttpError(401, "Phien dang nhap khong con hieu luc");
    // Tai khoan chi dang nhap bang Google chua co mat khau nen khong can mat khau hien tai.
    if (current.rows[0].password_hash && !verifyPassword(data.current_password ?? "", current.rows[0].password_hash)) throw new HttpError(400, "Mat khau hien tai khong dung");
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hashPassword(data.new_password), user.id]);
    response.json({ status: "updated" });
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/auth/forgot-password", async (request, response) => {
  try {
    const { email } = forgotPasswordSchema.parse(request.body);
    if (!mailerReady() && config.isProduction) throw new HttpError(503, "Chuc nang gui email chua duoc cau hinh. Vui long lien he cua hang de dat lai mat khau");
    const user = await findUserByEmail(email);
    if (user && user.status === "active") {
      const token = crypto.randomBytes(32).toString("base64url");
      await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [user.id]);
      await pool.query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '${RESET_TOKEN_MINUTES} minutes')`, [user.id, hashResetToken(token)]);
      const link = `${config.frontendOrigins[0]}/#/reset-password?token=${token}`;
      const sent = await sendPasswordReset(user.email, user.full_name, link);
      // Chay local chua co email: in lien ket ra console de thu duoc luong dat lai mat khau.
      if (!sent && !config.isProduction) console.log(`[reset-password] ${user.email} -> ${link}`);
    }
    // Luon tra loi giong nhau de khong lo email nao da dang ky.
    response.json({ status: "sent" });
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/auth/reset-password", async (request, response) => {
  const client = await pool.connect();
  try {
    const data = resetPasswordSchema.parse(request.body);
    await client.query("BEGIN");
    const found = await client.query<{ id: number; user_id: number }>("SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE", [hashResetToken(data.token)]);
    if (!found.rows[0]) throw new HttpError(400, "Lien ket dat lai mat khau khong hop le hoac da het han");
    await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hashPassword(data.new_password), found.rows[0].user_id]);
    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [found.rows[0].user_id]);
    await client.query("COMMIT");
    response.json({ status: "updated" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

// Chat: moi khach hang co mot cuoc tro chuyen voi cua hang; ca hai phia doc tin moi bang cach hoi lai dinh ky.
const chatBodySchema = z.object({ body: z.string().trim().min(1).max(2000) });
const chatProjection = `id, sender_role, sender_name, body, ${utc("created_at")} AS created_at`;

async function loadChat(customerId: number, readerRole: "customer" | "staff") {
  // Nguoi doc mo cuoc tro chuyen thi tin cua phia ben kia duoc danh dau da doc.
  await pool.query("UPDATE chat_messages SET read_at = NOW() WHERE customer_id = $1 AND sender_role <> $2 AND read_at IS NULL", [customerId, readerRole]);
  const result = await pool.query(`SELECT ${chatProjection} FROM chat_messages WHERE customer_id = $1 ORDER BY id`, [customerId]);
  return result.rows;
}

app.get("/api/customer/chat", async (request, response) => {
  const user = requireRole(request, response, ["customer"]);
  if (!user) return;
  try {
    response.json(await loadChat(user.id, "customer"));
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/customer/chat/unread", async (request, response) => {
  const user = requireRole(request, response, ["customer"]);
  if (!user) return;
  try {
    const result = await pool.query<{ unread: number }>("SELECT COUNT(*)::int AS unread FROM chat_messages WHERE customer_id = $1 AND sender_role = 'staff' AND read_at IS NULL", [user.id]);
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/customer/chat", async (request, response) => {
  try {
    const user = requireRole(request, response, ["customer"]);
    if (!user) return;
    const { body } = chatBodySchema.parse(request.body);
    await pool.query("INSERT INTO chat_messages (customer_id, sender_id, sender_role, sender_name, body) VALUES ($1, $2, 'customer', $3, $4)", [user.id, user.id, user.full_name, body]);
    response.status(201).json(await loadChat(user.id, "customer"));
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/manager/chats", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const result = await pool.query(
      `SELECT u.id AS customer_id, u.full_name AS customer_name, u.email AS customer_email,
              last.body AS last_body, last.sender_role AS last_sender_role, ${utc("last.created_at")} AS last_at,
              (SELECT COUNT(*)::int FROM chat_messages m WHERE m.customer_id = u.id AND m.sender_role = 'customer' AND m.read_at IS NULL) AS unread
       FROM users u
       JOIN LATERAL (SELECT body, sender_role, created_at, id FROM chat_messages m WHERE m.customer_id = u.id ORDER BY m.id DESC LIMIT 1) last ON TRUE
       ORDER BY last.id DESC`,
    );
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/manager/chats/:customerId", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const customerId = z.coerce.number().int().positive().parse(request.params.customerId);
    response.json(await loadChat(customerId, "staff"));
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/manager/chats/:customerId", async (request, response) => {
  try {
    const user = requireRole(request, response, ["manager", "admin"]);
    if (!user) return;
    const customerId = z.coerce.number().int().positive().parse(request.params.customerId);
    const { body } = chatBodySchema.parse(request.body);
    const customer = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'customer'", [customerId]);
    if (!customer.rows[0]) throw new HttpError(404, "Khong tim thay khach hang");
    await pool.query("INSERT INTO chat_messages (customer_id, sender_id, sender_role, sender_name, body) VALUES ($1, $2, 'staff', $3, $4)", [customerId, user.id, user.full_name, body]);
    response.status(201).json(await loadChat(customerId, "staff"));
  } catch (error) {
    sendError(response, error);
  }
});

// So viec dang cho xu ly, de khu quan ly hoi lai dinh ky va bao cho nguoi dung.
app.get("/api/manager/notifications", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const result = await pool.query(
      `SELECT (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
              (SELECT COUNT(*)::int FROM chat_messages WHERE sender_role = 'customer' AND read_at IS NULL) AS unread_chats,
              (SELECT COUNT(*)::int FROM contact_messages WHERE status = 'new') AS new_messages`,
    );
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.post("/api/contact", async (request, response) => {
  try {
    const data = contactSchema.parse(request.body);
    await pool.query("INSERT INTO contact_messages (name, email, topic, message) VALUES ($1, $2, $3, $4)", [data.name, data.email.toLowerCase(), data.topic, data.message]);
    response.status(201).json({ status: "received" });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/manager/contact-messages", async (request, response) => {
  if (!requireRole(request, response, ["manager", "admin"])) return;
  try {
    const result = await pool.query(`SELECT ${contactProjection} FROM contact_messages ORDER BY created_at DESC, id DESC`);
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.patch("/api/manager/contact-messages/:id", async (request, response) => {
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const { status } = contactStatusSchema.parse(request.body);
    const result = await pool.query(`UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING ${contactProjection}`, [status, id]);
    if (!result.rows[0]) throw new HttpError(404, "Khong tim thay loi nhan");
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/admin/users", async (request, response) => {
  if (!requireRole(request, response, ["admin"])) return;
  try {
    const result = await pool.query(`SELECT id, email, full_name, role, status, ${utc("created_at")} AS created_at, ${utc("last_login_at")} AS last_login_at FROM users ORDER BY users.created_at DESC`);
    response.json(result.rows);
  } catch (error) {
    sendError(response, error);
  }
});

app.patch("/api/admin/users/:id/role", async (request, response) => {
  try {
    if (!requireRole(request, response, ["admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const { role } = roleSchema.parse(request.body);
    const result = await pool.query(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, full_name, role, status`, [role, id]);
    if (!result.rows[0]) throw new HttpError(404, "Khong tim thay nguoi dung");
    response.json(result.rows[0]);
  } catch (error) {
    sendError(response, error);
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => sendError(response, error));

// Vercel dung default export nay lam function; chay local qua src/server.ts.
export default app;
