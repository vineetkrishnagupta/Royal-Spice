-- ============================================================
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
