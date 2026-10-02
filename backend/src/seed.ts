import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { config } from "./config.js";
import { initializeDatabase, pool } from "./db.js";
import { hashPassword } from "./auth.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// Moi san pham mau co mot anh <sku>.jpg; thu muc nay cung dung de thu upload tren dashboard.
const sampleImages = path.resolve(here, "../../frontend/public/sample-products");

const dbHost = new URL(config.databaseUrl).hostname;
const isLocalDatabase = dbHost === "localhost" || dbHost === "127.0.0.1";

// Mat khau mac dinh chi dung cho PostgreSQL tren may. Voi database tu xa (Neon),
// dat ADMIN_PASSWORD / MANAGER_PASSWORD, neu khong script se tu sinh va in ra mot lan.
const accounts = [
  { role: "manager", email: process.env.MANAGER_EMAIL ?? "quanly@ngoccamphuong.local", password: process.env.MANAGER_PASSWORD, localPassword: "NgocCam@123", fullName: "Quản lý Ngọc Cẩm Phường" },
  { role: "admin", email: process.env.ADMIN_EMAIL ?? "admin@ngoccamphuong.local", password: process.env.ADMIN_PASSWORD, localPassword: "NgocAdmin@123", fullName: "Quản trị viên Ngọc Cẩm Phường" },
];

const products = [
  { sku: "NCP-LINEN-BE-2M", name: "Linen tự nhiên màu be", category: "Linen", fixedMeters: 2, unitLabel: "gói 2 mét", price: 240000, stock: 24, description: "Linen dệt thưa vừa phải, mặt vải mộc và thoáng. Hợp may áo sơ mi, váy suông và khăn trải bàn." },
  { sku: "NCP-COTTON-XAM-3M", name: "Cotton thô xám khói", category: "Cotton", fixedMeters: 3, unitLabel: "gói 3 mét", price: 285000, stock: 18, description: "Cotton thô sợi to, đứng dáng, càng giặt càng mềm. Dùng cho tạp dề, túi vải và rèm cửa." },
  { sku: "NCP-LINEN-CHAM-2M", name: "Linen xanh chàm", category: "Linen", fixedMeters: 2, unitLabel: "gói 2 mét", price: 260000, stock: 15, description: "Linen nhuộm xanh chàm đậm, bề mặt có vân sợi tự nhiên. Hợp may áo khoác nhẹ và quần ống rộng." },
  { sku: "NCP-KAKI-THAN-3M", name: "Kaki xám than", category: "Kaki", fixedMeters: 3, unitLabel: "gói 3 mét", price: 330000, stock: 10, description: "Kaki dày vừa, ít nhăn, giữ phom tốt. Dùng cho quần, chân váy và bọc đệm ghế." },
  { sku: "NCP-LINEN-MIX-5M", name: "Linen pha cotton bốn tông", category: "Linen pha", fixedMeters: 5, unitLabel: "cuộn 5 mét", price: 620000, stock: 4, description: "Cuộn 5 mét linen pha cotton, mềm hơn linen thuần và ít nhăn hơn. Có đủ cho một bộ rèm nhỏ hoặc hai chiếc váy." },
];

async function seedAccounts() {
  for (const account of accounts) {
    const email = account.email.trim().toLowerCase();
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
    const password = account.password ?? (isLocalDatabase ? account.localPassword : existing.rows[0] ? null : randomBytes(12).toString("base64url"));
    if (!password) {
      await pool.query("UPDATE users SET role = $1, status = 'active', updated_at = NOW() WHERE id = $2", [account.role, existing.rows[0].id]);
      console.log(`${account.role}: ${email} da ton tai, giu nguyen mat khau`);
      continue;
    }
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = EXCLUDED.role, status = 'active', updated_at = NOW()`,
      [email, hashPassword(password), account.fullName, account.role],
    );
    console.log(`${account.role}: ${email} / ${account.password ? "(mat khau tu bien moi truong)" : password}`);
  }
}

async function uploadSeedImages(needed: typeof products) {
  const urls = new Map<string, string>();
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    console.warn("Cloudinary chua duoc cau hinh: san pham mau se khong co anh");
    return urls;
  }
  cloudinary.config({ cloud_name: config.cloudinaryCloudName, api_key: config.cloudinaryApiKey, api_secret: config.cloudinaryApiSecret });
  for (const product of needed) {
    const name = product.sku.toLowerCase();
    const result = await cloudinary.uploader.upload(path.join(sampleImages, `${name}.jpg`), { folder: config.cloudinaryFolder, public_id: `seed-${name}`, overwrite: true, resource_type: "image" });
    urls.set(product.sku, result.secure_url);
  }
  return urls;
}

async function seedProducts() {
  const existing = await pool.query<{ sku: string }>("SELECT sku FROM products WHERE sku = ANY($1)", [products.map((product) => product.sku)]);
  const existingSkus = new Set(existing.rows.map((row) => row.sku));
  const missing = products.filter((product) => !existingSkus.has(product.sku));
  if (missing.length === 0) {
    console.log("San pham mau da co san; bo qua");
    return;
  }
  const urls = await uploadSeedImages(missing);
  for (const product of missing) {
    await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (LOWER(name)) DO NOTHING", [product.category]);
    await pool.query(
      `INSERT INTO products (sku, name, description, category, image_url, fixed_meters, unit_label, price, stock_quantity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published')`,
      [product.sku, product.name, product.description, product.category, urls.get(product.sku) ?? null, product.fixedMeters, product.unitLabel, product.price, product.stock],
    );
  }
  console.log(`Da them ${missing.length} san pham mau`);
}

async function seed() {
  console.log(`Database: ${dbHost}`);
  await initializeDatabase();
  await seedAccounts();
  await seedProducts();
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
