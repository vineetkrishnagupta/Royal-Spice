import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/helpers'
import { Download, BarChart3, TrendingUp, Package, Users, CreditCard } from 'lucide-react'

const TABS = ['Sales', 'Products', 'Payments', 'Staff']
const PAYMENT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']

export default function ReportsPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [activeTab, setActiveTab] = useState('Sales')
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  const [salesData, setSalesData] = useState([])
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalCompleted: 0 })
  const [topProducts, setTopProducts] = useState([])
  const [paymentBreakdown, setPaymentBreakdown] = useState([])
  const [staffData, setStaffData] = useState([])

  const fetchSalesReport = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    const from = `${dateFrom}T00:00:00.000Z`
    const to = `${dateTo}T23:59:59.999Z`

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, created_at, type')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', from)
      .lte('created_at', to)
      .neq('status', 'cancelled')

    if (orders) {
      // Daily aggregation
      const daily = {}
      orders.forEach(o => {
        const day = o.created_at.slice(0, 10)
        if (!daily[day]) daily[day] = { date: day, orders: 0, revenue: 0 }
        daily[day].orders++
        daily[day].revenue += o.total || 0
      })
      setSalesData(Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)))

      const completed = orders.filter(o => o.status === 'completed')
      setSalesSummary({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
        avgOrderValue: orders.length ? orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length : 0,
        totalCompleted: completed.length,
      })
    }

    // Products
    const { data: items } = await supabase
      .from('order_items')
      .select('name, quantity, total, orders!inner(restaurant_id, created_at, status)')
      .eq('orders.restaurant_id', restaurantId)
      .gte('orders.created_at', from)
      .lte('orders.created_at', to)
      .eq('orders.status', 'completed')

    if (items) {
      const agg = {}
      items.forEach(item => {
        if (!agg[item.name]) agg[item.name] = { name: item.name, qty: 0, revenue: 0 }
        agg[item.name].qty += item.quantity || 0
        agg[item.name].revenue += item.total || 0
      })
      setTopProducts(Object.values(agg).sort((a, b) => b.revenue - a.revenue).slice(0, 10))
    }

    // Payments
    const { data: payments } = await supabase
      .from('payments')
      .select('method, amount')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', from)
      .lte('created_at', to)
      .eq('status', 'completed')

    if (payments) {
      const agg = {}
      payments.forEach(p => {
        agg[p.method] = (agg[p.method] || 0) + (p.amount || 0)
      })
      setPaymentBreakdown(
        Object.entries(agg).map(([name, value]) => ({ name: name.toUpperCase(), value: Math.round(value) }))
      )
    }

    // Staff performance
    const { data: staffOrders } = await supabase
      .from('orders')
      .select('cashier_id, total, status, profiles!cashier_id(name)')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', from)
      .lte('created_at', to)
      .eq('status', 'completed')

    if (staffOrders) {
      const agg = {}
      staffOrders.forEach(o => {
        const name = o.profiles?.name || 'Unknown'
        if (!agg[name]) agg[name] = { name, orders: 0, revenue: 0 }
        agg[name].orders++
        agg[name].revenue += o.total || 0
      })
      setStaffData(Object.values(agg).sort((a, b) => b.revenue - a.revenue))
    }

    setLoading(false)
  }, [restaurantId, dateFrom, dateTo])

  useEffect(() => { fetchSalesReport() }, [fetchSalesReport])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
      </div>

      {/* Date range */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <Input label="From Date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} containerClassName="w-40" />
        <Input label="To Date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} containerClassName="w-40" />
        <Button onClick={fetchSalesReport} loading={loading}>Generate Report</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Sales' && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(salesSummary.totalRevenue), icon: TrendingUp, color: 'text-primary-600' },
              { label: 'Total Orders', value: salesSummary.totalOrders, icon: BarChart3, color: 'text-blue-600' },
              { label: 'Avg Order Value', value: formatCurrency(salesSummary.avgOrderValue), icon: CreditCard, color: 'text-purple-600' },
              { label: 'Completed', value: salesSummary.totalCompleted, icon: Package, color: 'text-emerald-600' },
            ].map((kpi, i) => (
              <div key={i} className="card p-4">
                {loading ? <Skeleton className="h-16" /> : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">{kpi.label}</p>
                      <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                    </div>
                    <p className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Daily sales chart */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Daily Sales</h3>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f55514" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f55514" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f55514" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Products' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="section-title">Top Selling Products</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="px-5 py-3"><Skeleton className="h-5" /></div>) :
              topProducts.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.name}</p>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (p.revenue / (topProducts[0]?.revenue || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-primary-600">{formatCurrency(p.revenue)}</p>
                    <p className="text-xs text-slate-400">{p.qty} sold</p>
                  </div>
                </div>
              ))
            }
            {!loading && topProducts.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No sales data in this period</p>}
          </div>
        </div>
      )}

      {activeTab === 'Payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="section-title mb-4">Payment Method Breakdown</h3>
            {loading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${formatCurrency(value)}`} labelLine={false}>
                    {paymentBreakdown.map((_, i) => <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h3 className="section-title">Breakdown</h3></div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {paymentBreakdown.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }} />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(p.value)}</span>
                </div>
              ))}
              {paymentBreakdown.length === 0 && !loading && <p className="text-center py-8 text-slate-400 text-sm">No payment data</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Staff' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700"><h3 className="section-title">Staff Performance</h3></div>
          <div className="table-wrapper border-none rounded-none">
            <table className="table-base">
              <thead><tr><th>Staff</th><th className="text-center">Orders</th><th className="text-right">Revenue</th><th className="text-right">Avg Order</th></tr></thead>
              <tbody>
                {loading ? Array(4).fill(0).map((_, i) => <tr key={i}><td colSpan={4}><Skeleton className="h-5" /></td></tr>) :
                  staffData.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="text-center"><span className="text-sm font-semibold">{s.orders}</span></td>
                      <td className="text-right"><span className="text-sm font-bold text-primary-600">{formatCurrency(s.revenue)}</span></td>
                      <td className="text-right"><span className="text-sm text-slate-500">{formatCurrency(s.orders > 0 ? s.revenue / s.orders : 0)}</span></td>
                    </tr>
                  ))
                }
                {!loading && staffData.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No data in this period</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
