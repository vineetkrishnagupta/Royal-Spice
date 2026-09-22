import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency, formatRelativeTime } from '@/utils/formatters'
import { ClipboardList, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HoldOrdersModal({ isOpen, onClose }) {
  const { restaurant } = useAuth()
  const { loadHeldOrder } = useCartStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !restaurant?.id) return
    setLoading(true)
    supabase
      .from('orders')
      .select('*, order_items(*, order_item_modifiers(*)), tables(number), customers(name)')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setLoading(false)
      })
  }, [isOpen, restaurant?.id])

  const resumeOrder = (order) => {
    loadHeldOrder({
      ...order,
      table_number: order.tables?.number,
      customer_name: order.customers?.name,
    })
    toast.success(`Order #${order.order_number} resumed`)
    onClose()
  }

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this held order?')) return
    await supabase.from('orders').delete().eq('id', orderId)
    setOrders(prev => prev.filter(o => o.id !== orderId))
    toast.success('Order deleted')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Held Orders" size="md">
      {loading ? (
        <p className="text-center text-slate-400 py-8">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No held orders</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orders.map(order => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">#{order.order_number}</span>
                  {order.tables?.number && (
                    <span className="text-xs text-slate-400">Table {order.tables.number}</span>
                  )}
                  {order.customers?.name && (
                    <span className="text-xs text-slate-400">{order.customers.name}</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {order.order_items?.length || 0} items · {formatRelativeTime(order.created_at)}
                </p>
              </div>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                {formatCurrency(order.total || 0)}
              </span>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => resumeOrder(order)}>Resume</Button>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
