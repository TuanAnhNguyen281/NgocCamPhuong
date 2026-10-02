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

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES users(id);
  `);
}
