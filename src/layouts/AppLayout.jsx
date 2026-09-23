import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/utils/helpers'
import { useEffect } from 'react'

export default function AppLayout() {
  const { restaurant } = useAuth()
  const { fetchNotifications, subscribeToNotifications, unsubscribe } = useNotificationStore()
  const { darkMode, themeMode, changeThemeMode } = useTheme()
  const location = useLocation()
  const isPOS = location.pathname.startsWith('/pos')

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Subscribe to notifications
  useEffect(() => {
    if (!restaurant?.id) return
    fetchNotifications(restaurant.id)
    const sub = subscribeToNotifications(restaurant.id)
    return () => unsubscribe()
  }, [restaurant?.id])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - completely hidden on POS view */}
      {!isPOS && (
        <Sidebar 
          collapsed={collapsed} 
          onToggle={() => setCollapsed(v => !v)} 
          mobileOpen={mobileOpen}
          closeMobile={() => setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header 
          darkMode={darkMode} 
          onToggleDark={() => changeThemeMode(darkMode ? 'light' : 'dark')} 
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className={cn('flex-1', isPOS ? 'p-0 overflow-hidden' : 'overflow-y-auto p-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
