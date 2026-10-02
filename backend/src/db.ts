import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      image_url VARCHAR(500),
      fixed_meters NUMERIC(10, 2) NOT NULL CHECK (fixed_meters > 0),
      unit_label VARCHAR(40) NOT NULL DEFAULT 'don vi',
      price NUMERIC(14, 2) NOT NULL CHECK (price >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(200) NOT NULL UNIQUE,
      password_hash TEXT,
      full_name VARCHAR(160) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'manager', 'admin')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
      google_subject VARCHAR(255) UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_code VARCHAR(40) NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES users(id),
      customer_name VARCHAR(160) NOT NULL,
      customer_email VARCHAR(200) NOT NULL,
      shipping_address VARCHAR(500) NOT NULL,
      payment_method VARCHAR(30) NOT NULL DEFAULT 'cod',
      payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      total_amount NUMERIC(14, 2) NOT NULL,
      total_meters NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name_snapshot VARCHAR(200) NOT NULL,
      fixed_meters_snapshot NUMERIC(10, 2) NOT NULL,
      unit_price_snapshot NUMERIC(14, 2) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total_meters NUMERIC(12, 2) NOT NULL,
      line_total NUMERIC(14, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      email VARCHAR(200) NOT NULL,
      topic VARCHAR(60) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key ON categories (LOWER(name));

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES users(id);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(160);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS note VARCHAR(500);

    CREATE TABLE IF NOT EXISTS order_status_history (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      from_status VARCHAR(30),
      to_status VARCHAR(30) NOT NULL,
      actor_id INTEGER REFERENCES users(id),
      actor_name VARCHAR(160) NOT NULL,
      actor_role VARCHAR(20) NOT NULL,
      note VARCHAR(500),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history (order_id, id);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('customer', 'staff')),
      sender_name VARCHAR(160) NOT NULL,
      body TEXT NOT NULL,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS chat_messages_customer_idx ON chat_messages (customer_id, id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Don tao truoc khi co bang lich su: ghi lai moc "dat hang" de dong thoi gian khong bi trong.
    INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, actor_name, actor_role, created_at)
    SELECT o.id, NULL, 'pending', o.customer_id, o.customer_name, 'customer', o.created_at FROM orders o
    WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id);

    -- products.category luu ten danh muc; dua cac ten dang dung vao bang categories.
    INSERT INTO categories (name)
    SELECT DISTINCT ON (LOWER(TRIM(category))) TRIM(category) FROM products
    WHERE category IS NOT NULL AND TRIM(category) <> ''
    ON CONFLICT (LOWER(name)) DO NOTHING;
  `);
}
