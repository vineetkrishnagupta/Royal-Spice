import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Search, User, Plus, Phone } from 'lucide-react'
import { formatPhone } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function CustomerSelector({ isOpen, onClose }) {
  const { restaurant } = useAuth()
  const { setOrderMeta } = useCartStore()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddNew, setShowAddNew] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const fetchCustomers = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)
    const q = supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('name')
      .limit(20)

    if (search) q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)

    const { data } = await q
    setCustomers(data || [])
    setLoading(false)
  }, [restaurant?.id, search])

  useEffect(() => {
    if (isOpen) fetchCustomers()
  }, [isOpen, fetchCustomers])

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(t)
  }, [search])

  const selectCustomer = (customer) => {
    setOrderMeta({ customerId: customer.id, customerName: customer.name })
    toast.success(`Customer: ${customer.name}`)
    onClose()
  }

  const clearCustomer = () => {
    setOrderMeta({ customerId: null, customerName: null })
    onClose()
  }

  const addNewCustomer = async () => {
    if (!newCustomer.name) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...newCustomer, restaurant_id: restaurant.id })
        .select()
        .single()
      if (error) throw error
      selectCustomer(data)
      toast.success('Customer added!')
    } catch (err) {
      toast.error(err.message || 'Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Customer" size="md">
      <div className="space-y-4">
        {!showAddNew ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="input-base pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-center text-slate-400 text-sm py-4">Searching...</p>
              ) : customers.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-4">No customers found</p>
              ) : (
                customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                      {c.phone && <p className="text-xs text-slate-400">{formatPhone(c.phone)}</p>}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400">{c.total_orders} orders</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Button variant="outline" onClick={clearCustomer} fullWidth>
                Clear Customer
              </Button>
              <Button onClick={() => setShowAddNew(true)} fullWidth leftIcon={<Plus className="w-4 h-4" />}>
                New Customer
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <input placeholder="Full Name *" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} className="input-base" />
            <input placeholder="Phone Number" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} className="input-base" type="tel" />
            <input placeholder="Email (optional)" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} className="input-base" type="email" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddNew(false)} fullWidth>Back</Button>
              <Button onClick={addNewCustomer} loading={saving} disabled={!newCustomer.name} fullWidth>Add & Select</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
