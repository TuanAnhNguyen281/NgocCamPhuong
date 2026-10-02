import cors from "cors";
import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { config } from "./config.js";
import { pool } from "./db.js";
import { hashPassword, signToken, verifyPassword, verifyToken, type AuthUser, type UserRole } from "./auth.js";
import type { OrderRead, ProductRow, UserRow } from "./types.js";

const app = express();
const allowedOrigins = new Set(config.isProduction ? config.frontendOrigins : [...config.frontendOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin)) callback(null, true);
  else callback(new Error("Origin not allowed by CORS"));
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
  shipping_address: z.string().min(5).max(500),
  payment_method: z.string().default("cod"),
  items: z.array(z.object({ product_id: z.number().int().positive(), quantity: z.number().int().positive() })).min(1),
});
const statusSchema = z.object({ status: z.enum(["pending", "confirmed", "preparing", "shipping", "completed", "cancelled"]) });
const roleSchema = z.object({ role: z.enum(["customer", "manager", "admin"]) });
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

app.get("/api/products", async (request, response) => {
  try {
    const status = typeof request.query.status === "string" ? request.query.status : "published";
    const result = await pool.query<ProductRow>(`SELECT ${productProjection} FROM products WHERE status = $1 AND is_deleted = FALSE ORDER BY created_at DESC`, [status]);
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

async function createProduct(request: Request, response: Response) {
  try {
    const data = productCreateSchema.parse(request.body);
    const result = await pool.query<ProductRow>(
      `INSERT INTO products (sku, name, description, category, image_url, fixed_meters, unit_label, price, stock_quantity, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${productProjection}`,
      [data.sku, data.name, data.description ?? null, data.category ?? null, data.image_url ?? null, data.fixed_meters, data.unit_label, data.price, data.stock_quantity, data.status],
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
    const orderResult = await client.query<{ id: number }>(`INSERT INTO orders (order_code, customer_id, customer_name, customer_email, shipping_address, payment_method, payment_status, status, total_amount, total_meters, created_at) VALUES ($1,$2,$3,$4,$5,$6,'pending','pending',$7,$8,NOW()) RETURNING id`, [orderCode, customer?.id ?? null, customerName, customerEmail, data.shipping_address, data.payment_method, totalAmount, totalMeters]);
    const orderId = orderResult.rows[0].id;
    const items: OrderRead["items"] = [];
    for (const product of lockedProducts) {
      const lineTotal = Number(product.price) * product.quantity;
      const itemMeters = Number(product.fixed_meters) * product.quantity;
      await client.query("UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2", [product.quantity, product.id]);
      await client.query(`INSERT INTO order_items (order_id, product_id, product_name_snapshot, fixed_meters_snapshot, unit_price_snapshot, quantity, total_meters, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [orderId, product.id, product.name, product.fixed_meters, product.price, product.quantity, itemMeters, lineTotal]);
      items.push({ product_id: product.id, product_name: product.name, fixed_meters: product.fixed_meters, quantity: product.quantity, total_meters: itemMeters.toFixed(2), line_total: lineTotal.toFixed(2) });
    }
    await client.query("COMMIT");
    response.status(201).json({ id: orderId, order_code: orderCode, customer_id: customer?.id ?? null, customer_name: customerName, customer_email: customerEmail, shipping_address: data.shipping_address, payment_method: data.payment_method, payment_status: "pending", status: "pending", total_amount: totalAmount.toFixed(2), total_meters: totalMeters.toFixed(2), items } satisfies OrderRead);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    sendError(response, error);
  } finally {
    client.release();
  }
});

async function loadOrders(where = "", values: unknown[] = []) {
  const result = await pool.query<OrderRead>(`SELECT id, order_code, customer_id, customer_name, customer_email, shipping_address, payment_method, payment_status, status, total_amount::text, total_meters::text FROM orders ${where} ORDER BY created_at DESC`, values);
  const orders: OrderRead[] = [];
  for (const row of result.rows) {
    const itemResult = await pool.query<OrderRead["items"][number]>(`SELECT product_id, product_name_snapshot AS product_name, fixed_meters_snapshot::text AS fixed_meters, quantity, total_meters::text, line_total::text FROM order_items WHERE order_id = $1 ORDER BY id`, [row.id]);
    orders.push({ ...row, items: itemResult.rows });
  }
  return orders;
}

app.get("/api/customer/orders", async (request, response) => {
  const user = requireRole(request, response, ["customer"]);
  if (!user) return;
  try {
    response.json(await loadOrders("WHERE customer_id = $1", [user.id]));
  } catch (error) {
    sendError(response, error);
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
  try {
    if (!requireRole(request, response, ["manager", "admin"])) return;
    const id = z.coerce.number().int().positive().parse(request.params.id);
    const { status } = statusSchema.parse(request.body);
    const current = await pool.query<{ status: string }>("SELECT status FROM orders WHERE id = $1", [id]);
    if (!current.rows[0]) throw new HttpError(404, "Khong tim thay don hang");
    if (status !== current.rows[0].status && !allowedTransitions[current.rows[0].status]?.includes(status)) throw new HttpError(409, "Khong the chuyen trang thai don hang");
    const result = await pool.query<OrderRead>(`UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, order_code, customer_id, customer_name, customer_email, shipping_address, payment_method, payment_status, status, total_amount::text, total_meters::text`, [status, id]);
    const itemResult = await pool.query<OrderRead["items"][number]>(`SELECT product_id, product_name_snapshot AS product_name, fixed_meters_snapshot::text AS fixed_meters, quantity, total_meters::text, line_total::text FROM order_items WHERE order_id = $1 ORDER BY id`, [id]);
    response.json({ ...result.rows[0], items: itemResult.rows });
  } catch (error) {
    sendError(response, error);
  }
});

app.get("/api/admin/users", async (request, response) => {
  if (!requireRole(request, response, ["admin"])) return;
  try {
    const result = await pool.query(`SELECT id, email, full_name, role, status, created_at, last_login_at FROM users ORDER BY created_at DESC`);
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
