import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/utils/helpers'
import { formatCurrency } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function TableSelector({ isOpen, onClose }) {
  const { restaurant } = useAuth()
  const { setOrderMeta } = useCartStore()
  const [floors, setFloors] = useState([])
  const [tables, setTables] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !restaurant?.id) return
    setLoading(true)
    Promise.all([
      supabase.from('floors').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
      supabase.from('tables').select('*, orders(order_number, total, status)').eq('restaurant_id', restaurant.id).eq('is_active', true).order('number'),
    ]).then(([floorsRes, tablesRes]) => {
      setFloors(floorsRes.data || [])
      setTables(tablesRes.data || [])
      if (floorsRes.data?.length) setSelectedFloor(floorsRes.data[0].id)
      setLoading(false)
    })
  }, [isOpen, restaurant?.id])

  const floorTables = tables.filter(t => t.floor_id === selectedFloor)

  const selectTable = (table) => {
    if (table.status === 'occupied') {
      toast.error('Table is already occupied')
      return
    }
    setOrderMeta({ tableId: table.id, tableName: `Table ${table.number}` })
    toast.success(`Table ${table.number} selected`)
    onClose()
  }

  const clearTable = () => {
    setOrderMeta({ tableId: null, tableName: null })
    onClose()
  }

  const statusColors = {
    available: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500',
    occupied: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 cursor-not-allowed opacity-80',
    reserved: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    billing: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    cleaning: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Table" size="lg">
      {/* Floor tabs */}
      {floors.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloor(floor.id)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                selectedFloor === floor.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300',
              )}
            >
              {floor.name}
            </button>
          ))}
        </div>
      )}

      {/* Tables grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))
        ) : floorTables.map(table => (
          <button
            key={table.id}
            onClick={() => selectTable(table)}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center',
              statusColors[table.status] || statusColors.available,
              table.status === 'available' && 'hover:scale-105 active:scale-95',
            )}
          >
            <p className="text-xl font-bold">{table.number}</p>
            <p className="text-xs font-medium opacity-70 mt-0.5">{table.capacity} seats</p>
            <StatusBadge status={table.status} />
            {table.status === 'occupied' && table.orders?.total && (
              <p className="text-xs font-semibold mt-1">{formatCurrency(table.orders.total)}</p>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        {Object.entries(statusColors).map(([status]) => (
          <div key={status} className="flex items-center gap-1.5">
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={clearTable} fullWidth>Clear Table</Button>
      </div>
    </Modal>
  )
}
