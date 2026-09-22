# Modern Restaurant POS System

A fully-featured, ultra-modern, and highly responsive Point of Sale (POS) system tailored for restaurants, cafes, and cloud kitchens. Built with a focus on speed, beautiful aesthetics, and seamless mobile responsiveness.

## ✨ Key Features

### 🛒 Next-Gen POS Interface
- **Mobile-First Design:** A fluid layout featuring a swipeable categories bar on mobile and a slide-up floating cart.
- **Lightning Fast Orders:** Quickly add items, adjust quantities, apply discounts, and assign orders to specific tables or customers.
- **Order Types:** Support for Dine-In, Takeaway, and Delivery.
- **Smart Search:** Instantly find menu items with real-time filtering.

### 📊 Comprehensive Dashboard
- **Real-time Analytics:** Track daily revenue, average order value, pending orders, and cash vs UPI/Card sales at a glance.
- **Responsive Sidebar:** Fully responsive slide-in drawer on mobile devices with smooth animations.
- **Theme Support:** Beautiful Dark Mode and Light Mode with system auto-detection and manual overrides.

### 🍔 Menu & Inventory Management
- **Image Cropping:** Built-in image cropper (`react-easy-crop`) ensures perfect square aspect ratios for menu items before saving them (using high-speed Base64 encoding).
- **Categories & Taxes:** Easily manage dynamic categories and multiple tax slabs (e.g. GST).
- **Veg/Non-Veg Indicators:** Visual badges for dietary preferences.

### 🔔 Real-Time Notifications
- **Supabase Realtime:** Instant updates for new orders, kitchen alerts, and low stock warnings without refreshing the page.

## 🛠️ Technology Stack

- **Frontend Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (with native dark mode support)
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Realtime)
- **State Management:** Zustand (for Cart, Notifications, and Settings)
- **Routing:** React Router v6
- **Hosting:** Vercel (with `vercel.json` for SPA rewrites)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vineetkrishnagupta/Royal-Spice.git
   cd Royal-Spice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `config.json` file in the root of the project to securely hold your Supabase credentials (this project explicitly avoids `.env` for configuration as per user preferences):
   ```json
   {
     "VITE_SUPABASE_URL": "your_supabase_url",
     "VITE_SUPABASE_ANON_KEY": "your_supabase_anon_key"
   }
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## 📱 Mobile Responsiveness
This application was meticulously designed to work as well on a 6-inch phone as it does on a 27-inch monitor. 
- The **POS Screen** hides complex menus behind sleek floating action buttons on mobile.
- The **Dashboard** collapses the navigation sidebar into a gesture-friendly drawer.
- Tables and data grids employ horizontal scrolling to prevent layout breakage.

## 📝 Design Philosophy
- **No Emojis:** The UI relies entirely on clean, professional SVG icons (`lucide-react`) for a sleek, premium feel.
- **Vibrant Aesthetics:** carefully chosen color palettes (with a primary brand color), smooth micro-animations, and glassmorphism elements to provide a "Wow" factor.

## 📄 License
This project is proprietary and confidential.
