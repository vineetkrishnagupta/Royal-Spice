import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, ClipboardList, Grid3x3,
  ChefHat, UtensilsCrossed, Package, Users, UserCircle,
  BarChart3, Truck, Settings, ChevronLeft, ChevronRight,
  Flame, BookOpen,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/tables', icon: Grid3x3, label: 'Tables' },
  { path: '/kitchen', icon: ChefHat, label: 'Kitchen' },
  { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/staff', icon: UserCircle, label: 'Staff' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/blog', icon: BookOpen, label: 'Blog & Docs' },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, closeMobile }) {
  const { restaurant } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden animate-fade-in" 
          onClick={closeMobile} 
        />
      )}

      <aside className={cn(
        'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out',
        'fixed inset-y-0 left-0 z-50 md:relative',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'w-16' : 'w-60',
      )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0',
        collapsed && 'justify-center px-2',
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Flame className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              {restaurant?.name || 'Royal Spice'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">POS System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-0.5">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            onClick={() => closeMobile && closeMobile()}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              collapsed ? 'justify-center px-2' : '',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
            )}
          >
            <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="px-2 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  )
}
