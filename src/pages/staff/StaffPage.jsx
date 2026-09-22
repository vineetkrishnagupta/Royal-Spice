import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime, formatPhone } from '@/utils/formatters'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { Plus, Edit2, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20
const ROLES = ['owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery']
const ROLE_COLORS = { owner: 'purple', admin: 'red', manager: 'blue', cashier: 'green', waiter: 'orange', kitchen: 'yellow', delivery: 'teal' }

export default function StaffPage() {
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', role: 'cashier', is_active: true })

  const fetchStaff = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    let q = supabase.from('profiles').select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId).order('name')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (search) q = q.ilike('name', `%${search}%`)
    const { data, count } = await q
    setStaff(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [restaurantId, search, page])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, phone: s.phone || '', role: s.role, is_active: s.is_active })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name || !editing) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', editing.id)
    if (!error) { toast.success('Staff updated!'); fetchStaff(); setShowModal(false) }
    else toast.error(error.message)
    setSaving(false)
  }

  const toggleActive = async (member) => {
    await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id)
    toast.success(member.is_active ? 'Staff deactivated' : 'Staff activated')
    fetchStaff()
  }

  const columns = [
    { header: 'Staff Member', cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar name={r.name} src={r.avatar_url} size="sm" />
        <div>
          <p className="text-sm font-medium">{r.name}</p>
          {r.email && <p className="text-xs text-slate-400">{r.email}</p>}
        </div>
      </div>
    )},
    { header: 'Role', cell: (r) => <Badge color={ROLE_COLORS[r.role] || 'gray'} className="capitalize">{r.role}</Badge> },
    { header: 'Phone', cell: (r) => <span className="text-sm text-slate-400">{r.phone ? formatPhone(r.phone) : '—'}</span> },
    { header: 'Last Login', cell: (r) => <span className="text-xs text-slate-400">{r.last_login ? formatDateTime(r.last_login) : 'Never'}</span> },
    { header: 'Status', cell: (r) => <Badge color={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', cell: (r) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => toggleActive(r)} className={`p-1.5 rounded-lg ${r.is_active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
          {r.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
        </button>
      </div>
    ), width: 80 },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} team members</p>
        </div>
      </div>

      {/* Role distribution */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {ROLES.map(role => {
          const count = staff.filter(s => s.role === role).length
          return (
            <div key={role} className="card p-3 text-center">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{count}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          )
        })}
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search staff..." className="w-64" />

      <DataTable columns={columns} data={staff} loading={loading} emptyMessage="No staff found" />
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">ℹ️ To add new staff members, invite them via Supabase Auth. Staff accounts are created when users sign up with your restaurant's invitation link.</p>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Staff Member" size="sm">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
          <Select label="Role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
            <Button onClick={save} loading={saving} disabled={!form.name} fullWidth>Update Staff</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
