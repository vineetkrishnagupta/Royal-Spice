import { useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn, debounce } from '@/utils/helpers'

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  id,
}) {
  const inputRef = useRef(null)

  const debouncedChange = useCallback(
    debounce((val) => onChange(val), debounceMs),
    [onChange, debounceMs]
  )

  const handleChange = (e) => {
    debouncedChange(e.target.value)
  }

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = ''
    if (onClear) onClear()
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        id={id}
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        defaultValue={value}
        onChange={handleChange}
        className="input-base pl-9 pr-8"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
