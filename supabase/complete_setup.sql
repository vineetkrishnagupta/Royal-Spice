-- ============================================================
-- ROYAL SPICE POS - COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- ============================================================
-- Paste this entire file into Supabase Dashboard -> SQL Editor
-- and click "RUN" once.
--
-- This script sets up:
--   1. Database extensions (uuid-ossp, pgcrypto)
--   2. All 32 tables with constraints, types, and indexes
--   3. Auto-update triggers and business logic functions
--   4. Multi-tenant signup trigger (handle_new_user) and RPC (setup_new_restaurant)
--   5. Complete Row Level Security (RLS) policies
--   6. Supabase Realtime publication
--   7. Initial Demo Seed Data (Royal Spice Restaurant + 27 Products)
-- ============================================================

\n\n-- ============================================================\n-- PART 1: SCHEMA & TABLES\n-- ============================================================\n\n-- ============================================================
-- Royal Spice POS — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- RESTAURANTS & SETTINGS
-- ============================================================

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_main BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restaurant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  -- POS Settings
  invoice_prefix TEXT DEFAULT 'INV',
  order_prefix TEXT DEFAULT 'ORD',
  default_order_type TEXT DEFAULT 'dine_in',
  default_tax_rate NUMERIC(5,2) DEFAULT 5.00,
  default_service_charge NUMERIC(5,2) DEFAULT 0.00,
  enable_round_off BOOLEAN DEFAULT TRUE,
  -- Receipt
  receipt_header TEXT,
  receipt_footer TEXT DEFAULT 'Thank you! Visit again.',
  show_gstin BOOLEAN DEFAULT TRUE,
  -- Printer
  printer_name TEXT,
  receipt_width INTEGER DEFAULT 80,
  -- Notifications
  notify_low_stock BOOLEAN DEFAULT TRUE,
  notify_new_order BOOLEAN DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 10,
  settings_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, branch_id)
);

-- ============================================================
-- USERS & RBAC
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id),
  branch_id UUID REFERENCES branches(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('owner','admin','manager','cashier','waiter','kitchen','delivery')),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FLOORS & TABLES
-- ============================================================

CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  floor_id UUID REFERENCES floors(id),
  number TEXT NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','billing','cleaning')),
  current_order_id UUID,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  shape TEXT DEFAULT 'rectangle' CHECK (shape IN ('rectangle','circle','square')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MENU: CATEGORIES, PRODUCTS, VARIANTS, MODIFIERS
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kitchen_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  printer_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'gst' CHECK (type IN ('gst','service','cess','other')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  kitchen_station_id UUID REFERENCES kitchen_stations(id),
  tax_id UUID REFERENCES taxes(id),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  prep_time INTEGER DEFAULT 15, -- minutes
  sort_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- soft delete
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier NUMERIC(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifier_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_modifiers (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  modifier_id UUID NOT NULL REFERENCES modifiers(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, modifier_id)
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  birthday DATE,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  outstanding_balance NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS & ORDER ITEMS
-- ============================================================

CREATE SEQUENCE order_number_seq START 1001;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  order_number INTEGER DEFAULT NEXTVAL('order_number_seq'),
  type TEXT NOT NULL DEFAULT 'dine_in' CHECK (type IN ('dine_in','takeaway','delivery','online')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('draft','pending','confirmed','preparing','ready','completed','cancelled','refunded')
  ),
  table_id UUID REFERENCES tables(id),
  customer_id UUID REFERENCES customers(id),
  cashier_id UUID REFERENCES profiles(id),
  waiter_id UUID REFERENCES profiles(id),
  -- Financials
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  coupon_code TEXT,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  cgst NUMERIC(10,2) DEFAULT 0,
  sgst NUMERIC(10,2) DEFAULT 0,
  service_charge NUMERIC(10,2) DEFAULT 0,
  round_off NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  -- Other
  notes TEXT,
  delivery_address TEXT,
  delivery_charge NUMERIC(8,2) DEFAULT 0,
  is_printed BOOLEAN DEFAULT FALSE,
  invoice_number TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  name TEXT NOT NULL, -- snapshot at time of order
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','served','cancelled')),
  kitchen_station_id UUID REFERENCES kitchen_stations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_id UUID REFERENCES modifiers(id),
  modifier_name TEXT NOT NULL,
  option_name TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  method TEXT NOT NULL CHECK (method IN ('cash','card','upi','online','wallet','credit')),
  amount NUMERIC(12,2) NOT NULL,
  reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  invoice_number TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL DEFAULT '{}', -- snapshot of full invoice
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  abbreviation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  unit_id UUID REFERENCES units(id),
  unit_name TEXT, -- denormalized for convenience
  quantity NUMERIC(12,3) DEFAULT 0,
  low_stock_threshold NUMERIC(12,3) DEFAULT 10,
  cost_per_unit NUMERIC(10,2) DEFAULT 0,
  category TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  type TEXT NOT NULL CHECK (type IN ('purchase','sale','adjustment','wastage','transfer','opening')),
  quantity NUMERIC(12,3) NOT NULL, -- positive = in, negative = out
  quantity_before NUMERIC(12,3),
  quantity_after NUMERIC(12,3),
  cost_per_unit NUMERIC(10,2),
  reference_id UUID, -- order_id, purchase_id, etc.
  reference_type TEXT,
  notes TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number TEXT,
  total NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'received' CHECK (status IN ('draft','ordered','received','cancelled')),
  notes TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity NUMERIC(12,3) NOT NULL,
  cost_per_unit NUMERIC(10,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wastage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity NUMERIC(12,3) NOT NULL,
  reason TEXT,
  cost_amount NUMERIC(10,2) DEFAULT 0,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECIPES
-- ============================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  notes TEXT,
  yield_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity NUMERIC(12,3) NOT NULL,
  unit_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISCOUNTS & COUPONS
-- ============================================================

CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KITCHEN DISPLAY SYSTEM
-- ============================================================

CREATE TABLE kitchen_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  station_id UUID REFERENCES kitchen_stations(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new','accepted','preparing','ready','completed')),
  priority INTEGER DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  type TEXT NOT NULL CHECK (type IN ('new_order','low_stock','order_ready','payment','system')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Orders
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_type ON orders(restaurant_id, type);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_completed ON orders(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Products
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(restaurant_id, is_available) WHERE deleted_at IS NULL;

-- Inventory
CREATE INDEX idx_inventory_restaurant ON inventory_items(restaurant_id);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id, created_at DESC);
CREATE INDEX idx_inventory_movements_restaurant ON inventory_movements(restaurant_id, created_at DESC);

-- Customers
CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX idx_customers_phone ON customers(restaurant_id, phone);

-- Tables
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_floor ON tables(floor_id);
CREATE INDEX idx_tables_status ON tables(restaurant_id, status);

-- Kitchen orders
CREATE INDEX idx_kitchen_orders_order ON kitchen_orders(order_id);
CREATE INDEX idx_kitchen_orders_restaurant ON kitchen_orders(restaurant_id, status);

-- Notifications
CREATE INDEX idx_notifications_restaurant ON notifications(restaurant_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(restaurant_id, is_read) WHERE is_read = FALSE;

-- Profiles
CREATE INDEX idx_profiles_restaurant ON profiles(restaurant_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_restaurant_settings_updated BEFORE UPDATE ON restaurant_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_floors_updated BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tables_updated BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_items_updated BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_items_updated BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kitchen_orders_updated BEFORE UPDATE ON kitchen_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-provision new restaurant and owner profile on new auth user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_rest_id UUID;
  new_branch_id UUID;
  tax_id UUID;
  cat_starters UUID;
  cat_main UUID;
  cat_bev UUID;
  cat_des UUID;
  floor_id UUID;
  rest_name TEXT;
  user_name TEXT;
BEGIN
  user_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, 'User'), '@', 1));
  rest_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'restaurant_name'), ''), user_name || '''s Restaurant');

  -- 1. Create new unique restaurant
  INSERT INTO restaurants (name, email) 
  VALUES (rest_name, NEW.email)
  RETURNING id INTO new_rest_id;

  -- 2. Create main branch
  INSERT INTO branches (restaurant_id, name, is_main)
  VALUES (new_rest_id, 'Main Branch', TRUE)
  RETURNING id INTO new_branch_id;

  -- 3. Create settings
  INSERT INTO restaurant_settings (restaurant_id, branch_id)
  VALUES (new_rest_id, new_branch_id);

  -- 4. Create profile as owner
  INSERT INTO profiles (id, restaurant_id, branch_id, email, name, role)
  VALUES (
    NEW.id,
    new_rest_id,
    new_branch_id,
    NEW.email,
    user_name,
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET
    restaurant_id = EXCLUDED.restaurant_id,
    branch_id = EXCLUDED.branch_id,
    name = EXCLUDED.name,
    role = 'owner';

  -- 5. Create default taxes (GST 5%)
  INSERT INTO taxes (restaurant_id, name, rate, type, is_default)
  VALUES (new_rest_id, 'GST 5%', 5.00, 'gst', TRUE)
  RETURNING id INTO tax_id;

  -- 6. Create starter categories
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Starters', 1, '#ef4444') RETURNING id INTO cat_starters;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Main Course', 2, '#f97316') RETURNING id INTO cat_main;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Beverages', 3, '#3b82f6') RETURNING id INTO cat_bev;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Desserts', 4, '#a855f7') RETURNING id INTO cat_des;

  -- 7. Create starter products
  INSERT INTO products (restaurant_id, category_id, tax_id, name, price, cost_price, is_veg) VALUES
    (new_rest_id, cat_starters, tax_id, 'Paneer Tikka', 250.00, 100.00, TRUE),
    (new_rest_id, cat_starters, tax_id, 'Veg Spring Roll', 180.00, 70.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Dal Makhani', 220.00, 80.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Butter Chicken', 350.00, 150.00, FALSE),
    (new_rest_id, cat_bev, tax_id, 'Cold Coffee', 120.00, 40.00, TRUE),
    (new_rest_id, cat_des, tax_id, 'Gulab Jamun', 100.00, 30.00, TRUE);

  -- 8. Create floors and tables
  INSERT INTO floors (restaurant_id, name, sort_order)
  VALUES (new_rest_id, 'Ground Floor', 1)
  RETURNING id INTO floor_id;

  INSERT INTO tables (restaurant_id, floor_id, number, capacity) VALUES
    (new_rest_id, floor_id, 'T-01', 2),
    (new_rest_id, floor_id, 'T-02', 4),
    (new_rest_id, floor_id, 'T-03', 6);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Direct RPC function for creating new restaurant on demand
CREATE OR REPLACE FUNCTION setup_new_restaurant(
  p_restaurant_name TEXT,
  p_user_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_rest_id UUID;
  new_branch_id UUID;
  tax_id UUID;
  cat_starters UUID;
  cat_main UUID;
  cat_bev UUID;
  cat_des UUID;
  floor_id UUID;
  u_email TEXT;
  chosen_name TEXT;
  chosen_user TEXT;
BEGIN
  SELECT email INTO u_email FROM auth.users WHERE id = auth.uid();
  chosen_user := COALESCE(NULLIF(TRIM(p_user_name), ''), split_part(COALESCE(u_email, 'User'), '@', 1));
  chosen_name := COALESCE(NULLIF(TRIM(p_restaurant_name), ''), chosen_user || '''s Restaurant');

  INSERT INTO restaurants (name, email)
  VALUES (chosen_name, u_email)
  RETURNING id INTO new_rest_id;

  INSERT INTO branches (restaurant_id, name, is_main)
  VALUES (new_rest_id, 'Main Branch', TRUE)
  RETURNING id INTO new_branch_id;

  INSERT INTO restaurant_settings (restaurant_id, branch_id)
  VALUES (new_rest_id, new_branch_id);

  INSERT INTO taxes (restaurant_id, name, rate, type, is_default)
  VALUES (new_rest_id, 'GST 5%', 5.00, 'gst', TRUE)
  RETURNING id INTO tax_id;

  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Starters', 1, '#ef4444') RETURNING id INTO cat_starters;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Main Course', 2, '#f97316') RETURNING id INTO cat_main;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Beverages', 3, '#3b82f6') RETURNING id INTO cat_bev;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Desserts', 4, '#a855f7') RETURNING id INTO cat_des;

  INSERT INTO products (restaurant_id, category_id, tax_id, name, price, cost_price, is_veg) VALUES
    (new_rest_id, cat_starters, tax_id, 'Paneer Tikka', 250.00, 100.00, TRUE),
    (new_rest_id, cat_starters, tax_id, 'Veg Spring Roll', 180.00, 70.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Dal Makhani', 220.00, 80.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Butter Chicken', 350.00, 150.00, FALSE),
    (new_rest_id, cat_bev, tax_id, 'Cold Coffee', 120.00, 40.00, TRUE),
    (new_rest_id, cat_des, tax_id, 'Gulab Jamun', 100.00, 30.00, TRUE);

  INSERT INTO floors (restaurant_id, name, sort_order)
  VALUES (new_rest_id, 'Ground Floor', 1)
  RETURNING id INTO floor_id;

  INSERT INTO tables (restaurant_id, floor_id, number, capacity) VALUES
    (new_rest_id, floor_id, 'T-01', 2),
    (new_rest_id, floor_id, 'T-02', 4),
    (new_rest_id, floor_id, 'T-03', 6);

  INSERT INTO profiles (id, restaurant_id, branch_id, email, name, role)
  VALUES (
    auth.uid(),
    new_rest_id,
    new_branch_id,
    u_email,
    chosen_user,
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET
    restaurant_id = EXCLUDED.restaurant_id,
    branch_id = EXCLUDED.branch_id,
    name = EXCLUDED.name,
    role = 'owner';

  RETURN json_build_object(
    'restaurant_id', new_rest_id,
    'branch_id', new_branch_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION setup_new_restaurant(TEXT, TEXT) TO authenticated;

-- Update customer totals after order completed
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_customer_totals
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_totals();

-- Update table status when order is created/completed
CREATE OR REPLACE FUNCTION update_table_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.table_id IS NOT NULL THEN
    UPDATE tables SET status = 'occupied', current_order_id = NEW.id WHERE id = NEW.table_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.table_id IS NOT NULL THEN
    IF NEW.status IN ('completed', 'cancelled') THEN
      UPDATE tables SET status = 'cleaning', current_order_id = NULL WHERE id = NEW.table_id;
    ELSIF NEW.status = 'pending' AND OLD.status = 'draft' THEN
      UPDATE tables SET status = 'occupied', current_order_id = NEW.id WHERE id = NEW.table_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_table_status
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_table_on_order();
\n\n-- ============================================================\n-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES & REALTIME\n-- ============================================================\n\n-- ============================================================
-- RLS Policies
-- Migration: 002_rls_policies.sql
-- ============================================================
-- The pattern: every user belongs to a restaurant_id via profiles.
-- All data access is scoped to auth.uid()'s restaurant_id.
-- ============================================================

-- Helper function to get current user's restaurant_id
CREATE OR REPLACE FUNCTION get_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if current user is owner or admin
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT role IN ('owner','admin') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RESTAURANTS
-- ============================================================
CREATE POLICY "restaurants_select" ON restaurants FOR SELECT
  USING (id = get_restaurant_id());

CREATE POLICY "restaurants_insert" ON restaurants FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "restaurants_update" ON restaurants FOR UPDATE
  USING (id = get_restaurant_id() AND is_admin_or_owner());

-- ============================================================
-- BRANCHES
-- ============================================================
CREATE POLICY "branches_select" ON branches FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "branches_insert" ON branches FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "branches_all" ON branches FOR ALL
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

-- ============================================================
-- RESTAURANT SETTINGS
-- ============================================================
CREATE POLICY "settings_select" ON restaurant_settings FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "settings_insert" ON restaurant_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "settings_all" ON restaurant_settings FOR ALL
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR restaurant_id = get_restaurant_id());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- FLOORS
-- ============================================================
CREATE POLICY "floors_select" ON floors FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "floors_all" ON floors FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- TABLES
-- ============================================================
CREATE POLICY "tables_select" ON tables FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "tables_all" ON tables FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE POLICY "categories_select" ON categories FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "categories_all" ON categories FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- KITCHEN STATIONS
-- ============================================================
CREATE POLICY "kitchen_stations_select" ON kitchen_stations FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "kitchen_stations_all" ON kitchen_stations FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- TAXES
-- ============================================================
CREATE POLICY "taxes_select" ON taxes FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "taxes_all" ON taxes FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE POLICY "products_select" ON products FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "products_all" ON products FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================
CREATE POLICY "variants_select" ON product_variants FOR SELECT
  USING (
    product_id IN (SELECT id FROM products WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "variants_all" ON product_variants FOR ALL
  USING (
    product_id IN (SELECT id FROM products WHERE restaurant_id = get_restaurant_id())
  );

-- ============================================================
-- MODIFIERS
-- ============================================================
CREATE POLICY "modifiers_select" ON modifiers FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "modifiers_all" ON modifiers FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "modifier_options_select" ON modifier_options FOR SELECT
  USING (
    modifier_id IN (SELECT id FROM modifiers WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "modifier_options_all" ON modifier_options FOR ALL
  USING (
    modifier_id IN (SELECT id FROM modifiers WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "product_modifiers_select" ON product_modifiers FOR SELECT
  USING (
    product_id IN (SELECT id FROM products WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "product_modifiers_all" ON product_modifiers FOR ALL
  USING (
    product_id IN (SELECT id FROM products WHERE restaurant_id = get_restaurant_id())
  );

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE POLICY "customers_select" ON customers FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "customers_all" ON customers FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "orders_select" ON orders FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "orders_insert" ON orders FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

CREATE POLICY "orders_update" ON orders FOR UPDATE
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "orders_delete" ON orders FOR DELETE
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "order_items_all" ON order_items FOR ALL
  USING (
    order_id IN (SELECT id FROM orders WHERE restaurant_id = get_restaurant_id())
  );

-- ============================================================
-- ORDER ITEM MODIFIERS
-- ============================================================
CREATE POLICY "order_item_mods_select" ON order_item_modifiers FOR SELECT
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.restaurant_id = get_restaurant_id()
    )
  );

CREATE POLICY "order_item_mods_all" ON order_item_modifiers FOR ALL
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.restaurant_id = get_restaurant_id()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "payments_select" ON payments FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "payments_insert" ON payments FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

CREATE POLICY "payments_update" ON payments FOR UPDATE
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

-- ============================================================
-- INVOICES
-- ============================================================
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE POLICY "units_select" ON units FOR SELECT
  USING (restaurant_id = get_restaurant_id() OR restaurant_id IS NULL);

CREATE POLICY "units_all" ON units FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "suppliers_select" ON suppliers FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "suppliers_all" ON suppliers FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "inventory_items_all" ON inventory_items FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "inventory_movements_select" ON inventory_movements FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "inventory_movements_insert" ON inventory_movements FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

CREATE POLICY "purchases_select" ON purchases FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "purchases_all" ON purchases FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "purchase_items_select" ON purchase_items FOR SELECT
  USING (
    purchase_id IN (SELECT id FROM purchases WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "purchase_items_all" ON purchase_items FOR ALL
  USING (
    purchase_id IN (SELECT id FROM purchases WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "wastage_select" ON wastage FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "wastage_all" ON wastage FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- RECIPES
-- ============================================================
CREATE POLICY "recipes_select" ON recipes FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "recipes_all" ON recipes FOR ALL
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "recipe_items_select" ON recipe_items FOR SELECT
  USING (
    recipe_id IN (SELECT id FROM recipes WHERE restaurant_id = get_restaurant_id())
  );

CREATE POLICY "recipe_items_all" ON recipe_items FOR ALL
  USING (
    recipe_id IN (SELECT id FROM recipes WHERE restaurant_id = get_restaurant_id())
  );

-- ============================================================
-- DISCOUNTS
-- ============================================================
CREATE POLICY "discounts_select" ON discounts FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "discounts_all" ON discounts FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- KITCHEN ORDERS
-- ============================================================
CREATE POLICY "kitchen_orders_select" ON kitchen_orders FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "kitchen_orders_all" ON kitchen_orders FOR ALL
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (restaurant_id = get_restaurant_id());

CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (restaurant_id = get_restaurant_id());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (restaurant_id = get_restaurant_id() AND is_admin_or_owner());

CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (restaurant_id = get_restaurant_id());

-- ============================================================
-- SUPABASE REALTIME CONFIGURATION
-- Enable realtime for orders, items, tables, notifications, etc.
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders, order_items, tables, notifications, kitchen_orders;
  EXCEPTION WHEN OTHERS THEN
    -- If tables are already in publication, ignore
    NULL;
  END;
END $$;

\n\n-- ============================================================\n-- PART 3: INITIAL DEMO SEED DATA\n-- ============================================================\n\n-- ============================================================
-- Demo Seed Data: Royal Spice Restaurant
-- Migration: 003_seed_data.sql
-- Run AFTER creating a user in Supabase Auth, then update the UUIDs below.
-- ============================================================

-- NOTE: Replace the placeholder UUIDs with actual values after running migrations.
-- This script uses variables for readability. In Supabase SQL Editor, run section by section.

DO $$
DECLARE
  rest_id UUID := 'a1b2c3d4-0001-0001-0001-000000000001';
  b_id UUID := 'a1b2c3d4-0002-0001-0001-000000000001';

  -- Categories
  cat_starters UUID := 'a1b2c3d4-0010-0001-0001-000000000001';
  cat_main UUID := 'a1b2c3d4-0010-0001-0001-000000000002';
  cat_breads UUID := 'a1b2c3d4-0010-0001-0001-000000000003';
  cat_rice UUID := 'a1b2c3d4-0010-0001-0001-000000000004';
  cat_beverages UUID := 'a1b2c3d4-0010-0001-0001-000000000005';
  cat_desserts UUID := 'a1b2c3d4-0010-0001-0001-000000000006';

  -- Tax
  tax_gst5 UUID := 'a1b2c3d4-0020-0001-0001-000000000001';
  tax_gst12 UUID := 'a1b2c3d4-0020-0001-0001-000000000002';

  -- Floor
  floor_main UUID := 'a1b2c3d4-0030-0001-0001-000000000001';
  floor_roof UUID := 'a1b2c3d4-0030-0001-0001-000000000002';

BEGIN

-- ============================================================
-- RESTAURANT
-- ============================================================
INSERT INTO restaurants (id, name, slug, address, city, state, pincode, phone, email, gstin, currency)
VALUES (
  rest_id,
  'Royal Spice Restaurant',
  'royal-spice',
  '42, MG Road, Near City Mall',
  'Bengaluru',
  'Karnataka',
  '560001',
  '+91 98765 43210',
  'admin@royalspice.in',
  '29ABCDE1234F1Z5',
  'INR'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BRANCH
-- ============================================================
INSERT INTO branches (id, restaurant_id, name, address, phone, is_active, is_main)
VALUES (
  b_id,
  rest_id,
  'Main Branch - MG Road',
  '42, MG Road, Near City Mall, Bengaluru - 560001',
  '+91 98765 43210',
  TRUE,
  TRUE
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SETTINGS
-- ============================================================
INSERT INTO restaurant_settings (restaurant_id, branch_id, invoice_prefix, order_prefix, default_tax_rate, default_service_charge, enable_round_off, receipt_footer, show_gstin)
VALUES (
  rest_id, b_id, 'RSR', 'ORD', 5.00, 5.00, TRUE, 'Thank you for dining at Royal Spice! We hope to see you again.', TRUE
) ON CONFLICT (restaurant_id, branch_id) DO NOTHING;

-- ============================================================
-- TAXES
-- ============================================================
INSERT INTO taxes (id, restaurant_id, name, rate, type, is_default) VALUES
  (tax_gst5, rest_id, 'GST 5%', 5.00, 'gst', TRUE),
  (tax_gst12, rest_id, 'GST 12%', 12.00, 'gst', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (id, restaurant_id, name, sort_order, color) VALUES
  (cat_starters,  rest_id, 'Starters',    1, '#ef4444'),
  (cat_main,      rest_id, 'Main Course',  2, '#f97316'),
  (cat_breads,    rest_id, 'Breads',       3, '#eab308'),
  (cat_rice,      rest_id, 'Rice',         4, '#22c55e'),
  (cat_beverages, rest_id, 'Beverages',    5, '#3b82f6'),
  (cat_desserts,  rest_id, 'Desserts',     6, '#a855f7')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO products (restaurant_id, category_id, tax_id, name, description, price, cost_price, is_veg, prep_time, is_featured, is_available) VALUES
  -- Starters
  (rest_id, cat_starters, tax_gst5, 'Paneer Tikka', 'Marinated cottage cheese grilled in tandoor with bell peppers and onions', 280.00, 120.00, TRUE, 20, TRUE, TRUE),
  (rest_id, cat_starters, tax_gst5, 'Veg Spring Roll', 'Crispy golden rolls stuffed with fresh vegetables and noodles', 180.00, 70.00, TRUE, 15, FALSE, TRUE),
  (rest_id, cat_starters, tax_gst5, 'Chicken Tikka', 'Tender chicken marinated in yogurt and spices, grilled to perfection', 320.00, 140.00, FALSE, 20, TRUE, TRUE),
  (rest_id, cat_starters, tax_gst5, 'Hara Bhara Kabab', 'Spinach and vegetable patties with mint chutney', 200.00, 80.00, TRUE, 15, FALSE, TRUE),

  -- Main Course
  (rest_id, cat_main, tax_gst5, 'Butter Chicken', 'Tender chicken in rich tomato-butter gravy — our signature dish', 380.00, 160.00, FALSE, 25, TRUE, TRUE),
  (rest_id, cat_main, tax_gst5, 'Paneer Butter Masala', 'Fresh cottage cheese in creamy tomato gravy with aromatic spices', 320.00, 130.00, TRUE, 20, TRUE, TRUE),
  (rest_id, cat_main, tax_gst5, 'Dal Makhani', 'Slow-cooked black lentils with butter and cream — an overnight classic', 240.00, 80.00, TRUE, 30, TRUE, TRUE),
  (rest_id, cat_main, tax_gst5, 'Palak Paneer', 'Fresh spinach gravy with cottage cheese cubes', 280.00, 110.00, TRUE, 20, FALSE, TRUE),
  (rest_id, cat_main, tax_gst5, 'Chicken Kadai', 'Spicy chicken cooked with bell peppers and kadai masala', 360.00, 150.00, FALSE, 25, FALSE, TRUE),
  (rest_id, cat_main, tax_gst5, 'Mutton Rogan Josh', 'Kashmiri-style mutton in aromatic red gravy', 450.00, 200.00, FALSE, 35, FALSE, TRUE),

  -- Breads
  (rest_id, cat_breads, tax_gst5, 'Butter Naan', 'Soft leavened bread baked in tandoor with butter', 60.00, 20.00, TRUE, 10, FALSE, TRUE),
  (rest_id, cat_breads, tax_gst5, 'Garlic Naan', 'Naan topped with garlic and coriander', 80.00, 25.00, TRUE, 10, FALSE, TRUE),
  (rest_id, cat_breads, tax_gst5, 'Tandoori Roti', 'Whole wheat bread baked in tandoor', 40.00, 12.00, TRUE, 8, FALSE, TRUE),
  (rest_id, cat_breads, tax_gst5, 'Laccha Paratha', 'Multi-layered flaky paratha', 70.00, 22.00, TRUE, 12, FALSE, TRUE),

  -- Rice
  (rest_id, cat_rice, tax_gst5, 'Veg Biryani', 'Fragrant basmati rice cooked with seasonal vegetables and whole spices', 280.00, 100.00, TRUE, 30, TRUE, TRUE),
  (rest_id, cat_rice, tax_gst5, 'Chicken Biryani', 'Hyderabadi dum biryani with tender chicken and saffron rice', 380.00, 160.00, FALSE, 35, TRUE, TRUE),
  (rest_id, cat_rice, tax_gst5, 'Paneer Biryani', 'Aromatic biryani with paneer and caramelized onions', 320.00, 130.00, TRUE, 30, FALSE, TRUE),
  (rest_id, cat_rice, tax_gst5, 'Steamed Rice', 'Plain steamed basmati rice', 80.00, 25.00, TRUE, 15, FALSE, TRUE),

  -- Beverages
  (rest_id, cat_beverages, tax_gst5, 'Masala Chai', 'Classic Indian spiced tea with ginger and cardamom', 60.00, 15.00, TRUE, 5, FALSE, TRUE),
  (rest_id, cat_beverages, tax_gst5, 'Cold Coffee', 'Chilled coffee blended with milk and ice cream', 120.00, 45.00, TRUE, 5, FALSE, TRUE),
  (rest_id, cat_beverages, tax_gst5, 'Fresh Lime Soda', 'Refreshing lime soda — sweet, salty or mixed', 80.00, 20.00, TRUE, 3, FALSE, TRUE),
  (rest_id, cat_beverages, tax_gst5, 'Mango Lassi', 'Thick yogurt drink blended with Alphonso mango', 120.00, 40.00, TRUE, 5, TRUE, TRUE),
  (rest_id, cat_beverages, tax_gst5, 'Mineral Water', 'Chilled mineral water 500ml', 40.00, 10.00, TRUE, 1, FALSE, TRUE),

  -- Desserts
  (rest_id, cat_desserts, tax_gst5, 'Gulab Jamun', 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup', 120.00, 40.00, TRUE, 10, TRUE, TRUE),
  (rest_id, cat_desserts, tax_gst5, 'Kulfi', 'Traditional Indian ice cream with pistachio and cardamom', 100.00, 35.00, TRUE, 5, FALSE, TRUE),
  (rest_id, cat_desserts, tax_gst5, 'Rasgulla', 'Soft spongy cottage cheese balls in light sugar syrup', 100.00, 30.00, TRUE, 5, FALSE, TRUE),
  (rest_id, cat_desserts, tax_gst5, 'Kheer', 'Creamy rice pudding with saffron and dry fruits', 120.00, 45.00, TRUE, 15, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FLOORS
-- ============================================================
INSERT INTO floors (id, restaurant_id, name, sort_order) VALUES
  (floor_main, rest_id, 'Ground Floor', 1),
  (floor_roof,  rest_id, 'Rooftop',     2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLES
-- ============================================================
INSERT INTO tables (restaurant_id, floor_id, number, capacity, status) VALUES
  -- Ground Floor
  (rest_id, floor_main, 'T-01', 2, 'available'),
  (rest_id, floor_main, 'T-02', 2, 'available'),
  (rest_id, floor_main, 'T-03', 4, 'available'),
  (rest_id, floor_main, 'T-04', 4, 'available'),
  (rest_id, floor_main, 'T-05', 4, 'available'),
  (rest_id, floor_main, 'T-06', 6, 'available'),
  (rest_id, floor_main, 'T-07', 6, 'available'),
  (rest_id, floor_main, 'T-08', 8, 'available'),
  -- Rooftop
  (rest_id, floor_roof, 'R-01', 2, 'available'),
  (rest_id, floor_roof, 'R-02', 4, 'available'),
  (rest_id, floor_roof, 'R-03', 4, 'available'),
  (rest_id, floor_roof, 'R-04', 6, 'available'),
  (rest_id, floor_roof, 'R-05', 8, 'available')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO customers (restaurant_id, name, phone, email, total_orders, total_spent) VALUES
  (rest_id, 'Arjun Sharma', '9876543210', 'arjun.sharma@gmail.com', 12, 8450.00),
  (rest_id, 'Priya Mehta', '9845012345', 'priya.mehta@gmail.com', 8, 5280.00),
  (rest_id, 'Rahul Kumar', '9900112233', 'rahul.kumar@outlook.com', 5, 3200.00),
  (rest_id, 'Sneha Patel', '9765432109', 'sneha.patel@gmail.com', 15, 11200.00),
  (rest_id, 'Vikram Singh', '9812345678', 'vikram.singh@gmail.com', 3, 1850.00),
  (rest_id, 'Ananya Reddy', '9988776655', 'ananya.reddy@yahoo.com', 20, 15600.00),
  (rest_id, 'Kiran Nair', '9871234560', NULL, 7, 4900.00),
  (rest_id, 'Deepak Verma', '9756123890', 'deepak.verma@gmail.com', 2, 1200.00)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
INSERT INTO inventory_items (restaurant_id, name, unit_name, quantity, low_stock_threshold, cost_per_unit, category) VALUES
  (rest_id, 'Paneer', 'kg', 15.5, 5, 320, 'Dairy'),
  (rest_id, 'Butter', 'kg', 8.0, 2, 480, 'Dairy'),
  (rest_id, 'Cream', 'ltr', 6.0, 2, 260, 'Dairy'),
  (rest_id, 'Chicken (Boneless)', 'kg', 25.0, 10, 280, 'Meat'),
  (rest_id, 'Mutton', 'kg', 12.0, 5, 680, 'Meat'),
  (rest_id, 'Tomatoes', 'kg', 20.0, 5, 30, 'Vegetables'),
  (rest_id, 'Onions', 'kg', 30.0, 10, 25, 'Vegetables'),
  (rest_id, 'Ginger', 'kg', 5.0, 2, 80, 'Vegetables'),
  (rest_id, 'Garlic', 'kg', 4.0, 2, 120, 'Vegetables'),
  (rest_id, 'Basmati Rice', 'kg', 50.0, 15, 90, 'Grains'),
  (rest_id, 'Maida (All Purpose Flour)', 'kg', 30.0, 10, 40, 'Grains'),
  (rest_id, 'Black Lentils (Urad Dal)', 'kg', 15.0, 5, 130, 'Pulses'),
  (rest_id, 'Cooking Oil', 'ltr', 20.0, 5, 140, 'Oils'),
  (rest_id, 'Cardamom', 'gm', 500.0, 100, 3, 'Spices'),
  (rest_id, 'Cumin Seeds', 'gm', 800.0, 200, 0.5, 'Spices'),
  (rest_id, 'Turmeric Powder', 'gm', 600.0, 200, 0.8, 'Spices'),
  (rest_id, 'Red Chili Powder', 'gm', 700.0, 200, 1, 'Spices'),
  (rest_id, 'Garam Masala', 'gm', 400.0, 150, 2, 'Spices'),
  (rest_id, 'Milk', 'ltr', 15.0, 5, 65, 'Dairy'),
  (rest_id, 'Mineral Water Bottles', 'pcs', 48, 12, 10, 'Beverages'),
  (rest_id, 'Sugar', 'kg', 10.0, 3, 45, 'Others'),
  (rest_id, 'Salt', 'kg', 5.0, 2, 20, 'Others')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (restaurant_id, name, contact_name, phone, email) VALUES
  (rest_id, 'Nandini Dairy Products', 'Suresh Kumar', '9876501234', 'suresh@nandinidairy.com'),
  (rest_id, 'Fresh Farms Vegetables', 'Ravi Gowda', '9845678901', 'ravi@freshfarms.in'),
  (rest_id, 'Star Chicken Suppliers', 'Mohammed Ashraf', '9912345678', 'ashraf@starchicken.in'),
  (rest_id, 'Spice World Enterprises', 'Pradeep Nair', '9823456789', 'pradeep@spiceworld.com'),
  (rest_id, 'Radha Rice Mills', 'Gangadhar Rao', '9734567890', 'gangadhar@radharice.com')
ON CONFLICT DO NOTHING;

-- ============================================================
-- KITCHEN STATIONS
-- ============================================================
INSERT INTO kitchen_stations (restaurant_id, name) VALUES
  (rest_id, 'Tandoor Station'),
  (rest_id, 'Main Kitchen'),
  (rest_id, 'Beverage Station'),
  (rest_id, 'Dessert Station')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MODIFIERS
-- ============================================================
INSERT INTO modifiers (restaurant_id, name, is_required, min_select, max_select) VALUES
  (rest_id, 'Spice Level', TRUE, 1, 1),
  (rest_id, 'Extra Add-ons', FALSE, 0, 3),
  (rest_id, 'Naan Size', FALSE, 0, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DISCOUNTS
-- ============================================================
INSERT INTO discounts (restaurant_id, name, code, type, value, min_order_amount, is_active) VALUES
  (rest_id, 'Weekend Special', 'WEEKEND10', 'percentage', 10, 500, TRUE),
  (rest_id, 'Happy Hours', 'HAPPY15', 'percentage', 15, 300, TRUE),
  (rest_id, 'First Visit', 'WELCOME50', 'fixed', 50, 200, TRUE),
  (rest_id, 'Loyalty Reward', 'LOYAL100', 'fixed', 100, 1000, TRUE)
ON CONFLICT DO NOTHING;

END $$;
