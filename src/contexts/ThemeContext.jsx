import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ─── Preset Color Palettes ───────────────────────────────────────────────────
export const COLOR_THEMES = [
  {
    id: 'orange',
    name: 'Royal Spice',
    description: 'Classic warm orange',
    colors: {
      50: '#fef3ec', 100: '#fde4d0', 200: '#fbc7a1', 300: '#f9a172',
      400: '#f77b43', 500: '#f55514', 600: '#d4440f', 700: '#b0360b',
      800: '#8c2a09', 900: '#701f07', 950: '#3d0e03',
    },
  },
  {
    id: 'violet',
    name: 'Midnight Violet',
    description: 'Deep purple elegance',
    colors: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
      400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
      800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
    },
  },
  {
    id: 'rose',
    name: 'Cherry Blossom',
    description: 'Vibrant pink-red',
    colors: {
      50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
      400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
      800: '#9f1239', 900: '#881337', 950: '#4c0519',
    },
  },
  {
    id: 'emerald',
    name: 'Forest Green',
    description: 'Fresh and natural',
    colors: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
      400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
      800: '#065f46', 900: '#064e3b', 950: '#022c22',
    },
  },
  {
    id: 'sky',
    name: 'Ocean Blue',
    description: 'Cool and professional',
    colors: {
      50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
      400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
      800: '#075985', 900: '#0c4a6e', 950: '#082f49',
    },
  },
  {
    id: 'amber',
    name: 'Golden Hour',
    description: 'Warm amber glow',
    colors: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
      800: '#92400e', 900: '#78350f', 950: '#451a03',
    },
  },
  {
    id: 'slate',
    name: 'Graphite',
    description: 'Minimal monochrome',
    colors: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a', 950: '#020617',
    },
  },
  {
    id: 'custom',
    name: 'Custom Color',
    description: 'Pick your own color',
    colors: null,
  },
]

// ─── Utility: Generate palette shades from a hex color ────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function generatePaletteFromHex(hex) {
  const [h, s] = hexToHsl(hex)
  return {
    50: hslToHex(h, Math.min(s, 95), 95),
    100: hslToHex(h, Math.min(s, 90), 90),
    200: hslToHex(h, Math.min(s, 85), 80),
    300: hslToHex(h, s, 68),
    400: hslToHex(h, s, 58),
    500: hex,
    600: hslToHex(h, s, 38),
    700: hslToHex(h, s, 30),
    800: hslToHex(h, s, 22),
    900: hslToHex(h, s, 16),
    950: hslToHex(h, s, 9),
  }
}

// ─── Apply CSS variables to :root ─────────────────────────────────────────────
function applyColorTheme(colors) {
  const root = document.documentElement
  Object.entries(colors).forEach(([shade, hex]) => {
    // Convert hex to rgb triplet for Tailwind compatibility
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    root.style.setProperty(`--color-primary-${shade}`, `${r} ${g} ${b}`)
  })
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    const mode = localStorage.getItem('themeMode') || 'system'
    if (mode === 'light') return false
    if (mode === 'dark') return true
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'system')
  const [colorThemeId, setColorThemeId] = useState(() => localStorage.getItem('colorTheme') || 'orange')
  const [customColor, setCustomColor] = useState(() => localStorage.getItem('customColor') || '#f55514')

  // Resolve effective dark mode from system
  const resolvedDark = useCallback((mode) => {
    if (mode === 'dark') return true
    if (mode === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  // Listen to system theme changes when mode is 'system'
  useEffect(() => {
    if (themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setDarkMode(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  // Apply color theme CSS variables
  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.id === colorThemeId)
    let colors
    if (colorThemeId === 'custom') {
      colors = generatePaletteFromHex(customColor)
    } else {
      colors = theme?.colors
    }
    if (colors) applyColorTheme(colors)
    localStorage.setItem('colorTheme', colorThemeId)
  }, [colorThemeId, customColor])

  const changeThemeMode = (mode) => {
    setThemeMode(mode)
    setDarkMode(resolvedDark(mode))
    localStorage.setItem('themeMode', mode)
  }

  const changeColorTheme = (id) => {
    setColorThemeId(id)
  }

  const changeCustomColor = (hex) => {
    setCustomColor(hex)
    localStorage.setItem('customColor', hex)
    if (colorThemeId === 'custom') {
      applyColorTheme(generatePaletteFromHex(hex))
    }
  }

  return (
    <ThemeContext.Provider value={{
      darkMode, themeMode, colorThemeId, customColor,
      changeThemeMode, changeColorTheme, changeCustomColor,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
