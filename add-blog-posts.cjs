const fs = require('fs')
const path = 'src/pages/blog/BlogPage.jsx'
let content = fs.readFileSync(path, 'utf8')

const newPosts = `  {
    id: 'analytics-reporting-dashboard',
    title: 'Data-Driven Dining: Real-Time Analytics and Sales Reporting',
    slug: 'analytics-reporting-dashboard',
    category: 'Analytics',
    readTime: '4 min read',
    date: 'Sep 16, 2026',
    author: {
      name: 'Simran Kaur',
      role: 'Data Scientist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Make intelligent business decisions with live sales dashboards, item popularity matrices, and peak-hour revenue tracking using Recharts.',
    tags: ['Analytics', 'Recharts', 'Sales Tracking', 'Dashboards'],
    content: \`
### Stop Flying Blind

A modern restaurant generates thousands of data points daily. Without an intuitive dashboard, owners are guessing which menu items are actually profitable.

### Real-Time Insights Include:
- **Live Sales Tracking:** Watch today's revenue tick up the second a bill is paid.
- **Item Popularity Matrix:** Instantly identify your best-sellers vs. dead inventory.
- **Peak Hour Analysis:** Know exactly when to schedule extra staff for the weekend dinner rush.
- **Exportable Reports:** One-click CSV exports for accounting and tax reconciliation.
    \`,
  },
  {
    id: 'staff-role-management',
    title: 'Bulletproof Security: Staff Roles, Permissions & PIN Access',
    slug: 'staff-role-management',
    category: 'Staff',
    readTime: '3 min read',
    date: 'Sep 15, 2026',
    author: {
      name: 'Vineet Gupta',
      role: 'Lead Developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Prevent unauthorized voids and discounts. Secure your POS with granular role-based access control (RBAC) and individual staff PIN codes.',
    tags: ['Security', 'RBAC', 'Staff Management', 'PIN Authentication'],
    content: \`
### Guarding the Cash Drawer

Not everyone needs the ability to open the cash drawer or apply a 100% discount. 

### Granular Staff Controls:
- **Role-Based Access (RBAC):** Define explicit permissions for Cashiers, Waiters, Managers, and Admins.
- **Action Logs:** Every voided item, applied discount, and cash drawer opening is logged and tied to a specific staff ID.
- **Fast User Switching:** Staff can instantly switch accounts at a shared terminal using 4-digit PINs without fully logging out.
    \`,
  },
  {
    id: 'crm-customer-loyalty',
    title: 'Knowing Your Guests: Integrated CRM and Order History',
    slug: 'crm-customer-loyalty',
    category: 'CRM',
    readTime: '4 min read',
    date: 'Sep 14, 2026',
    author: {
      name: 'Aisha Sharma',
      role: 'Product Manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Turn first-time diners into regulars. Track guest preferences, total lifetime spend, and frequent orders to provide personalized service.',
    tags: ['CRM', 'Customer Loyalty', 'Guest Experience'],
    content: \`
### The Power of Personalization

"The usual, Mr. Patel?" - That level of service shouldn't rely solely on a waiter's memory.

### CRM Features:
- **Guest Profiles:** Capture phone numbers, emails, and birthdays during checkout.
- **Order History:** Instantly pull up a customer's past visits and favorite dishes.
- **Lifetime Value Tracking:** Identify your top 10% highest-spending guests for VIP treatment.
- **Dietary Notes:** Flag allergies permanently on a guest profile so the kitchen is automatically alerted on every future order.
    \`,
  },
  {
    id: 'supplier-purchase-orders',
    title: 'Streamlining Restocks: Supplier & Purchase Order Management',
    slug: 'supplier-purchase-orders',
    category: 'Suppliers',
    readTime: '5 min read',
    date: 'Sep 13, 2026',
    author: {
      name: 'Arjun Verma',
      role: 'Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Never run out of essential ingredients. Manage vendor contacts, track purchase history, and automate restocking workflows.',
    tags: ['Procurement', 'Vendors', 'Supply Chain', 'Restocking'],
    content: \`
### Chaos in the Back Office

Managing raw material procurement via WhatsApp messages and paper receipts leads to missing stock and unpaid vendor disputes.

### The Supplier Hub:
- **Centralized Vendor List:** Keep all supplier contacts, tax IDs, and payment terms in one place.
- **Purchase Order Tracking:** Log what was ordered vs. what was actually received at the loading dock.
- **Cost Fluctuation Monitoring:** Track the historical price of raw materials (e.g., tomatoes, cooking oil) to anticipate margin impacts.
    \`,
  },
  {
    id: 'menu-engineering-categories',
    title: 'Digital Menu Engineering: Categories, Variants, and Modifiers',
    slug: 'menu-engineering-categories',
    category: 'Menu Engineering',
    readTime: '6 min read',
    date: 'Sep 12, 2026',
    author: {
      name: 'Royal Spice Tech Team',
      role: 'Core Architects',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Build complex, hierarchical menus in seconds. Support for dish variants (Half/Full), add-ons (Extra Cheese), and custom kitchen instructions.',
    tags: ['Menu Design', 'Modifiers', 'Variants', 'UX'],
    content: \`
### Beyond the Flat List

A restaurant menu isn't just a list of names and prices. It's a complex matrix of sizes, dietary choices, and optional add-ons.

### Menu Architecture:
- **Smart Categorization:** Group items logically (Starters, Tandoor, Beverages) for blazing-fast POS navigation.
- **Variants (Sizes/Types):** Easily configure "Regular" vs "Large" pricing without duplicating items.
- **Modifiers (Add-ons):** Prompt cashiers to upsell "Extra Cheese" or "Add Bacon" with automated price adjustments.
- **Kitchen Routing:** Specify exactly which station (Bar vs Grill) a specific menu item should print/display at.
    \`,
  },
]

const CATEGORIES = ['All', 'Architecture', 'Multi-Tenancy', 'KDS', 'Inventory', 'Floor & Tables', 'Billing & Compliance', 'Analytics', 'Staff', 'CRM', 'Suppliers', 'Menu Engineering']`

content = content.replace(/  \},\n\]\n\nconst CATEGORIES = \['All', 'Architecture', 'Multi-Tenancy', 'KDS', 'Inventory', 'Floor & Tables', 'Billing & Compliance'\]/, "  },\n" + newPosts)

fs.writeFileSync(path, content)
