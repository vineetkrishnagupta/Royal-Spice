-- ============================================================
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

