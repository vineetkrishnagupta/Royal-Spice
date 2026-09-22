import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationStore } from '@/store/useNotificationStore'
import { cn } from '@/utils/helpers'

export default function AppLayout() {
  const { restaurant } = useAuth()
  const { fetchNotifications, subscribeToNotifications, unsubscribe } = useNotificationStore()
  const location = useLocation()
  const isPOS = location.pathname.startsWith('/pos')

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

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
          onToggleDark={() => setDarkMode(v => !v)} 
          onOpenMenu={() => setMobileOpen(true)}
        />
        <main className={cn('flex-1', isPOS ? 'p-0 overflow-hidden' : 'overflow-y-auto p-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
