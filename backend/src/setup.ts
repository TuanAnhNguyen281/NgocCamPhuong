import { initializeDatabase, pool } from "./db.js";
import { hashPassword } from "./auth.js";

// Khoi tao bang va tai khoan admin dau tien cho database production (Neon).
// Khac voi seed.ts: khong tao tai khoan test hay san pham mau.
async function setup() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || "Quản trị viên";
  if (!email || !password) throw new Error("Can dat ADMIN_EMAIL va ADMIN_PASSWORD truoc khi chay db:setup");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD phai co it nhat 12 ky tu");

  await initializeDatabase();
  console.log("Database schema is ready");
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, 'admin', 'active')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, role = 'admin', status = 'active', updated_at = NOW()`,
    [email, hashPassword(password), fullName],
  );
  console.log(`Admin account ready: ${email}`);
}

setup()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
