import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime, formatPhone, formatRelativeTime } from '@/utils/formatters'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, Eye, Phone, Mail, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

export default function CustomersPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [viewCustomer, setViewCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', birthday: '', notes: '' })

  const fetchCustomers = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    let q = supabase.from('customers').select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId).eq('is_active', true).order('name')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, count } = await q
    setCustomers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [restaurantId, search, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const loadCustomerOrders = async (customerId) => {
    const { data } = await supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(10)
    setCustomerOrders(data || [])
  }

  const openView = (c) => {
    setViewCustomer(c)
    loadCustomerOrders(c.id)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', birthday: c.birthday || '', notes: c.notes || '' })
    setShowModal(true)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', phone: '', email: '', address: '', birthday: '', notes: '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = { ...form, restaurant_id: restaurantId }
    const { error } = editing ? await supabase.from('customers').update(payload).eq('id', editing.id) : await supabase.from('customers').insert(payload)
    if (!error) { toast.success(editing ? 'Customer updated!' : 'Customer added!'); fetchCustomers(); setShowModal(false) }
    else toast.error(error.message)
    setSaving(false)
  }

  const columns = [
    { header: 'Customer', cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar name={r.name} size="sm" />
        <div>
          <p className="text-sm font-medium">{r.name}</p>
          {r.phone && <p className="text-xs text-slate-400">{formatPhone(r.phone)}</p>}
        </div>
      </div>
    )},
    { header: 'Email', cell: (r) => <span className="text-sm text-slate-400">{r.email || '—'}</span> },
    { header: 'Orders', cell: (r) => <Badge color="blue">{r.total_orders}</Badge> },
    { header: 'Total Spent', cell: (r) => <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(r.total_spent)}</span> },
    { header: 'Actions', cell: (r) => (
      <div className="flex gap-1">
        <button onClick={() => openView(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Eye className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
      </div>
    ), width: 80 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total customers</p>
        </div>
        <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Customer</Button>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name, phone, email..." className="w-72" />

      <DataTable columns={columns} data={customers} loading={loading} emptyMessage="No customers found" onRowClick={openView} />
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* Customer Detail Modal */}
      <Modal isOpen={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Customer Profile" size="lg">
        {viewCustomer && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar name={viewCustomer.name} size="lg" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewCustomer.name}</h3>
                {viewCustomer.phone && <div className="flex items-center gap-2 text-sm text-slate-500 mt-1"><Phone className="w-4 h-4" />{formatPhone(viewCustomer.phone)}</div>}
                {viewCustomer.email && <div className="flex items-center gap-2 text-sm text-slate-500"><Mail className="w-4 h-4" />{viewCustomer.email}</div>}
              </div>
              <Button size="sm" variant="outline" onClick={() => { setViewCustomer(null); openEdit(viewCustomer) }}>Edit</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{viewCustomer.total_orders}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Orders</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(viewCustomer.total_spent)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Spent</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xl font-bold text-blue-600">
                  {viewCustomer.total_orders > 0 ? formatCurrency(viewCustomer.total_spent / viewCustomer.total_orders) : '—'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Avg Order</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Orders</h4>
              <div className="space-y-2">
                {customerOrders.length === 0 ? (
                  <p className="text-sm text-slate-400">No orders yet</p>
                ) : customerOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-mono text-primary-600">#{o.order_number}</span>
                      <span className="text-xs text-slate-400 ml-2">{formatDateTime(o.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={o.status === 'completed' ? 'green' : 'gray'}>{o.status}</Badge>
                      <span className="text-sm font-semibold">{formatCurrency(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          <Input label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" />
          <Input label="Birthday" value={form.birthday} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))} type="date" />
          <div className="col-span-2"><Input label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
          <div className="col-span-2"><Textarea label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!form.name} fullWidth>{editing ? 'Update' : 'Add Customer'}</Button>
        </div>
      </Modal>
    </div>
  )
}
