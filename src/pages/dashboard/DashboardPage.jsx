import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  ShoppingCart, TrendingUp, IndianRupee, Clock, CheckCircle2,
  XCircle, Users, AlertTriangle, ArrowUpRight, ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'

const PAYMENT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']
const CHART_COLOR = '#f55514'

function KpiCard({ title, value, icon: Icon, color, change, changeLabel, loading }) {
  const colorMap = {
    orange: { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600 dark:text-primary-400', icon: 'text-primary-600 dark:text-primary-400' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-600 dark:text-purple-400' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'text-red-600 dark:text-red-400' },
    yellow: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-600 dark:text-amber-400' },
  }
  const c = colorMap[color] || colorMap.orange

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
        {change !== undefined && !loading && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </>
      ) : (
        <>
          <div className={cn('text-2xl font-bold', c.text)}>{value}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
          {changeLabel && <p className="text-xs text-slate-400">{changeLabel}</p>}
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { restaurant } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [hourlyData, setHourlyData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [salesView, setSalesView] = useState('hourly')
  const [refreshing, setRefreshing] = useState(false)

  const restaurantId = restaurant?.id

  const fetchData = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      // Today's orders + revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total, status, type, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', todayStr)
        .neq('status', 'cancelled')

      const revenue = (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0)
      const completed = (todayOrders || []).filter(o => o.status === 'completed').length
      const pending = (todayOrders || []).filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length
      const cancelled = (todayOrders || []).filter(o => o.status === 'cancelled').length
      const aov = todayOrders?.length ? revenue / todayOrders.length : 0

      // Payment breakdown for today
      const { data: payments } = await supabase
        .from('payments')
        .select('method, amount')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', todayStr)

      const paymentBreakdown = (payments || []).reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + (p.amount || 0)
        return acc
      }, {})

      setStats({
        totalOrders: todayOrders?.length || 0,
        revenue,
        completed,
        pending,
        cancelled,
        aov,
        cashSales: paymentBreakdown.cash || 0,
        cardSales: paymentBreakdown.card || 0,
        upiSales: paymentBreakdown.upi || 0,
        onlineSales: paymentBreakdown.online || 0,
      })

      setPaymentData(
        Object.entries(paymentBreakdown)
          .filter(([, val]) => val > 0)
          .map(([name, value]) => ({ name: name.toUpperCase(), value: Math.round(value) }))
      )

      // Hourly sales for today
      const hourly = Array.from({ length: 24 }, (_, h) => ({
        hour: `${h.toString().padStart(2, '0')}:00`,
        orders: 0,
        revenue: 0,
      }))
      ;(todayOrders || []).forEach(o => {
        const h = new Date(o.created_at).getHours()
        hourly[h].orders++
        hourly[h].revenue += o.total || 0
      })
      // Only show hours from 6am to current
      const currentHour = new Date().getHours()
      setHourlyData(hourly.slice(6, Math.min(currentHour + 1, 24)))

      // Recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('id, order_number, type, status, total, created_at, customers(name), tables(number)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(8)

      setRecentOrders(recent || [])

      // Top products (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data: itemData } = await supabase
        .from('order_items')
        .select('name, quantity, total, orders!inner(restaurant_id, created_at, status)')
        .eq('orders.restaurant_id', restaurantId)
        .gte('orders.created_at', sevenDaysAgo)
        .eq('orders.status', 'completed')

      const productTotals = {}
      ;(itemData || []).forEach(item => {
        const k = item.name
        if (!productTotals[k]) productTotals[k] = { name: k, qty: 0, revenue: 0 }
        productTotals[k].qty += item.quantity || 0
        productTotals[k].revenue += item.total || 0
      })
      setTopProducts(
        Object.values(productTotals)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 8)
      )

      // Low stock items
      const { data: stock } = await supabase
        .from('inventory_items')
        .select('name, quantity, low_stock_threshold, unit_name')
        .eq('restaurant_id', restaurantId)
        .filter('quantity', 'lte', supabase.rpc ? 'low_stock_threshold' : 999)
        .order('quantity', { ascending: true })
        .limit(5)

      // Manual filter since Supabase doesn't support column comparison directly
      const { data: allStock } = await supabase
        .from('inventory_items')
        .select('name, quantity, low_stock_threshold, unit_name')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)

      setLowStock(
        (allStock || [])
          .filter(item => item.quantity <= item.low_stock_threshold)
          .sort((a, b) => a.quantity - b.quantity)
          .slice(0, 6)
      )

    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchData()

    if (!restaurantId) return
    // Realtime: refresh on new orders
    const channel = supabase
      .channel(`dashboard-orders:${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => fetchData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Today's overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          loading={refreshing}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          icon={IndianRupee}
          color="orange"
          change={12}
          loading={loading}
        />
        <KpiCard
          title="Today's Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="blue"
          change={8}
          loading={loading}
        />
        <KpiCard
          title="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle2}
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Pending Orders"
          value={stats?.pending || 0}
          icon={Clock}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Order Value"
          value={formatCurrency(stats?.aov || 0)}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
        <KpiCard
          title="Cash Sales"
          value={formatCurrency(stats?.cashSales || 0)}
          icon={IndianRupee}
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Card + UPI Sales"
          value={formatCurrency((stats?.cardSales || 0) + (stats?.upiSales || 0))}
          icon={IndianRupee}
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Cancelled Orders"
          value={stats?.cancelled || 0}
          icon={XCircle}
          color="red"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Sales Overview</h2>
            <div className="flex gap-1">
              {['hourly', 'revenue'].map(v => (
                <button
                  key={v}
                  onClick={() => setSalesView(v)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    salesView === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300',
                  )}
                >
                  {v === 'hourly' ? 'Orders' : 'Revenue'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v) => salesView === 'revenue' ? formatCurrency(v) : v}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area
                  type="monotone"
                  dataKey={salesView === 'hourly' ? 'orders' : 'revenue'}
                  stroke={CHART_COLOR}
                  strokeWidth={2}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Payment Methods</h2>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : paymentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-400">
              <IndianRupee className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No payments today</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {paymentData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAYMENT_COLORS[i] }} />
                    <span className="text-xs text-slate-500">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="section-title">Recent Orders</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No orders yet today</div>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                  <span className="text-xs font-mono font-semibold text-slate-500">#{order.order_number}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {order.customers?.name || (order.tables?.number ? `Table ${order.tables.number}` : 'Walk-in')}
                    </p>
                    <p className="text-xs text-slate-400">{formatRelativeTime(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right col: Top products + Low stock */}
        <div className="space-y-6">
          {/* Top Products */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="section-title text-base">Top Items (7 days)</h2>
            </div>
            <div className="p-4 space-y-2">
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8" />)
              ) : topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</p>
                    <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min(100, (p.qty / (topProducts[0]?.qty || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{p.qty} sold</span>
                </div>
              ))}
              {!loading && topProducts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No sales data yet</p>
              )}
            </div>
          </div>

          {/* Low Stock */}
          {lowStock.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="section-title text-base">Low Stock Alert</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {lowStock.map((item, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.name}</p>
                      <p className="text-xs text-amber-500">
                        {item.quantity} {item.unit_name} remaining
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">min {item.low_stock_threshold}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
