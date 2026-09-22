/**
 * Permission definitions for RBAC
 */
export const PERMISSIONS = {
  // POS
  POS_ACCESS: 'pos_access',
  POS_DISCOUNT: 'pos_discount',
  POS_REFUND: 'pos_refund',
  POS_VOID: 'pos_void',
  POS_HOLD: 'pos_hold',

  // Orders
  ORDERS_VIEW: 'orders_view',
  ORDERS_EDIT: 'orders_edit',
  ORDERS_DELETE: 'orders_delete',
  ORDERS_CANCEL: 'orders_cancel',

  // Menu
  MENU_VIEW: 'menu_view',
  MENU_EDIT: 'menu_edit',

  // Inventory
  INVENTORY_VIEW: 'inventory_view',
  INVENTORY_EDIT: 'inventory_edit',

  // Customers
  CUSTOMERS_VIEW: 'customers_view',
  CUSTOMERS_EDIT: 'customers_edit',

  // Staff
  STAFF_VIEW: 'staff_view',
  STAFF_EDIT: 'staff_edit',

  // Reports
  REPORTS_VIEW: 'reports_view',
  REPORTS_EXPORT: 'reports_export',

  // Settings
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_EDIT: 'settings_edit',

  // Tables
  TABLES_VIEW: 'tables_view',
  TABLES_EDIT: 'tables_edit',

  // Kitchen
  KITCHEN_VIEW: 'kitchen_view',
  KITCHEN_EDIT: 'kitchen_edit',
}

/**
 * Default permissions per role
 */
export const ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_HOLD,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.TABLES_VIEW,
    PERMISSIONS.TABLES_EDIT,
    PERMISSIONS.KITCHEN_VIEW,
  ],
  cashier: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.POS_HOLD,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.TABLES_VIEW,
    PERMISSIONS.TABLES_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  waiter: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.TABLES_VIEW,
    PERMISSIONS.TABLES_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],
  kitchen: [
    PERMISSIONS.KITCHEN_VIEW,
    PERMISSIONS.KITCHEN_EDIT,
    PERMISSIONS.ORDERS_VIEW,
  ],
  delivery: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.POS_ACCESS,
  ],
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userPermissions = [], permission) {
  return userPermissions.includes(permission)
}

/**
 * Check if user has any of the listed permissions
 */
export function hasAnyPermission(userPermissions = [], permissions = []) {
  return permissions.some(p => userPermissions.includes(p))
}

/**
 * Check if user has all listed permissions
 */
export function hasAllPermissions(userPermissions = [], permissions = []) {
  return permissions.every(p => userPermissions.includes(p))
}
