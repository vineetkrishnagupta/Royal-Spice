import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/helpers'

const QUICK_DISCOUNTS = [5, 10, 15, 20, 25, 50]

export default function DiscountModal({ isOpen, onClose }) {
  const { discount, setDiscount, totals } = useCartStore()

  const [type, setType] = useState(discount?.type || 'percentage')
  const [value, setValue] = useState(discount?.value || '')

  const preview = type === 'percentage'
    ? (totals.subtotal * (parseFloat(value) || 0)) / 100
    : parseFloat(value) || 0

  const apply = () => {
    const v = parseFloat(value)
    if (!v || v <= 0) {
      setDiscount(null)
    } else {
      setDiscount({ type, value: v, label: type === 'percentage' ? `${v}%` : `₹${v}` })
    }
    onClose()
  }

  const clear = () => {
    setDiscount(null)
    setValue('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount" size="sm">
      <div className="space-y-5">
        {/* Type selector */}
        <div className="flex gap-2">
          {[{ v: 'percentage', l: 'Percentage (%)' }, { v: 'fixed', l: 'Fixed (₹)' }].map(t => (
            <button
              key={t.v}
              onClick={() => setType(t.v)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors',
                type === t.v
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
              )}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Quick percentages */}
        {type === 'percentage' && (
          <div className="grid grid-cols-6 gap-2">
            {QUICK_DISCOUNTS.map(v => (
              <button
                key={v}
                onClick={() => setValue(String(v))}
                className={cn(
                  'py-2 rounded-lg text-sm font-semibold border-2 transition-colors',
                  value === String(v)
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400',
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        )}

        {/* Manual input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            {type === 'percentage' ? '%' : '₹'}
          </span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Enter discount value"
            min="0"
            max={type === 'percentage' ? 100 : undefined}
            className="input-base pl-8"
            autoFocus
          />
        </div>

        {/* Preview */}
        {preview > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Discount amount</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              −{formatCurrency(preview)}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={clear} fullWidth>Clear</Button>
          <Button onClick={apply} fullWidth>Apply Discount</Button>
        </div>
      </div>
    </Modal>
  )
}
