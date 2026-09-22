import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, getTableStatusColor } from '@/utils/helpers'
import { Plus, Edit2, Grid3x3, Users, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const TABLE_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'billing', label: 'Billing' },
  { value: 'cleaning', label: 'Cleaning' },
]

export default function TablesPage() {
  const { restaurant } = useAuth()
  const navigate = useNavigate()
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [editTable, setEditTable] = useState(null)
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [showAddTable, setShowAddTable] = useState(false)
  const [newFloorName, setNewFloorName] = useState('')
  const [newTable, setNewTable] = useState({ number: '', capacity: 4 })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!restaurant?.id) return
    setLoading(true)
    const [floorsRes, tablesRes] = await Promise.all([
      supabase.from('floors').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('tables').select('*, orders(order_number, total, created_at, status)').eq('restaurant_id', restaurant.id).order('number'),
    ])
    const floorData = floorsRes.data || []
    setFloors(floorData)
    setTables(tablesRes.data || [])
    if (floorData.length && !selectedFloor) setSelectedFloor(floorData[0].id)
    setLoading(false)
  }, [restaurant?.id])

  useEffect(() => {
    fetchData()
    if (!restaurant?.id) return
    const channel = supabase
      .channel(`tables:${restaurant.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurant.id}` }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const floorTables = tables.filter(t => t.floor_id === selectedFloor)

  const updateTableStatus = async (tableId, status) => {
    const { error } = await supabase.from('tables').update({ status }).eq('id', tableId)
    if (!error) { toast.success(`Table marked as ${status}`); fetchData() }
  }

  const addFloor = async () => {
    if (!newFloorName) return
    setSaving(true)
    const { error } = await supabase.from('floors').insert({
      restaurant_id: restaurant.id, name: newFloorName, sort_order: floors.length,
    })
    if (!error) { toast.success('Floor added'); fetchData(); setShowAddFloor(false); setNewFloorName('') }
    setSaving(false)
  }

  const addTable = async () => {
    if (!newTable.number) return
    setSaving(true)
    const { error } = await supabase.from('tables').insert({
      restaurant_id: restaurant.id, floor_id: selectedFloor, number: newTable.number, capacity: newTable.capacity,
    })
    if (!error) { toast.success('Table added'); fetchData(); setShowAddTable(false); setNewTable({ number: '', capacity: 4 }) }
    setSaving(false)
  }

  const statusColors = {
    available: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    occupied: 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700 text-red-700 dark:text-red-300',
    reserved: 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    billing: 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    cleaning: 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700 text-purple-700 dark:text-purple-300',
  }

  const getElapsed = (createdAt) => {
    const m = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Table Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{tables.filter(t => t.status === 'available').length} available · {tables.filter(t => t.status === 'occupied').length} occupied</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Refresh</Button>
          <Button size="sm" onClick={() => setShowAddTable(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Table</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowAddFloor(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Floor</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(statusColors).map(([status]) => (
          <div key={status} className="flex items-center gap-1.5">
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      {/* Floor tabs */}
      {floors.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                selectedFloor === floor.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-400',
              )}
            >
              {floor.name}
              <span className="ml-2 text-xs opacity-70">({tables.filter(t => t.floor_id === floor.id).length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Tables grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : floorTables.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tables on this floor</p>
          <Button size="sm" className="mt-3" onClick={() => setShowAddTable(true)}>Add Table</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {floorTables.map(table => (
            <div
              key={table.id}
              className={cn(
                'relative rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md active:scale-95',
                statusColors[table.status] || statusColors.available,
              )}
              onClick={() => setEditTable(table)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-black">{table.number}</span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {table.capacity}
                </span>
              </div>

              <StatusBadge status={table.status} />

              {table.status === 'occupied' && table.orders && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs font-bold">#{table.orders.order_number}</p>
                  <p className="text-xs font-semibold">{formatCurrency(table.orders.total || 0)}</p>
                  {table.orders.created_at && (
                    <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {getElapsed(table.orders.created_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table edit modal */}
      <Modal isOpen={!!editTable} onClose={() => setEditTable(null)} title={`Table ${editTable?.number}`} size="sm">
        {editTable && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-400 text-xs">Capacity</p><p className="font-semibold">{editTable.capacity} seats</p></div>
              <div><p className="text-slate-400 text-xs">Status</p><StatusBadge status={editTable.status} /></div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Change Status</p>
              <div className="grid grid-cols-2 gap-2">
                {TABLE_STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { updateTableStatus(editTable.id, opt.value); setEditTable(null) }}
                    disabled={editTable.status === opt.value}
                    className={cn(
                      'py-2 px-3 rounded-lg text-xs font-medium border-2 transition-colors',
                      editTable.status === opt.value
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {editTable.status === 'available' && (
              <Button fullWidth onClick={() => { navigate('/pos'); setEditTable(null) }}>
                Create New Order
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Add floor modal */}
      <Modal isOpen={showAddFloor} onClose={() => setShowAddFloor(false)} title="Add Floor" size="sm">
        <div className="space-y-4">
          <Input label="Floor Name" value={newFloorName} onChange={e => setNewFloorName(e.target.value)} placeholder="e.g. Ground Floor" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddFloor(false)} fullWidth>Cancel</Button>
            <Button onClick={addFloor} loading={saving} disabled={!newFloorName} fullWidth>Add Floor</Button>
          </div>
        </div>
      </Modal>

      {/* Add table modal */}
      <Modal isOpen={showAddTable} onClose={() => setShowAddTable(false)} title="Add Table" size="sm">
        <div className="space-y-4">
          <Input label="Table Number" value={newTable.number} onChange={e => setNewTable(p => ({ ...p, number: e.target.value }))} placeholder="e.g. T-09" />
          <Input label="Capacity (seats)" type="number" value={newTable.capacity} onChange={e => setNewTable(p => ({ ...p, capacity: parseInt(e.target.value) || 4 }))} min={1} max={20} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddTable(false)} fullWidth>Cancel</Button>
            <Button onClick={addTable} loading={saving} disabled={!newTable.number} fullWidth>Add Table</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
