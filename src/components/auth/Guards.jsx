import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui/Skeleton'

export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export function GuestGuard({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export function PermissionGuard({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return fallback
  return children
}
