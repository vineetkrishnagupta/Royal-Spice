import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, Trash2, AlertTriangle, ArrowUp, ArrowDown, RotateCcw, TrendingDown, Package, IndianRupee } from 'lucide-react'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

const TABS = ['Items', 'Movements', 'Purchases', 'Wastage', 'Suppliers']
const PAGE_SIZE = 20

function KpiCard({ icon: Icon, label, value, color }) {
  const colors = {
    orange: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [activeTab, setActiveTab] = useState('Items')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [editing, setEditing] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', unit_name: 'kg', quantity: '0', low_stock_threshold: '10', cost_per_unit: '0', category: '' })
  const [adjustForm, setAdjustForm] = useState({ type: 'adjustment', quantity: '', notes: '' })
  const [movements, setMovements] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_name: '', phone: '', email: '' })
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    let q = supabase.from('inventory_items').select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId).eq('is_active', true).order('name')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (search) q = q.ilike('name', `%${search}%`)
    const { data, count } = await q
    setItems(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [restaurantId, search, page])

  const fetchMovements = useCallback(async () => {
    if (!restaurantId) return
    const { data } = await supabase.from('inventory_movements').select('*, inventory_items(name)').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(50)
    setMovements(data || [])
  }, [restaurantId])

  const fetchSuppliers = useCallback(async () => {
    if (!restaurantId) return
    const { data } = await supabase.from('suppliers').select('*').eq('restaurant_id', restaurantId).order('name')
    setSuppliers(data || [])
  }, [restaurantId])

  useEffect(() => {
    if (activeTab === 'Items') fetchItems()
    if (activeTab === 'Movements') fetchMovements()
    if (activeTab === 'Suppliers') fetchSuppliers()
  }, [activeTab, fetchItems, fetchMovements, fetchSuppliers])

  const lowStockCount = items.filter(i => i.quantity <= i.low_stock_threshold).length
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.cost_per_unit || 0)), 0)

  const saveItem = async () => {
    setSaving(true)
    const payload = { ...form, quantity: parseFloat(form.quantity) || 0, low_stock_threshold: parseFloat(form.low_stock_threshold) || 0, cost_per_unit: parseFloat(form.cost_per_unit) || 0, restaurant_id: restaurantId }
    const { error } = editing ? await supabase.from('inventory_items').update(payload).eq('id', editing.id) : await supabase.from('inventory_items').insert(payload)
    if (!error) { toast.success(editing ? 'Updated!' : 'Added!'); fetchItems(); setShowModal(false) } else toast.error(error.message)
    setSaving(false)
  }

  const applyAdjustment = async () => {
    if (!adjustItem || !adjustForm.quantity) return
    setSaving(true)
    const qty = parseFloat(adjustForm.quantity)
    const newQty = adjustForm.type === 'wastage' ? adjustItem.quantity - qty : adjustItem.quantity + qty
    await supabase.from('inventory_items').update({ quantity: Math.max(0, newQty) }).eq('id', adjustItem.id)
    await supabase.from('inventory_movements').insert({
      restaurant_id: restaurantId, item_id: adjustItem.id, type: adjustForm.type,
      quantity: adjustForm.type === 'wastage' ? -qty : qty,
      quantity_before: adjustItem.quantity, quantity_after: Math.max(0, newQty),
      notes: adjustForm.notes,
    })
    toast.success('Stock adjusted!')
    setShowAdjust(false)
    fetchItems()
    setSaving(false)
  }

  const addSupplier = async () => {
    setSaving(true)
    const { error } = await supabase.from('suppliers').insert({ ...supplierForm, restaurant_id: restaurantId })
    if (!error) { toast.success('Supplier added!'); fetchSuppliers(); setShowSupplierModal(false) } else toast.error(error.message)
    setSaving(false)
  }

  const UNIT_OPTIONS = ['kg', 'gm', 'ltr', 'ml', 'pcs', 'box', 'pack', 'dozen'].map(u => ({ value: u, label: u }))
  const MOVE_TYPE_OPTIONS = [{ value: 'adjustment', label: 'Stock Adjustment' }, { value: 'wastage', label: 'Wastage (deduct)' }, { value: 'purchase', label: 'Purchase (add)' }]

  const itemColumns = [
    { header: 'Item', cell: (r) => <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-slate-400">{r.category || '—'}</p></div> },
    { header: 'Stock', cell: (r) => (
      <div>
        <p className={cn('font-semibold text-sm', r.quantity <= r.low_stock_threshold ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200')}>
          {r.quantity} {r.unit_name}
        </p>
        {r.quantity <= r.low_stock_threshold && <Badge color="red">Low Stock</Badge>}
      </div>
    )},
    { header: 'Cost/Unit', cell: (r) => <span className="text-sm text-slate-500">{formatCurrency(r.cost_per_unit)}</span> },
    { header: 'Value', cell: (r) => <span className="text-sm font-medium">{formatCurrency(r.quantity * r.cost_per_unit)}</span> },
    { header: 'Actions', cell: (r) => (
      <div className="flex gap-1">
        <button onClick={() => { setEditItem(r) }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setAdjustItem(r); setAdjustForm({ type: 'adjustment', quantity: '', notes: '' }); setShowAdjust(true) }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Adjust"><RotateCcw className="w-3.5 h-3.5" /></button>
      </div>
    ), width: 80 },
  ]

  const setEditItem = (item) => {
    setEditing(item)
    setForm({ name: item.name, unit_name: item.unit_name || 'kg', quantity: String(item.quantity), low_stock_threshold: String(item.low_stock_threshold), cost_per_unit: String(item.cost_per_unit || 0), category: item.category || '' })
    setShowModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
        {activeTab === 'Items' && <Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', unit_name: 'kg', quantity: '0', low_stock_threshold: '10', cost_per_unit: '0', category: '' }); setShowModal(true) }} leftIcon={<Plus className="w-4 h-4" />}>Add Item</Button>}
        {activeTab === 'Suppliers' && <Button size="sm" onClick={() => setShowSupplierModal(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Supplier</Button>}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Total Items" value={total} color="orange" />
        <KpiCard icon={IndianRupee} label="Inventory Value" value={formatCurrency(totalValue)} color="green" />
        <KpiCard icon={AlertTriangle} label="Low Stock" value={lowStockCount} color="red" />
        <KpiCard icon={TrendingDown} label="Categories" value={[...new Set(items.map(i => i.category))].filter(Boolean).length} color="yellow" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Items' && (
        <>
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search items..." className="w-64" />
          <DataTable columns={itemColumns} data={items} loading={loading} emptyMessage="No inventory items" />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {activeTab === 'Movements' && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead><tr><th>Item</th><th>Type</th><th>Qty Change</th><th>Before</th><th>After</th><th>Notes</th><th>Time</th></tr></thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td className="font-medium">{m.inventory_items?.name}</td>
                  <td><Badge color={m.quantity > 0 ? 'green' : 'red'}>{m.type}</Badge></td>
                  <td className={cn('font-semibold', m.quantity > 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="text-slate-400">{m.quantity_before}</td>
                  <td className="text-slate-600">{m.quantity_after}</td>
                  <td className="text-xs text-slate-400">{m.notes || '—'}</td>
                  <td className="text-xs text-slate-400">{formatDateTime(m.created_at)}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No movements recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="card p-4">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
              {s.contact_name && <p className="text-sm text-slate-500 mt-0.5">{s.contact_name}</p>}
              {s.phone && <p className="text-sm text-slate-400">{s.phone}</p>}
              {s.email && <p className="text-sm text-slate-400">{s.email}</p>}
            </div>
          ))}
          {suppliers.length === 0 && !loading && <p className="text-slate-400 text-sm">No suppliers added yet</p>}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Item' : 'Add Inventory Item'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Item Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paneer" required /></div>
          <Select label="Unit" value={form.unit_name} onChange={e => setForm(p => ({ ...p, unit_name: e.target.value }))} options={UNIT_OPTIONS} />
          <Input label="Current Quantity" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} min="0" step="0.001" />
          <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={e => setForm(p => ({ ...p, low_stock_threshold: e.target.value }))} min="0" />
          <Input label="Cost per Unit (₹)" type="number" value={form.cost_per_unit} onChange={e => setForm(p => ({ ...p, cost_per_unit: e.target.value }))} min="0" step="0.01" />
          <div className="col-span-2"><Input label="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Dairy, Vegetables..." /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
          <Button onClick={saveItem} loading={saving} disabled={!form.name} fullWidth>{editing ? 'Update' : 'Add Item'}</Button>
        </div>
      </Modal>

      {/* Adjust stock modal */}
      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title={`Adjust: ${adjustItem?.name}`} size="sm">
        <div className="space-y-3">
          <Select label="Adjustment Type" value={adjustForm.type} onChange={e => setAdjustForm(p => ({ ...p, type: e.target.value }))} options={MOVE_TYPE_OPTIONS} />
          <Input label="Quantity" type="number" value={adjustForm.quantity} onChange={e => setAdjustForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" min="0" step="0.001" />
          <Textarea label="Notes" value={adjustForm.notes} onChange={e => setAdjustForm(p => ({ ...p, notes: e.target.value }))} placeholder="Reason for adjustment..." rows={2} />
          <p className="text-xs text-slate-400">Current: {adjustItem?.quantity} {adjustItem?.unit_name}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAdjust(false)} fullWidth>Cancel</Button>
            <Button onClick={applyAdjustment} loading={saving} disabled={!adjustForm.quantity} fullWidth>Apply</Button>
          </div>
        </div>
      </Modal>

      {/* Supplier modal */}
      <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="Add Supplier" size="md">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Company Name" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} required /></div>
          <Input label="Contact Person" value={supplierForm.contact_name} onChange={e => setSupplierForm(p => ({ ...p, contact_name: e.target.value }))} />
          <Input label="Phone" value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          <div className="col-span-2"><Input label="Email" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} type="email" /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowSupplierModal(false)} fullWidth>Cancel</Button>
          <Button onClick={addSupplier} loading={saving} disabled={!supplierForm.name} fullWidth>Add Supplier</Button>
        </div>
      </Modal>
    </div>
  )
}
