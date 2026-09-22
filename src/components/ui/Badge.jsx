import { cn } from '@/utils/helpers'

const colors = {
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

export default function Badge({ children, color = 'gray', className, dot = false }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      colors[color] || colors.gray,
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const config = {
    draft: { color: 'gray', label: 'Draft' },
    pending: { color: 'yellow', label: 'Pending' },
    confirmed: { color: 'blue', label: 'Confirmed' },
    preparing: { color: 'orange', label: 'Preparing' },
    ready: { color: 'purple', label: 'Ready' },
    completed: { color: 'green', label: 'Completed' },
    cancelled: { color: 'red', label: 'Cancelled' },
    refunded: { color: 'red', label: 'Refunded' },
    // Table statuses
    available: { color: 'green', label: 'Available' },
    occupied: { color: 'red', label: 'Occupied' },
    reserved: { color: 'blue', label: 'Reserved' },
    billing: { color: 'yellow', label: 'Billing' },
    cleaning: { color: 'purple', label: 'Cleaning' },
    // Payment
    cash: { color: 'green', label: 'Cash' },
    card: { color: 'blue', label: 'Card' },
    upi: { color: 'purple', label: 'UPI' },
    online: { color: 'teal', label: 'Online' },
    wallet: { color: 'orange', label: 'Wallet' },
  }

  const { color, label } = config[status] || { color: 'gray', label: status }
  return <Badge color={color} dot>{label}</Badge>
}
