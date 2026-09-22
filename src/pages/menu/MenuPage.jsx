import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, Trash2, Package, Eye, EyeOff, Copy } from 'lucide-react'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

const TABS = ['Products', 'Categories', 'Modifiers', 'Taxes']
const PAGE_SIZE = 20

function CategoryTab({ restaurantId }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#f55514' })
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('sort_order')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { if (restaurantId) fetch() }, [restaurantId])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, restaurant_id: restaurantId }
    const { error } = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload)
    if (!error) { toast.success(editing ? 'Updated!' : 'Added!'); fetch(); setShowModal(false) }
    else toast.error(error.message)
    setSaving(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return
    await supabase.from('categories').delete().eq('id', id)
    toast.success('Deleted')
    fetch()
  }

  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, color: cat.color || '#f55514' }); setShowModal(true) }
  const openAdd = () => { setEditing(null); setForm({ name: '', color: '#f55514' }); setShowModal(true) }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Category</Button></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />) :
          categories.map(cat => (
            <div key={cat.id} className="card p-3 text-center group relative hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex-shrink-0" style={{ background: cat.color || '#f55514' }} />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{cat.name}</p>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1 rounded text-slate-400 hover:text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(cat.id)} className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))
        }
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Category name" required />
          <div>
            <label className="label">Color</label>
            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" />
          </div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button><Button onClick={save} loading={saving} fullWidth>Save</Button></div>
        </div>
      </Modal>
    </div>
  )
}

function TaxTab({ restaurantId }) {
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', rate: '', type: 'gst' })
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.from('taxes').select('*').eq('restaurant_id', restaurantId).order('rate')
    setTaxes(data || [])
    setLoading(false)
  }

  useEffect(() => { if (restaurantId) fetch() }, [restaurantId])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, rate: parseFloat(form.rate), restaurant_id: restaurantId }
    const { error } = editing
      ? await supabase.from('taxes').update(payload).eq('id', editing.id)
      : await supabase.from('taxes').insert(payload)
    if (!error) { toast.success(editing ? 'Updated!' : 'Added!'); fetch(); setShowModal(false) }
    else toast.error(error.message)
    setSaving(false)
  }

  const remove = async (id) => {
    await supabase.from('taxes').delete().eq('id', id)
    toast.success('Deleted')
    fetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', rate: '', type: 'gst' }); setShowModal(true) }} leftIcon={<Plus className="w-4 h-4" />}>Add Tax</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
          taxes.map(tax => (
            <div key={tax.id} className="card p-4 flex items-center justify-between group">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{tax.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color="blue">{tax.rate}%</Badge>
                  <Badge color="gray">{tax.type.toUpperCase()}</Badge>
                  {tax.is_default && <Badge color="green">Default</Badge>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => { setEditing(tax); setForm({ name: tax.name, rate: String(tax.rate), type: tax.type }); setShowModal(true) }} className="p-1.5 text-slate-400 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => remove(tax.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        }
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Tax' : 'Add Tax'} size="sm">
        <div className="space-y-3">
          <Input label="Tax Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. GST 5%" required />
          <Input label="Rate (%)" type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} placeholder="5" min="0" max="100" step="0.5" required />
          <Select label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} options={[{ value: 'gst', label: 'GST' }, { value: 'service', label: 'Service' }, { value: 'cess', label: 'Cess' }, { value: 'other', label: 'Other' }]} />
          <div className="flex gap-2"><Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button><Button onClick={save} loading={saving} fullWidth>Save</Button></div>
        </div>
      </Modal>
    </div>
  )
}

