/**
 * cn - Class name merger
 * Combines clsx and tailwind-merge for safe class handling
 */
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random UUID (fallback for non-crypto environments)
 */
export function generateId() {
  return crypto.randomUUID()
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Check if a value is empty (null, undefined, '', [], {})
 */
export function isEmpty(value) {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {})
}

/**
 * Sum array of objects by key
 */
export function sumBy(array, key) {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

/**
 * Sort array of objects
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Check if string is a valid email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Check if string is valid Indian phone number
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))
}

/**
 * Convert file to base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get color for order status
 */
export function getStatusColor(status) {
  const colors = {
    draft: 'gray',
    pending: 'yellow',
    confirmed: 'blue',
    preparing: 'orange',
    ready: 'purple',
    completed: 'green',
    cancelled: 'red',
    refunded: 'red',
  }
  return colors[status] || 'gray'
}

/**
 * Get color for table status
 */
export function getTableStatusColor(status) {
  const colors = {
    available: 'green',
    occupied: 'red',
    reserved: 'blue',
    billing: 'yellow',
    cleaning: 'purple',
  }
  return colors[status] || 'gray'
}

/**
 * Get label for order type
 */
export function getOrderTypeLabel(type) {
  const labels = {
    dine_in: 'Dine In',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    online: 'Online',
  }
  return labels[type] || type
}
