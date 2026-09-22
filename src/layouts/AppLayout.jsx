import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function AppLayout() {
  const { restaurant } = useAuth()
  const { fetchNotifications, subscribeToNotifications, unsubscribe } = useNotificationStore()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
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
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
