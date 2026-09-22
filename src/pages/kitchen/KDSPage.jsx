import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/utils/helpers'
import { Clock, ChefHat, CheckCircle2, Star, RefreshCw, Timer, MessageSquare, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const COLUMNS = [
  { key: 'new', label: 'New Orders', icon: Clock, color: 'border-red-400 bg-red-50 dark:bg-red-900/10' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'border-amber-400 bg-amber-50 dark:bg-amber-900/10' },
  { key: 'ready', label: 'Ready', icon: Star, color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' },
]

const NEXT_STATUS = {
  new: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

const NEXT_LABEL = {
  new: 'Accept',
  accepted: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete',
}

export default function KDSPage() {
  const { restaurant } = useAuth()
  const [kitchenOrders, setKitchenOrders] = useState([])
  const [orderItems, setOrderItems] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)

    const { data } = await supabase
      .from('kitchen_orders')
      .select(`
        *,
        orders(
          order_number, type, notes, created_at,
          tables(number),
          customers(name)
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .not('status', 'in', '(completed)')
      .order('created_at', { ascending: true })

    if (data) {
      setKitchenOrders(data)
      // Fetch items for each order
      const orderIds = data.map(ko => ko.order_id)
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('*, order_item_modifiers(*)')
          .in('order_id', orderIds)
          .neq('status', 'cancelled')
        if (items) {
          const grouped = {}
          items.forEach(item => {
            if (!grouped[item.order_id]) grouped[item.order_id] = []
            grouped[item.order_id].push(item)
          })
          setOrderItems(grouped)
        }
      }
    }
    setLoading(false)
  }, [restaurant?.id])

  useEffect(() => {
    fetchOrders()

    if (!restaurant?.id) return
    // Realtime subscription for KDS
    const channel = supabase
      .channel(`kds:${restaurant.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kitchen_orders',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, () => fetchOrders())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, () => fetchOrders())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  const updateStatus = async (kitchenOrderId, currentStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return

    const updates = {
      status: nextStatus,
      [`${nextStatus}_at`]: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('kitchen_orders')
      .update(updates)
      .eq('id', kitchenOrderId)

    if (!error) {
      if (nextStatus === 'completed') {
        toast.success('Order completed!')
      } else {
        toast.success(`Order moved to ${nextStatus}`)
      }
      fetchOrders()
    }
  }

  const getElapsedMinutes = (createdAt) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  }

  const ordersInStatus = (status) => kitchenOrders.filter(ko => ko.status === status)

  return (
    <div className="flex flex-col h-full -m-6 animate-fade-in">
      {/* KDS Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-primary-400" />
          <div>
            <h1 className="text-lg font-bold">Kitchen Display System</h1>
            <p className="text-slate-400 text-xs">{kitchenOrders.length} active orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Live orders</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">Active</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchOrders} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KDS Kanban */}
      <div className="flex-1 overflow-x-auto bg-slate-100 dark:bg-slate-950 p-4">
        <div className="flex gap-4 h-full min-h-0" style={{ minWidth: '800px' }}>
          {COLUMNS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="flex-1 flex flex-col min-w-52">
              {/* Column header */}
              <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border-2 mb-3', color)}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {ordersInStatus(key).length}
                </span>
              </div>

              {/* Order cards */}
              <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="skeleton h-40 rounded-xl" />
                  ))
                ) : ordersInStatus(key).length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8 opacity-50">
                    No orders here
                  </div>
                ) : (
                  ordersInStatus(key).map(ko => {
                    const order = ko.orders
                    const items = orderItems[ko.order_id] || []
                    const elapsed = getElapsedMinutes(ko.created_at)
                    const isUrgent = elapsed > 20

                    return (
                      <div
                        key={ko.id}
                        className={cn(
                          'bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all',
                          isUrgent ? 'border-red-400 animate-pulse-slow' : 'border-slate-200 dark:border-slate-700',
                        )}
                      >
                        {/* Card header */}
                        <div className={cn(
                          'px-3 py-2 flex items-center justify-between',
                          isUrgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700/50',
                        )}>
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              #{order?.order_number}
                            </span>
                            {order?.tables?.number && (
                              <span className="text-xs text-slate-500 ml-2">Table {order.tables.number}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Timer className={cn('w-3.5 h-3.5', isUrgent ? 'text-red-500' : 'text-slate-400')} />
                            <span className={cn('text-xs font-semibold', isUrgent ? 'text-red-600' : 'text-slate-500')}>
                              {elapsed}m
                            </span>
                          </div>
                        </div>

                        {/* Order type badge */}
                        <div className="px-3 pt-2">
                          <StatusBadge status={order?.type || 'dine_in'} />
                        </div>

                        {/* Items */}
                        <div className="px-3 py-2 space-y-1.5">
                          {items.map(item => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400 w-5 flex-shrink-0 text-right">
                                {item.quantity}×
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{item.name}</p>
                                {item.order_item_modifiers?.map(mod => (
                                  <p key={mod.id} className="text-xs text-slate-400">• {mod.option_name}</p>
                                ))}
                                {item.notes && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 italic flex items-center gap-1 mt-0.5"><MessageSquare className="w-3 h-3" /> {item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {order?.notes && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                              <p className="text-xs text-slate-400 italic flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {order.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Action button */}
                        {NEXT_STATUS[key] && (
                          <div className="px-3 pb-3">
                            <button
                              onClick={() => updateStatus(ko.id, key)}
                              className={cn(
                                'w-full py-2 rounded-lg text-xs font-bold transition-all active:scale-95',
                                key === 'new' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                key === 'accepted' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                                key === 'preparing' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                                'bg-primary-600 text-white hover:bg-primary-700',
                              )}
                            >
                              <span className="flex items-center justify-center gap-1.5">{NEXT_LABEL[key]} <ArrowRight className="w-3.5 h-3.5" /></span>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