export default function MenuPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [activeTab, setActiveTab] = useState('Products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', price: '', cost_price: '', category_id: '', tax_id: '', is_veg: true, is_available: true, is_featured: false, prep_time: 15,
  })

  const fetchProducts = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    let q = supabase
      .from('products')
      .select('*, categories(name), taxes(rate, name)', { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .order('sort_order')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (search) q = q.ilike('name', `%${search}%`)
    const { data, count } = await q
    setProducts(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [restaurantId, search, page])

  useEffect(() => {
    if (!restaurantId) return
    supabase.from('categories').select('id, name').eq('restaurant_id', restaurantId).then(({ data }) => setCategories(data || []))
    supabase.from('taxes').select('id, name, rate').eq('restaurant_id', restaurantId).then(({ data }) => setTaxes(data || []))
  }, [restaurantId])

  useEffect(() => { if (activeTab === 'Products') fetchProducts() }, [fetchProducts, activeTab])

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', price: '', cost_price: '', category_id: categories[0]?.id || '', tax_id: taxes[0]?.id || '', is_veg: true, is_available: true, is_featured: false, prep_time: 15 }); setShowModal(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, description: p.description || '', price: String(p.price), cost_price: String(p.cost_price || 0), category_id: p.category_id || '', tax_id: p.tax_id || '', is_veg: p.is_veg, is_available: p.is_available, is_featured: p.is_featured, prep_time: p.prep_time || 15 }); setShowModal(true) }

  const saveProduct = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const payload = { ...form, price: parseFloat(form.price), cost_price: parseFloat(form.cost_price) || 0, prep_time: parseInt(form.prep_time), restaurant_id: restaurantId }
    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload)
    if (!error) { toast.success(editing ? 'Product updated!' : 'Product added!'); fetchProducts(); setShowModal(false) }
    else toast.error(error.message)
    setSaving(false)
  }

  const toggleAvailable = async (product) => {
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id)
    toast.success(product.is_available ? 'Marked unavailable' : 'Marked available')
    fetchProducts()
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete product?')) return
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Product deleted')
    fetchProducts()
  }

  const columns = [
    { header: 'Product', cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-lg">
          {row.is_veg ? '🥗' : '🍗'}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.name}</p>
          <p className="text-xs text-slate-400">{row.categories?.name}</p>
        </div>
      </div>
    )},
    { header: 'Price', cell: (row) => <span className="font-semibold text-primary-600">{formatCurrency(row.price)}</span> },
    { header: 'Cost', cell: (row) => <span className="text-slate-400 text-sm">{formatCurrency(row.cost_price || 0)}</span> },
    { header: 'Tax', cell: (row) => <span className="text-xs text-slate-500">{row.taxes?.name || '—'}</span> },
    { header: 'Status', cell: (row) => <Badge color={row.is_available ? 'green' : 'red'}>{row.is_available ? 'Available' : 'Unavailable'}</Badge> },
    { header: 'Actions', cell: (row) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => toggleAvailable(row)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg" title={row.is_available ? 'Disable' : 'Enable'}>{row.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
        <button onClick={() => deleteProduct(row.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), width: 100 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu Management</h1>
        {activeTab === 'Products' && <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Product</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors', activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Products' && (
        <>
          <div className="flex gap-3">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search products..." className="w-64" />
          </div>
          <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products found" />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}

      {activeTab === 'Categories' && <CategoryTab restaurantId={restaurantId} />}
      {activeTab === 'Taxes' && <TaxTab restaurantId={restaurantId} />}
      {activeTab === 'Modifiers' && (
        <div className="card p-8 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Modifiers management — add from product form</p>
        </div>
      )}

      {/* Product modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Product Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paneer Tikka" required />
          </div>
          <Input label="Price (₹)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" required />
          <Input label="Cost Price (₹)" type="number" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="0.00" />
          <Select label="Category" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" />
          <Select label="Tax" value={form.tax_id} onChange={e => setForm(p => ({ ...p, tax_id: e.target.value }))} options={taxes.map(t => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))} placeholder="Select tax" />
          <Input label="Prep Time (mins)" type="number" value={form.prep_time} onChange={e => setForm(p => ({ ...p, prep_time: e.target.value }))} min={1} />
          <div className="col-span-2">
            <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." rows={2} />
          </div>
          <div className="col-span-2 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_veg} onChange={e => setForm(p => ({ ...p, is_veg: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-slate-700 dark:text-slate-300">🟢 Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
              <span className="text-sm text-slate-700 dark:text-slate-300">⭐ Featured</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
          <Button onClick={saveProduct} loading={saving} disabled={!form.name || !form.price} fullWidth>
            {editing ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
