-- ============================================================
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
