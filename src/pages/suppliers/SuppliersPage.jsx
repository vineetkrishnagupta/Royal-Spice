import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, Phone, Mail, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

export default function SuppliersPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '', address: '', gstin: '', notes: '' })

  const fetchSuppliers = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    let q = supabase.from('suppliers').select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId).order('name')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (search) q = q.ilike('name', `%${search}%`)
    const { data, count } = await q
    setSuppliers(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [restaurantId, search, page])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', gstin: s.gstin || '', notes: s.notes || '' }); setShowModal(true) }
  const openAdd = () => { setEditing(null); setForm({ name: '', contact_name: '', phone: '', email: '', address: '', gstin: '', notes: '' }); setShowModal(true) }

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    const { error } = editing
      ? await supabase.from('suppliers').update(form).eq('id', editing.id)
      : await supabase.from('suppliers').insert({ ...form, restaurant_id: restaurantId })
    if (!error) { toast.success(editing ? 'Updated!' : 'Added!'); fetchSuppliers(); setShowModal(false) } else toast.error(error.message)
    setSaving(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this supplier?')) return
    await supabase.from('suppliers').update({ is_active: false }).eq('id', id)
    toast.success('Supplier removed')
    fetchSuppliers()
  }

  const columns = [
    { header: 'Supplier', cell: (r) => <div><p className="font-medium text-sm">{r.name}</p>{r.contact_name && <p className="text-xs text-slate-400">{r.contact_name}</p>}</div> },
    { header: 'Phone', cell: (r) => r.phone ? <div className="flex items-center gap-1 text-sm text-slate-500"><Phone className="w-3.5 h-3.5" />{r.phone}</div> : <span className="text-slate-300">—</span> },
    { header: 'Email', cell: (r) => r.email ? <div className="flex items-center gap-1 text-sm text-slate-500"><Mail className="w-3.5 h-3.5" />{r.email}</div> : <span className="text-slate-300">—</span> },
    { header: 'GSTIN', cell: (r) => <span className="text-xs text-slate-400 font-mono">{r.gstin || '—'}</span> },
    { header: 'Status', cell: (r) => <Badge color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (r) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => remove(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), width: 80 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} suppliers</p>
        </div>
        <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>Add Supplier</Button>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search suppliers..." className="w-64" />
      <DataTable columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers found" />
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Company Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
          <Input label="Contact Person" value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          <Input label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" />
          <Input label="GSTIN" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} />
          <div className="col-span-2"><Textarea label="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
          <div className="col-span-2"><Textarea label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={!form.name} fullWidth>{editing ? 'Update' : 'Add Supplier'}</Button>
        </div>
      </Modal>
    </div>
  )
}
