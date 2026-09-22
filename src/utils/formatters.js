import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns'

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount, options = {}) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.decimals ?? 2,
    maximumFractionDigits: options.decimals ?? 2,
    ...options,
  }).format(value)
}

/**
 * Format a number with Indian number system commas
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

/**
 * Format date for display
 */
export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, fmt)
  } catch {
    return '—'
  }
}

/**
 * Format date + time
 */
export function formatDateTime(dateStr) {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a')
}

/**
 * Format time only
 */
export function formatTime(dateStr) {
  return formatDate(dateStr, 'hh:mm a')
}

/**
 * Relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true })
    if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`
    return formatDate(dateStr)
  } catch {
    return '—'
  }
}

/**
 * Format order number with prefix
 */
export function formatOrderNumber(num, prefix = 'ORD') {
  return `${prefix}-${String(num).padStart(4, '0')}`
}

/**
 * Format phone number for India (+91)
 */
export function formatPhone(phone) {
  if (!phone) return '—'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, length = 40) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  return `${(Number(value) || 0).toFixed(decimals)}%`
}

/**
 * Get initials from name
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
}

/**
 * Duration in minutes as human readable
 */
export function formatDuration(minutes) {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
