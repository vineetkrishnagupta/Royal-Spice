const fs = require('fs')
const path = 'src/pages/blog/BlogPage.jsx'
let content = fs.readFileSync(path, 'utf8')

// Add useEffect
if (!content.includes('UseEffectReact')) {
  content = content.replace(
    "export default function BlogPage() {\n  const [selectedCategory, setSelectedCategory]",
    "import { useEffect as UseEffectReact } from 'react'\n\nexport default function BlogPage() {\n  UseEffectReact(() => {\n    const saved = localStorage.getItem('darkMode')\n    const isDark = saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches\n    document.documentElement.classList.toggle('dark', isDark)\n  }, [])\n\n  const [selectedCategory, setSelectedCategory]"
  )
}

const replacements = [
  // Layout and text base
  { regex: /bg-slate-950 text-slate-100/g, replacement: 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100' },
  { regex: /bg-slate-950\/80/g, replacement: 'bg-white/80 dark:bg-slate-950/80' },
  { regex: /border-slate-800/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { regex: /text-white/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
  
  // Undo broken text-white cases
  { regex: /selection:text-slate-900 dark:text-white/g, replacement: 'selection:text-white' },
  { regex: /w-5 h-5 text-slate-900 dark:text-white/g, replacement: 'w-5 h-5 text-white' },
  { regex: /bg-primary-600 hover:bg-primary-500 text-slate-900 dark:text-white/g, replacement: 'bg-primary-600 hover:bg-primary-500 text-white' },
  
  // Hero gradient
  { regex: /bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950/g, replacement: 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950' },
  
  // Cards and background slate-900
  { regex: /bg-slate-900\/70/g, replacement: 'bg-white/70 dark:bg-slate-900/70' },
  { regex: /bg-slate-900/g, replacement: 'bg-white dark:bg-slate-900' },
  
  // Undo specific card things
  { regex: /hover:bg-white dark:bg-slate-900/g, replacement: 'hover:bg-slate-50 dark:hover:bg-slate-900' },
  { regex: /bg-slate-950/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
  
  // Undo where we double changed bg-slate-950
  { regex: /bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
  { regex: /bg-white\/80 dark:bg-slate-50 dark:bg-slate-950\/80/g, replacement: 'bg-white/80 dark:bg-slate-950/80' }
]

for (const {regex, replacement} of replacements) {
  content = content.replace(regex, replacement)
}

fs.writeFileSync(path, content)
