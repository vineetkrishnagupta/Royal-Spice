import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, LogOut, User, ChevronDown, Building2, Search, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationStore } from '@/store/useNotificationStore'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/helpers'

export default function Header({ darkMode, onToggleDark }) {
  const { profile, restaurant, branch, signOut, switchBranch } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isPOS = location.pathname.startsWith('/pos')

  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const notifTypeIcon = (type) => {
    const icons = {
      new_order: '🛒',
      low_stock: '⚠️',
      order_ready: '✅',
      payment: '💰',
      system: 'ℹ️',
    }
    return icons[type] || '🔔'
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      {/* Left: Branch + Date */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {branch?.name || restaurant?.name || 'Royal Spice'}
          </span>
        </div>
        <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500">
          {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' · '}
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* POS Quick Navigation Button */}
        {isPOS ? (
          <button
            id="header-exit-pos-btn"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700 mr-1"
            title="Exit POS to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        ) : (
          <button
            id="header-pos-btn"
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-semibold text-xs shadow-sm hover:shadow transition-all duration-150 active:scale-95 mr-1 group"
            title="Open POS Terminal"
          >
            <ShoppingCart className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span>POS</span>
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            id="notifications-btn"
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 animate-slide-down overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead(restaurant?.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 15).map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
                        !n.is_read && 'bg-primary-50/50 dark:bg-primary-900/10',
                      )}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg flex-shrink-0">{notifTypeIcon(n.type)}</span>
                        <div className="min-w-0">
                          <p className={cn('text-xs font-medium', n.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100')}>
                            {n.title}
                          </p>
                          {n.message && <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            id="profile-menu-btn"
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar name={profile?.name} src={profile?.avatar_url} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-none">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{profile?.role || 'Staff'}</p>
            </div>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 card shadow-xl z-50 py-1 animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile?.name}</p>
                <p className="text-xs text-slate-400">{profile?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings/profile'); setShowProfile(false) }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 mt-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
