import { cn } from '@/utils/helpers'
import { getInitials } from '@/utils/formatters'

export default function Avatar({ name, src, size = 'md', className }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }

  const colors = [
    'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  ]

  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
      sizes[size],
      colors[colorIndex],
      className,
    )}>
      {getInitials(name)}
    </div>
  )
}
