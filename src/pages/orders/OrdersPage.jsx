import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Eye, RefreshCw, Printer, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'dine_in', label: 'Dine In' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'online', label: 'Online' },
]

export default function OrdersPage() {
  const { restaurant } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('*, customers(name, phone), tables(number), profiles!cashier_id(name)', { count: 'exact' })
      .eq('restaurant_id', restaurant.id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) q = q.or(`order_number::text.ilike.%${search}%`)
    if (status) q = q.eq('status', status)
    if (type) q = q.eq('type', type)

    const { data, count, error } = await q
    if (!error) {
      setOrders(data || [])
      setTotal(count || 0)
    }
    setLoading(false)
  }, [restaurant?.id, search, status, type, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const loadOrderDetail = async (order) => {
    setSelectedOrder(order)
    setLoadingDetail(true)
    const { data } = await supabase
      .from('order_items')
      .select('*, order_item_modifiers(*)')
      .eq('order_id', order.id)
    setOrderDetail(data || [])
    setLoadingDetail(false)
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
    if (!error) {
      toast.success('Order cancelled')
      fetchOrders()
    }
  }

  const columns = [
    {
      header: 'Order #',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
          #{row.order_number}
        </span>
      ),
      width: 100,
    },
    {
      header: 'Customer / Table',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.customers?.name || 'Walk-in'}</p>
          {row.tables?.number && (
            <p className="text-xs text-slate-400">Table {row.tables.number}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (row) => <StatusBadge status={row.type} />,
    },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Total',
      cell: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      header: 'Time',
      cell: (row) => (
        <span className="text-xs text-slate-400">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      header: 'Cashier',
      cell: (row) => (
        <span className="text-xs text-slate-500">{row.profiles?.name || '—'}</span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); loadOrderDetail(row) }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!['cancelled', 'refunded', 'completed'].includes(row.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); cancelOrder(row.id) }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Cancel"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
      width: 80,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search order #..."
          className="w-52"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          containerClassName="w-40"
        />
        <Select
          options={TYPE_OPTIONS}
          value={type}
          onChange={e => { setType(e.target.value); setPage(1) }}
          containerClassName="w-36"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No orders found"
        onRowClick={loadOrderDetail}
      />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / PAGE_SIZE)}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => { setSelectedOrder(null); setOrderDetail(null) }}
        title={`Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs">Status</p><StatusBadge status={selectedOrder.status} /></div>
              <div><p className="text-slate-400 text-xs">Type</p><StatusBadge status={selectedOrder.type} /></div>
              <div><p className="text-slate-400 text-xs">Table</p><p className="font-medium">{selectedOrder.tables?.number || '—'}</p></div>
              <div><p className="text-slate-400 text-xs">Customer</p><p className="font-medium">{selectedOrder.customers?.name || 'Walk-in'}</p></div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="table-base">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {loadingDetail ? (
                    <tr><td colSpan={4} className="text-center py-4 text-slate-400">Loading...</td></tr>
                  ) : (orderDetail || []).map(item => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.notes && <p className="text-xs text-slate-400 italic">{item.notes}</p>}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
              {selectedOrder.discount_amount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{formatCurrency(selectedOrder.discount_amount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Tax (GST)</span><span>{formatCurrency(selectedOrder.tax_amount)}</span></div>
              {selectedOrder.service_charge > 0 && <div className="flex justify-between"><span className="text-slate-500">Service Charge</span><span>{formatCurrency(selectedOrder.service_charge)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Total</span><span className="text-primary-600">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
