import { initializeDatabase, pool } from "./db.js";
import { hashPassword } from "./auth.js";

async function seed() {
  await initializeDatabase();
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, 'manager', 'active')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'manager', status = 'active'`,
    ["quanly@ngoccamphuong.local", hashPassword("NgocCam@123"), "Quản lý Ngọc Cẩm Phường"],
  );
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, status)
     VALUES ($1, $2, $3, 'admin', 'active')
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = 'admin', status = 'active'`,
    ["admin@ngoccamphuong.local", hashPassword("NgocAdmin@123"), "Quản trị viên Ngọc Cẩm Phường"],
  );
  console.log("Seeded local manager and admin accounts");
  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (existing.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO products
        (sku, name, description, category, fixed_meters, unit_label, price, stock_quantity, status)
       VALUES
        ('NCP-COTTON-XANH-2M', 'Vai cotton xanh', 'Vai cotton mem, phu hop may mac hang ngay.', 'Cotton', 2.00, 'goi 2 met', 120000, 20, 'published'),
        ('NCP-LUA-DO-5M', 'Vai lua do', 'Vai lua do dung cho ao dai va trang phuc le.', 'Lua', 5.00, 'goi 5 met', 450000, 8, 'published')`,
    );
    console.log("Seeded sample products");
  } else {
    console.log("Products already exist; seed skipped");
  }
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
