import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Search, Clock, Calendar, User, ArrowRight, Tag,
  Sparkles, CheckCircle2, ChevronRight, Layers, Database,
  Cpu, Utensils, ShieldCheck, Flame, ExternalLink, X,
  Bookmark, Share2, Eye, Laptop, ArrowLeft
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils/helpers'

const BLOG_POSTS = [
  {
    id: 'pos-architecture-deep-dive',
    title: 'Architecture Deep Dive: Building an Offline-First, Real-Time POS with React & Supabase',
    slug: 'architecture-deep-dive',
    category: 'Architecture',
    readTime: '6 min read',
    date: 'Sep 22, 2026',
    author: {
      name: 'Royal Spice Tech Team',
      role: 'Core Architects',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    featured: true,
    excerpt: 'Explore how Royal Spice POS combines React 19, Vite, Tailwind CSS, and Supabase PostgreSQL with WebSocket channels to provide sub-100ms order latency, multi-tenant isolation, and zero-downtime billing.',
    tags: ['React 19', 'Supabase', 'PostgreSQL', 'WebSockets', 'TailwindCSS'],
    content: `
### The Vision: Cloud Agility with Desktop Reliability

Restaurant Point of Sale (POS) systems face a brutal operational reality: if the POS freezes during peak dinner rush, the restaurant loses money and frustrates guests. Traditional POS systems relied on bulky on-premise Windows servers with proprietary hardware. 

**Royal Spice POS** bridges the gap by delivering a lightweight, cloud-synchronized web architecture built on **React 19, Vite, Tailwind CSS, and Supabase**.

---

### Core Architectural Pillars

1. **Lightning-Fast Client Bundle:**
   Built using Vite 8 with ES modules and optimized code-splitting. The application bundle weighs under 600KB gzipped and loads in under 1 second on mobile tablets and countertop terminals.

2. **Supabase Realtime Synchronization:**
   PostgreSQL Change Data Capture (CDC) streams database modifications directly to client devices via WebSockets. When a cashier hits "Send Order", the Kitchen Display System (KDS) screen updates in less than 80 milliseconds without polling.

3. **Multi-Tenant Row Level Security (RLS):**
   Every database query is bound to the logged-in user's \`restaurant_id\`. Even in a shared database environment, tenant data is strictly quarantined at the database kernel level.

\`\`\`sql
-- Every tenant query evaluates database-level security
CREATE POLICY "orders_isolation" ON orders FOR ALL
  USING (restaurant_id = get_restaurant_id());
\`\`\`

---

### Frontend State Architecture with Zustand

Rather than burdening the React render tree with bloated Redux boilerplate, Royal Spice uses lightweight **Zustand stores**:
- \`useCartStore\`: Manages fast in-memory item additions, modifiers, discounts, and real-time tax recalculation.
- \`useNotificationStore\`: Handles kitchen alerts, low-stock warnings, and order status audio triggers.

### The Result
A resilient POS engine capable of processing thousands of daily transactions with zero latency hiccups.
    `,
  },
  {
    id: 'multi-tenancy-saas-engine',
    title: 'Multi-Tenant SaaS Engine: Instant Restaurant Provisioning on Signup',
    slug: 'multi-tenant-saas-engine',
    category: 'Multi-Tenancy',
    readTime: '5 min read',
    date: 'Sep 21, 2026',
    author: {
      name: 'Vineet Gupta',
      role: 'Lead Developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'How dynamic database triggers and PL/pgSQL security-definer procedures auto-generate unique restaurants, branches, tax rules, and menu categories in under 200ms.',
    tags: ['Database Triggers', 'PL/pgSQL', 'SaaS', 'Security'],
    content: `
### True Self-Serve Multi-Tenancy

Most POS platforms require manual sales onboarding and database seeding by administrators before a restaurant can take its first order. 

Royal Spice POS introduces **Instant Dynamic Provisioning**:
When a restaurant owner fills out the signup form, a single atomic database procedure executes:

1. **New Restaurant Entity:** Automatically creates a unique \`restaurant_id\` with GSTIN and currency settings.
2. **Main Branch & Location:** Auto-configures the primary operating branch with default receipt templates.
3. **Starter Menu & Taxes:** Inserts GST 5% tax rules, starter categories (*Starters, Main Course, Beverages, Desserts*), and starter menu items.
4. **Floor Layout & Tables:** Provisions tables \`T-01\`, \`T-02\`, \`T-03\` with seating capacity.
5. **Owner Profile Creation:** Associates the new authentication UID with full administrative permissions.

---

### Zero Administrative Friction
Because the setup is handled atomically via PostgreSQL triggers, the owner signs up and lands directly in an operational POS ready to bill customers immediately.
    `,
  },
  {
    id: 'kitchen-display-system-kds',
    title: 'Eliminating Paper Tickets: The Real-Time Kitchen Display System (KDS)',
    slug: 'kitchen-display-system-kds',
    category: 'KDS',
    readTime: '4 min read',
    date: 'Sep 20, 2026',
    author: {
      name: 'Chef Rajesh Sharma',
      role: 'Culinary Operations',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Say goodbye to dropped tickets and miscommunication. Explore how the KDS module streams orders by preparation station with live timers and status updates.',
    tags: ['Kitchen Automation', 'KDS', 'Live Timers', 'Audio Alerts'],
    content: `
### The Chaos of Traditional Kitchen Printing

Paper kitchen printers jam, run out of ribbon during rush hour, and make it impossible to measure actual cooking times.

### The Royal Spice KDS Solution:
- **Station-Based Routing:** Filter tickets by Bar, Grill, Tandoor, or Main Kitchen stations.
- **Color-Coded Timers:** 
  - Normal: Orders under 10 minutes.
  - Warning: Orders approaching threshold (10–15 mins).
  - Overdue: Flashing red alert for orders exceeding 15 minutes.
- **Real-Time Bumping:** Kitchen staff tap once to move items to "Preparing", and tap again when "Ready to Serve".
- **Real-Time Waiter Sync:** The waiter's handheld device vibrates the instant the dish is marked ready.
    `,
  },
  {
    id: 'smart-inventory-recipe-costing',
    title: 'Automated Inventory & Recipe Costing: Protecting Your 30% Food Cost',
    slug: 'smart-inventory-recipe-costing',
    category: 'Inventory',
    readTime: '5 min read',
    date: 'Sep 19, 2026',
    author: {
      name: 'Priya Mehta',
      role: 'Financial Analyst',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Connect menu sales directly to raw material stocks. Automatically deduct flour, cheese, and chicken in grams the second an order is completed.',
    tags: ['Inventory', 'Recipe Costing', 'Waste Management', 'Margin Analysis'],
    content: `
### Stop Guessing Food Cost Margins

The restaurant business runs on paper-thin margins. Unmonitored wastage, theft, and portion inconsistency can eat up 5-10% of total revenue.

### How Recipe Linking Works:
1. **Raw Material Stock:** Log purchases in bulk units (e.g. 50 kg Flour, 20 kg Paneer).
2. **Recipe Bill of Materials (BOM):** Link 200g of Paneer and 50g of Spices to every "Paneer Tikka" dish.
3. **Automated Depletion:** When the bill is paid, the stock automatically subtracts exact recipe portions.
4. **Low Stock Warnings:** Terminal notifications flag when essential ingredients fall below threshold before the kitchen runs out.
    `,
  },
  {
    id: 'table-management-floor-planner',
    title: 'Floor Plan Management: Live Occupancy, Bill Splitting & Turn Time Optimization',
    slug: 'table-management-floor-planner',
    category: 'Floor & Tables',
    readTime: '4 min read',
    date: 'Sep 18, 2026',
    author: {
      name: 'Arjun Verma',
      role: 'Operations Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Visualize your entire restaurant floor across multiple levels (Ground Floor, Rooftop, Patio). Track live statuses from Available to Occupied, Billing, and Cleaning.',
    tags: ['Table Layout', 'Floor Plan', 'Table Turns', 'Bill Splitting'],
    content: `
### Maximize Cover Turns and Table Utilization

Managing 20-50 tables across multiple floors during Saturday night service requires immediate visual clarity.

### Features Highlight:
- **Status Color Coding:**
  - Available: Table is sanitized and ready to seat.
  - Occupied: Active diners with ongoing orders.
  - Billing: Guests have requested the bill.
  - Cleaning: Diners left, pending busser cleaning.
- **Multi-Floor Support:** Switch effortlessly between Ground Dining, VIP Lounge, and Rooftop Bar.
- **Drag-and-Drop Table Merging:** Combine adjacent tables for large wedding parties and corporate dinners.
    `,
  },
  {
    id: 'gst-invoicing-cash-management',
    title: 'Indian GST Compliance & Multi-Modal Payment Processing in POS',
    slug: 'gst-invoicing-cash-management',
    category: 'Billing & Compliance',
    readTime: '5 min read',
    date: 'Sep 17, 2026',
    author: {
      name: 'CA Alok Soni',
      role: 'Tax & Compliance Advisor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
    featured: false,
    excerpt: 'Compliant tax invoices with CGST, SGST, Cess calculations, thermal receipt printing (58mm/80mm), UPI QR codes, and day-end shift register reconciliations.',
    tags: ['GST Compliance', 'Tax Invoicing', 'UPI Payments', 'Cash Register'],
    content: `
### Stress-Free Indian Tax & GST Billing

Generating legally compliant tax receipts in India requires strict adhesion to GST rules:

- **Bifurcated Tax Breakdown:** Automatic CGST (2.5%) and SGST (2.5%) split for dining and takeaway.
- **Thermal Printer Friendly:** Formatted for standard 80mm and 58mm POS thermal ESC/POS printers.
- **Dynamic UPI QR Code:** Generates instant UPI dynamic payment codes directly on the bill for seamless customer scanning.
- **Shift Drawer Reconciliations:** Cash-in / Cash-out tracking with float management prevents end-of-day register discrepancies.
    `,
  },
  {
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
    content: `
### Stop Flying Blind

A modern restaurant generates thousands of data points daily. Without an intuitive dashboard, owners are guessing which menu items are actually profitable.

### Real-Time Insights Include:
- **Live Sales Tracking:** Watch today's revenue tick up the second a bill is paid.
- **Item Popularity Matrix:** Instantly identify your best-sellers vs. dead inventory.
- **Peak Hour Analysis:** Know exactly when to schedule extra staff for the weekend dinner rush.
- **Exportable Reports:** One-click CSV exports for accounting and tax reconciliation.
    `,
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
    content: `
### Guarding the Cash Drawer

Not everyone needs the ability to open the cash drawer or apply a 100% discount. 

### Granular Staff Controls:
- **Role-Based Access (RBAC):** Define explicit permissions for Cashiers, Waiters, Managers, and Admins.
- **Action Logs:** Every voided item, applied discount, and cash drawer opening is logged and tied to a specific staff ID.
- **Fast User Switching:** Staff can instantly switch accounts at a shared terminal using 4-digit PINs without fully logging out.
    `,
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
    content: `
### The Power of Personalization

"The usual, Mr. Patel?" - That level of service shouldn't rely solely on a waiter's memory.

### CRM Features:
- **Guest Profiles:** Capture phone numbers, emails, and birthdays during checkout.
- **Order History:** Instantly pull up a customer's past visits and favorite dishes.
- **Lifetime Value Tracking:** Identify your top 10% highest-spending guests for VIP treatment.
- **Dietary Notes:** Flag allergies permanently on a guest profile so the kitchen is automatically alerted on every future order.
    `,
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
    content: `
### Chaos in the Back Office

Managing raw material procurement via WhatsApp messages and paper receipts leads to missing stock and unpaid vendor disputes.

### The Supplier Hub:
- **Centralized Vendor List:** Keep all supplier contacts, tax IDs, and payment terms in one place.
- **Purchase Order Tracking:** Log what was ordered vs. what was actually received at the loading dock.
- **Cost Fluctuation Monitoring:** Track the historical price of raw materials (e.g., tomatoes, cooking oil) to anticipate margin impacts.
    `,
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
    content: `
### Beyond the Flat List

A restaurant menu isn't just a list of names and prices. It's a complex matrix of sizes, dietary choices, and optional add-ons.

### Menu Architecture:
- **Smart Categorization:** Group items logically (Starters, Tandoor, Beverages) for blazing-fast POS navigation.
- **Variants (Sizes/Types):** Easily configure "Regular" vs "Large" pricing without duplicating items.
- **Modifiers (Add-ons):** Prompt cashiers to upsell "Extra Cheese" or "Add Bacon" with automated price adjustments.
- **Kitchen Routing:** Specify exactly which station (Bar vs Grill) a specific menu item should print/display at.
    `,
  },
]

const CATEGORIES = ['All', 'Architecture', 'Multi-Tenancy', 'KDS', 'Inventory', 'Floor & Tables', 'Billing & Compliance', 'Analytics', 'Staff', 'CRM', 'Suppliers', 'Menu Engineering']

import { useEffect as UseEffectReact } from 'react'

export default function BlogPage() {
  UseEffectReact(() => {
    const saved = localStorage.getItem('darkMode')
    const isDark = saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeArticle, setActiveArticle] = useState(null)

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchCategory = selectedCategory === 'All' || post.category === selectedCategory
      const matchSearch = searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchQuery])

  const featuredPost = BLOG_POSTS.find(p => p.featured) || BLOG_POSTS[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-500 selection:text-white">
      {/* Top Bar / Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Royal Spice <span className="text-primary-500">Chronicle</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-mono uppercase tracking-wider">POS Tech Journal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 hover:text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors"
            >
              <Laptop className="w-3.5 h-3.5 text-primary-400" />
              Open POS Terminal
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-sm transition-all"
            >
              Sign Up Free
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner (Magazine Cover Style) */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Project Documentation & Insights
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Inside Royal Spice POS: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-amber-300 to-primary-500">Engineering Modern Restaurant Tech</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              Explore in-depth design systems, cloud architecture, real-time kitchen orchestration, multi-tenancy, and inventory costing powering next-generation dining operations.
            </p>
          </div>

          {/* Search & Category Pills */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    selectedCategory === cat
                      ? 'bg-primary-600 text-slate-900 dark:text-white shadow-sm shadow-primary-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search articles, tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Posts Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Featured Post Highlight Card */}
            {selectedCategory === 'All' && !searchQuery && (
              <article 
                onClick={() => setActiveArticle(featuredPost)}
                className="group cursor-pointer rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 p-6 sm:p-8 transition-all hover:shadow-2xl hover:shadow-primary-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-primary-500/15 transition-all" />
                
                <div className="flex items-center gap-3 text-xs mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-semibold uppercase tracking-wider text-[10px]">
                    Featured Story
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500 dark:text-slate-400">{featuredPost.category}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary-400 transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-800"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{featuredPost.author.role}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-400 group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            )}

            {/* Standard Article Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredPosts.map(post => (
                <article
                  key={post.id}
                  onClick={() => setActiveArticle(post)}
                  className="group cursor-pointer flex flex-col justify-between rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90 hover:border-slate-700 p-5 transition-all hover:bg-slate-50 dark:hover:bg-slate-900 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-primary-400 font-medium text-[11px] uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate max-w-[110px]">
                        {post.author.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {post.date}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">No articles found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try refining your search query or selecting "All" categories.</p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery('') }}
                  className="mt-4 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Right Column: WordPress Style Widgets (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Project Overview Widget */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500" />
                About Royal Spice POS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                A full-stack, multi-tenant cloud POS platform engineered for fine-dining restaurants, cloud kitchens, and cafes.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">DB Tables</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">32 Schema</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Sync Latency</p>
                  <p className="text-lg font-bold text-emerald-400">&lt; 80 ms</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Multi-Tenant</p>
                  <p className="text-lg font-bold text-primary-400">Postgres RLS</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Compliance</p>
                  <p className="text-lg font-bold text-amber-400">GST 5/12%</p>
                </div>
              </div>
            </div>

            {/* Quick Terminal Launch Widget */}
            <div className="rounded-xl bg-gradient-to-br from-primary-50 to-slate-100 dark:from-primary-950/60 dark:to-slate-900 border border-primary-500/20 p-5">
              <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4" /> Live POS Demo
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Ready to test the interface?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Launch the terminal to test quick billing, dine-in table ordering, and kitchen ticket dispatching.
              </p>
              <div className="mt-4 space-y-2">
                <Link to="/pos" className="block w-full">
                  <Button fullWidth size="sm" className="text-xs">
                    Launch POS Terminal
                  </Button>
                </Link>
                <Link to="/kitchen" className="block w-full">
                  <Button fullWidth variant="outline" size="sm" className="text-xs border-slate-700 text-slate-700 dark:text-slate-300">
                    Open Kitchen Display (KDS)
                  </Button>
                </Link>
              </div>
            </div>

            {/* Popular Topics / Tags Widget */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary-500" />
                Key Technologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {['React 19', 'Vite 8', 'Supabase Realtime', 'PostgreSQL RLS', 'Tailwind CSS', 'Zustand', 'Recharts', 'ESC/POS', 'GST Invoicing', 'KDS'].map(tech => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono hover:border-slate-700 transition-colors"
                  >
                    #{tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Newsletter / RSS Subscribe Widget */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 text-center">
              <BookOpen className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Subscribe to POS Releases</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get updates on new POS features, barcode scanners, and inventory models.</p>
              <div className="mt-3 flex gap-1.5">
                <input
                  type="email"
                  placeholder="name@restaurant.com"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  onClick={() => alert('Thank you for subscribing!')}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-xs text-slate-900 dark:text-white font-semibold transition-colors"
                >
                  Join
                </button>
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* Reader Modal (Full Blog Article View) */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setActiveArticle(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to all articles
              </button>

              <button
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-10 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-xs mb-4">
                <Badge color="orange">{activeArticle.category}</Badge>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500 dark:text-slate-400">{activeArticle.date}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-500 dark:text-slate-400">{activeArticle.readTime}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {activeArticle.title}
              </h1>

              {/* Author Strip */}
              <div className="mt-5 pb-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeArticle.author.avatar}
                    alt={activeArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{activeArticle.author.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeArticle.author.role}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!') }}
                    className="p-2 rounded-lg bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
                    title="Share article"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Formatted Article Body */}
              <div className="mt-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
                {activeArticle.content.split('\n\n').map((para, index) => {
                  if (para.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-bold text-slate-900 dark:text-white pt-4">{para.replace('### ', '')}</h3>
                  }
                  if (para.startsWith('1. ') || para.startsWith('- ')) {
                    return (
                      <div key={index} className="pl-4 border-l-2 border-primary-500/40 space-y-1 text-slate-700 dark:text-slate-300">
                        {para.split('\n').map((line, lIdx) => (
                          <p key={lIdx} className="text-sm">{line}</p>
                        ))}
                      </div>
                    )
                  }
                  if (para.startsWith('```')) {
                    return (
                      <pre key={index} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-primary-300 overflow-x-auto">
                        {para.replace(/```[a-z]*/g, '')}
                      </pre>
                    )
                  }
                  if (para.trim() === '---') {
                    return <hr key={index} className="border-slate-200 dark:border-slate-800 my-6" />
                  }
                  return <p key={index} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{para}</p>
                })}
              </div>

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                {activeArticle.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Bottom CTA in Modal */}
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary-950/40 via-slate-950 to-slate-950 border border-primary-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Experience Royal Spice POS Live</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Explore the live terminal, orders board, and analytics.</p>
                </div>
                <Link to="/dashboard" onClick={() => setActiveArticle(null)}>
                  <Button size="sm" className="text-xs">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Royal Spice POS Systems. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-slate-700 dark:text-slate-300 transition-colors">POS Terminal</Link>
            <Link to="/kitchen" className="hover:text-slate-700 dark:text-slate-300 transition-colors">Kitchen Display</Link>
            <Link to="/signup" className="hover:text-slate-700 dark:text-slate-300 transition-colors">Register Restaurant</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
