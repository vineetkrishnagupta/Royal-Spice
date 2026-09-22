-- ============================================================
-- RPC FUNCTION: setup_new_restaurant
-- Creates a brand-new restaurant, branch, settings, taxes,
-- categories, products, and tables for any new user.
-- ============================================================

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
  -- Get user email from auth.users
  SELECT email INTO u_email FROM auth.users WHERE id = auth.uid();
  
  chosen_user := COALESCE(NULLIF(TRIM(p_user_name), ''), split_part(COALESCE(u_email, 'User'), '@', 1));
  chosen_name := COALESCE(NULLIF(TRIM(p_restaurant_name), ''), chosen_user || '''s Restaurant');

  -- 1. Create brand-new unique restaurant
  INSERT INTO restaurants (name, email)
  VALUES (chosen_name, u_email)
  RETURNING id INTO new_rest_id;

  -- 2. Create main branch
  INSERT INTO branches (restaurant_id, name, is_main)
  VALUES (new_rest_id, 'Main Branch', TRUE)
  RETURNING id INTO new_branch_id;

  -- 3. Create settings
  INSERT INTO restaurant_settings (restaurant_id, branch_id)
  VALUES (new_rest_id, new_branch_id);

  -- 4. Create default taxes (GST 5%)
  INSERT INTO taxes (restaurant_id, name, rate, type, is_default)
  VALUES (new_rest_id, 'GST 5%', 5.00, 'gst', TRUE)
  RETURNING id INTO tax_id;

  -- 5. Create default categories
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Starters', 1, '#ef4444') RETURNING id INTO cat_starters;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Main Course', 2, '#f97316') RETURNING id INTO cat_main;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Beverages', 3, '#3b82f6') RETURNING id INTO cat_bev;
  INSERT INTO categories (restaurant_id, name, sort_order, color) VALUES
    (new_rest_id, 'Desserts', 4, '#a855f7') RETURNING id INTO cat_des;

  -- 6. Create starter products for the new restaurant
  INSERT INTO products (restaurant_id, category_id, tax_id, name, price, cost_price, is_veg) VALUES
    (new_rest_id, cat_starters, tax_id, 'Paneer Tikka', 250.00, 100.00, TRUE),
    (new_rest_id, cat_starters, tax_id, 'Veg Spring Roll', 180.00, 70.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Dal Makhani', 220.00, 80.00, TRUE),
    (new_rest_id, cat_main, tax_id, 'Butter Chicken', 350.00, 150.00, FALSE),
    (new_rest_id, cat_bev, tax_id, 'Cold Coffee', 120.00, 40.00, TRUE),
    (new_rest_id, cat_des, tax_id, 'Gulab Jamun', 100.00, 30.00, TRUE);

  -- 7. Create floor & tables
  INSERT INTO floors (restaurant_id, name, sort_order)
  VALUES (new_rest_id, 'Ground Floor', 1)
  RETURNING id INTO floor_id;

  INSERT INTO tables (restaurant_id, floor_id, number, capacity) VALUES
    (new_rest_id, floor_id, 'T-01', 2),
    (new_rest_id, floor_id, 'T-02', 4),
    (new_rest_id, floor_id, 'T-03', 6);

  -- 8. Create or update profile as 'owner'
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

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION setup_new_restaurant(TEXT, TEXT) TO authenticated;

-- ============================================================
-- AUTH TRIGGER: Automatically triggers on any new signup
-- ============================================================
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

  -- 1. Create new restaurant
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

  -- 5. Create default taxes
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

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
