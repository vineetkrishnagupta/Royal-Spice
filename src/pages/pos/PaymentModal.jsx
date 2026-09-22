import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency } from '@/utils/formatters'
import { calcChange, calcRemaining } from '@/utils/calculations'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'
import { Plus, X, Check, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'online', label: 'Online' },
  { value: 'wallet', label: 'Wallet' },
]

export default function PaymentModal({ isOpen, onClose }) {
  const { restaurant, profile } = useAuth()
  const cart = useCartStore()
  const navigate = useNavigate()

  const [payments, setPayments] = useState([{ method: 'cash', amount: '' }])
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const total = cart.totals.finalTotal
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const remaining = Math.max(0, total - totalPaid)
  const change = Math.max(0, totalPaid - total)

  const addPaymentRow = () => {
    setPayments(prev => [...prev, { method: 'cash', amount: '' }])
  }

  const removePaymentRow = (i) => {
    setPayments(prev => prev.filter((_, idx) => idx !== i))
  }

  const updatePayment = (i, field, value) => {
    setPayments(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const setExactAmount = (i) => {
    setPayments(prev => prev.map((p, idx) =>
      idx === i ? { ...p, amount: String(remaining || total) } : p
    ))
  }

  const handleComplete = async () => {
    if (remaining > 0.01) {
      toast.error(`Still ₹${remaining.toFixed(2)} pending`)
      return
    }
    setProcessing(true)
    try {
      // Generate invoice number
      const invoiceNo = `${restaurant?.id?.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`

      // Create / update order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: cart.orderId || undefined,
          restaurant_id: restaurant.id,
          type: cart.orderType,
          status: 'completed',
          table_id: cart.tableId || null,
          customer_id: cart.customerId || null,
          cashier_id: profile?.id,
          subtotal: cart.totals.subtotal,
          discount_type: cart.discount?.type || null,
          discount_value: cart.discount?.value || 0,
          discount_amount: cart.totals.discountAmount,
          tax_amount: cart.totals.taxAmount,
          cgst: cart.totals.cgst,
          sgst: cart.totals.sgst,
          service_charge: cart.totals.serviceCharge,
          round_off: cart.totals.roundOff,
          total: cart.totals.finalTotal,
          notes: cart.notes,
          invoice_number: invoiceNo,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Delete old items if updating
      await supabase.from('order_items').delete().eq('order_id', order.id)

      // Insert order items
      const itemInserts = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
        notes: item.notes,
        status: 'served',
      }))
      await supabase.from('order_items').insert(itemInserts)

      // Insert payments
      const paymentInserts = payments
        .filter(p => parseFloat(p.amount) > 0)
        .map(p => ({
          order_id: order.id,
          restaurant_id: restaurant.id,
          method: p.method,
          amount: parseFloat(p.amount),
          status: 'completed',
          paid_at: new Date().toISOString(),
        }))
      await supabase.from('payments').insert(paymentInserts)

      // Create kitchen order
      await supabase.from('kitchen_orders').insert({
        order_id: order.id,
        restaurant_id: restaurant.id,
        status: 'new',
      })

      // Create invoice record
      await supabase.from('invoices').insert({
        order_id: order.id,
        restaurant_id: restaurant.id,
        invoice_number: invoiceNo,
        data: {
          order,
          items: cart.items,
          totals: cart.totals,
          payments: paymentInserts,
          restaurant: restaurant,
        },
      })

      // Create notification
      await supabase.from('notifications').insert({
        restaurant_id: restaurant.id,
        type: 'new_order',
        title: `New Order #${order.order_number}`,
        message: `${formatCurrency(order.total)} — ${cart.orderType}`,
        data: { order_id: order.id },
      })

      setCompleted(true)
      toast.success('Payment completed!')
      cart.clearCart()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    setCompleted(false)
    setPayments([{ method: 'cash', amount: '' }])
    onClose()
  }

  if (completed) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Complete!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Order has been saved successfully</p>
          </div>
          {change > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Change to return</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={handleClose}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button fullWidth onClick={handleClose}>
              New Order
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Payment" size="md">
      <div className="space-y-5">
        {/* Order Total */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Payment rows */}
        <div className="space-y-3">
          {payments.map((payment, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={payment.method}
                onChange={e => updatePayment(i, 'method', e.target.value)}
                className="input-base w-32 flex-shrink-0"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  value={payment.amount}
                  onChange={e => updatePayment(i, 'amount', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="input-base pl-7"
                />
              </div>
              <button
                onClick={() => setExactAmount(i)}
                className="text-xs px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 transition-colors whitespace-nowrap"
              >
                Exact
              </button>
              {payments.length > 1 && (
                <button
                  onClick={() => removePaymentRow(i)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addPaymentRow}
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add another payment method
          </button>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Paid</span>
            <span className={cn('font-semibold', totalPaid >= total ? 'text-emerald-600' : 'text-slate-700')}>
              {formatCurrency(totalPaid)}
            </span>
          </div>
          {remaining > 0.01 ? (
            <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Remaining</span>
              <span>{formatCurrency(remaining)}</span>
            </div>
          ) : change > 0.01 ? (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Change</span>
              <span>{formatCurrency(change)}</span>
            </div>
          ) : null}
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleComplete}
          loading={processing}
          disabled={remaining > 0.01}
          className="text-base font-bold"
        >
          <Check className="w-5 h-5" />
          Complete Payment
        </Button>
      </div>
    </Modal>
  )
}
