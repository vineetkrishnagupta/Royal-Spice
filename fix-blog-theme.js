const fs = require('fs')
const path = 'src/pages/blog/BlogPage.jsx'
let content = fs.readFileSync(path, 'utf8')

// Replace body background
content = content.replace(/bg-slate-950 text-slate-100/g, 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100')

// Replace headers and top bar
content = content.replace(/bg-slate-950\/80 backdrop-blur-md border-b border-slate-800/g, 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800')

// Replace general text-white to text-slate-900 dark:text-white
// Wait, we need to be careful with text-white on buttons/gradients
// Let's replace specific patterns
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white')
// Revert text-white for known buttons/gradients
content = content.replace(/text-slate-900 dark:text-white group-hover:text-primary-400/g, 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400')
content = content.replace(/bg-primary-600 hover:bg-primary-500 text-slate-900 dark:text-white/g, 'bg-primary-600 hover:bg-primary-500 text-white')
content = content.replace(/selection:text-slate-900 dark:text-white/g, 'selection:text-white')

// Hero Banner
content = content.replace(/bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950/g, 'bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950')
content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-800')

// Text slate 400 (secondary text) -> text-slate-600 dark:text-slate-400
content = content.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400')

// text-slate-500 -> text-slate-500 dark:text-slate-500

// bg-slate-900 -> bg-white dark:bg-slate-900
content = content.replace(/bg-slate-900/g, 'bg-white dark:bg-slate-900')
content = content.replace(/bg-slate-950/g, 'bg-slate-50 dark:bg-slate-950')

// Modal/Cards
content = content.replace(/bg-white dark:bg-slate-900\/70/g, 'bg-white dark:bg-slate-900/70')

// Article cards
content = content.replace(/hover:bg-white dark:bg-slate-900/g, 'hover:bg-slate-50 dark:hover:bg-slate-900')

// text-slate-300
content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300')

// Add useEffect to BlogPage
content = content.replace(
  "export default function BlogPage() {\n  const [selectedCategory, setSelectedCategory]",
  "import { useEffect as UseEffectReact } from 'react'\n\nexport default function BlogPage() {\n  UseEffectReact(() => {\n    const saved = localStorage.getItem('darkMode')\n    const isDark = saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches\n    document.documentElement.classList.toggle('dark', isDark)\n  }, [])\n\n  const [selectedCategory, setSelectedCategory]"
)

// Revert button text-white
content = content.replace(/w-5 h-5 text-slate-900 dark:text-white/g, 'w-5 h-5 text-white')

fs.writeFileSync(path, content)
