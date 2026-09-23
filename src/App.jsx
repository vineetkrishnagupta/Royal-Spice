import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard, GuestGuard } from '@/components/auth/Guards'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { PageLoader } from '@/components/ui/Skeleton'

// Lazy-loaded pages
const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage       = lazy(() => import('@/pages/auth/SignupPage'))
const ForgotPassword   = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage'))
const POSPage          = lazy(() => import('@/pages/pos/POSPage'))
const OrdersPage       = lazy(() => import('@/pages/orders/OrdersPage'))
const TablesPage       = lazy(() => import('@/pages/tables/TablesPage'))
const KDSPage          = lazy(() => import('@/pages/kitchen/KDSPage'))
const MenuPage         = lazy(() => import('@/pages/menu/MenuPage'))
const ProductFormPage  = lazy(() => import('@/pages/menu/ProductFormPage'))
const InventoryPage    = lazy(() => import('@/pages/inventory/InventoryPage'))
const CustomersPage    = lazy(() => import('@/pages/customers/CustomersPage'))
const StaffPage        = lazy(() => import('@/pages/staff/StaffPage'))
const ReportsPage      = lazy(() => import('@/pages/reports/ReportsPage'))
const SuppliersPage    = lazy(() => import('@/pages/suppliers/SuppliersPage'))
const SettingsPage     = lazy(() => import('@/pages/settings/SettingsPage'))
const BlogPage         = lazy(() => import('@/pages/blog/BlogPage'))

const SuspenseWrap = ({ children }) => (
  <Suspense fallback={<div className="flex items-center justify-center h-full"><PageLoader /></div>}>
    {children}
  </Suspense>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public blog route */}
          <Route path="/blog" element={<SuspenseWrap><BlogPage /></SuspenseWrap>} />

          {/* Auth routes */}
          <Route element={<GuestGuard><AuthLayout /></GuestGuard>}>
            <Route path="/login" element={<SuspenseWrap><LoginPage /></SuspenseWrap>} />
            <Route path="/signup" element={<SuspenseWrap><SignupPage /></SuspenseWrap>} />
            <Route path="/forgot-password" element={<SuspenseWrap><ForgotPassword /></SuspenseWrap>} />
          </Route>

          {/* Protected app routes */}
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/dashboard" element={<SuspenseWrap><DashboardPage /></SuspenseWrap>} />
            <Route path="/pos" element={<SuspenseWrap><POSPage /></SuspenseWrap>} />
            <Route path="/orders" element={<SuspenseWrap><OrdersPage /></SuspenseWrap>} />
            <Route path="/tables" element={<SuspenseWrap><TablesPage /></SuspenseWrap>} />
            <Route path="/kitchen" element={<SuspenseWrap><KDSPage /></SuspenseWrap>} />
            <Route path="/menu" element={<SuspenseWrap><MenuPage /></SuspenseWrap>} />
            <Route path="/menu/product/add" element={<SuspenseWrap><ProductFormPage /></SuspenseWrap>} />
            <Route path="/menu/product/edit/:id" element={<SuspenseWrap><ProductFormPage /></SuspenseWrap>} />
            <Route path="/inventory/*" element={<SuspenseWrap><InventoryPage /></SuspenseWrap>} />
            <Route path="/customers" element={<SuspenseWrap><CustomersPage /></SuspenseWrap>} />
            <Route path="/staff" element={<SuspenseWrap><StaffPage /></SuspenseWrap>} />
            <Route path="/reports" element={<SuspenseWrap><ReportsPage /></SuspenseWrap>} />
            <Route path="/suppliers" element={<SuspenseWrap><SuppliersPage /></SuspenseWrap>} />
            <Route path="/settings/*" element={<SuspenseWrap><SettingsPage /></SuspenseWrap>} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}
