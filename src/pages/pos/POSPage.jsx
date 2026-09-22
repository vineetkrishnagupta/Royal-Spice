import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/helpers'
import { Search, Plus, Minus, Trash2, Receipt, ChevronDown, User, Grid3x3,
  PercentSquare, Tag, Printer, ShoppingBag, Truck, UtensilsCrossed,
  Globe, ClipboardList, X, Check, Leaf, Beef, Star, MessageSquare } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import PaymentModal from './PaymentModal'
import CustomerSelector from './CustomerSelector'
import TableSelector from './TableSelector'
import DiscountModal from './DiscountModal'
import HoldOrdersModal from './HoldOrdersModal'

const ORDER_TYPES = [
  { value: 'dine_in', label: 'Dine In', icon: UtensilsCrossed },
  { value: 'takeaway', label: 'Takeaway', icon: ShoppingBag },
  { value: 'delivery', label: 'Delivery', icon: Truck },
  { value: 'online', label: 'Online', icon: Globe },
]

export default function POSPage() {
  const { restaurant, profile } = useAuth()
  const cart = useCartStore()

  // Data state
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // UI state
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [showCustomer, setShowCustomer] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showHoldOrders, setShowHoldOrders] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const restaurantId = restaurant?.id

  // Fetch categories
  useEffect(() => {
    if (!restaurantId) return
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order', { nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => setCategories(data || []))
  }, [restaurantId])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!restaurantId) {
      setLoadingProducts(false)
      return
    }
    setLoadingProducts(true)
    const query = supabase
      .from('products')
      .select('*, categories(name), taxes(rate)')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('sort_order', { nullsFirst: false })
      .order('created_at', { ascending: false })

    if (selectedCategory !== 'all') query.eq('category_id', selectedCategory)
    if (search) query.ilike('name', `%${search}%`)

    const { data } = await query
    setProducts(data || [])
    setLoadingProducts(false)
  }, [restaurantId, selectedCategory, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleAddToCart = (product) => {
    cart.addItem(product)
    toast.success(`${product.name} added`, { duration: 1000 })
  }

  const handleHoldOrder = async () => {
    if (cart.items.length === 0) return
    setSavingOrder(true)
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .upsert({
          id: cart.orderId || undefined,
          restaurant_id: restaurantId,
          type: cart.orderType,
          status: 'draft',
          table_id: cart.tableId || null,
          customer_id: cart.customerId || null,
          cashier_id: profile?.id,
          subtotal: cart.totals.subtotal,
          discount_type: cart.discount?.type || null,
          discount_value: cart.discount?.value || 0,
          discount_amount: cart.totals.discountAmount,
          tax_amount: cart.totals.taxAmount,
          cgst: cart.totals.cgst,
          sgst: cart.totals.sgst,
          service_charge: cart.totals.serviceCharge,
          round_off: cart.totals.roundOff,
          total: cart.totals.finalTotal,
          notes: cart.notes,
        })
        .select()
        .single()

      if (error) throw error

      // Save/replace order items
      await supabase.from('order_items').delete().eq('order_id', order.id)
      const itemInserts = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
        notes: item.notes,
      }))
      await supabase.from('order_items').insert(itemInserts)

      toast.success('Order held!')
      cart.clearCart()
    } catch (err) {
      toast.error(err.message || 'Failed to hold order')
    } finally {
      setSavingOrder(false)
    }
  }

  const filteredProducts = products

  return (
    <div className="flex h-full gap-0 overflow-hidden flex-col lg:flex-row relative">
      {/* ── Left/Top: Categories ── */}
      <div className="lg:w-44 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex lg:flex-col flex-shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar">
        <div className="flex lg:block px-3 py-2 lg:py-4 gap-2 lg:gap-0 lg:space-y-1 w-max lg:w-full">
          <p className="hidden lg:block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Categories</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'flex-shrink-0 w-auto lg:w-full flex items-center gap-2 px-3 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap',
              selectedCategory === 'all'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            <Grid3x3 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">All Items</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex-shrink-0 w-auto lg:w-full flex items-center gap-2 px-3 py-2 lg:py-2.5 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap',
                selectedCategory === cat.id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {cat.color && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              )}
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Center: Products ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden relative pb-16 lg:pb-0">
        {/* Order type + Search bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-3">
          {/* Order type selector */}
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => cart.setOrderMeta({ orderType: value })}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all border',
                  cart.orderType === value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary-300',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Search className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Floating Cart Button ── */}
      {cart.items.length > 0 && (
        <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button onClick={() => setMobileCartOpen(true)} className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 font-semibold shadow-lg transition-colors flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{cart.items.reduce((acc, item) => acc + item.quantity, 0)} items</span>
            </div>
            <span>View Cart • {formatCurrency(cart.totals.finalTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Right: Cart / Order ── */}
      <div className={cn(
        "bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 z-50",
        "fixed inset-0 lg:relative lg:w-96 transition-transform duration-300",
        mobileCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
           <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
             <ShoppingBag className="w-5 h-5 text-primary-600" />
             Your Order
           </h2>
           <button onClick={() => setMobileCartOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Order Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-800 dark:text-white text-sm">
              {cart.orderId ? 'Resume Order' : 'New Order'}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setShowHoldOrders(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-xs"
                title="Held Orders"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
              {cart.items.length > 0 && (
                <button
                  onClick={() => { if (window.confirm('Clear order?')) cart.clearCart() }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear cart"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customer + Table selectors */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowCustomer(true)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{cart.customerName || 'Add Customer'}</span>
            </button>
            {cart.orderType === 'dine_in' && (
              <button
                onClick={() => setShowTable(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors text-left"
              >
                <Grid3x3 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{cart.tableName || 'Select Table'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 py-12">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cart.items.map((item) => (
                <CartItem key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Order Totals & Actions */}
        {cart.items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            {/* Totals */}
            <div className="px-4 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(cart.totals.subtotal)}</span>
              </div>
              {cart.totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>−{formatCurrency(cart.totals.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>CGST + SGST</span>
                <span>{formatCurrency(cart.totals.cgst + cart.totals.sgst)}</span>
              </div>
              {cart.totals.serviceCharge > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Service Charge</span>
                  <span>{formatCurrency(cart.totals.serviceCharge)}</span>
                </div>
              )}
              {cart.totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-500">
                  <span>Round Off</span>
                  <span>{cart.totals.roundOff > 0 ? '+' : ''}{formatCurrency(cart.totals.roundOff)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">{formatCurrency(cart.totals.finalTotal)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-4 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowDiscount(true)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <PercentSquare className="w-4 h-4" />
                  <span>Discount</span>
                </button>
                <button
                  onClick={handleHoldOrder}
                  disabled={savingOrder}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Hold</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print KOT</span>
                </button>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={() => setShowPayment(true)}
                className="text-base font-bold"
              >
                <Receipt className="w-4.5 h-4.5" />
                Charge {formatCurrency(cart.totals.finalTotal)}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
      <CustomerSelector isOpen={showCustomer} onClose={() => setShowCustomer(false)} />
      <TableSelector isOpen={showTable} onClose={() => setShowTable(false)} />
      <DiscountModal isOpen={showDiscount} onClose={() => setShowDiscount(false)} />
      <HoldOrdersModal isOpen={showHoldOrders} onClose={() => setShowHoldOrders(false)} />
    </div>
  )
}

function ProductCard({ product, onAdd }) {
  return (
    <button
      onClick={() => onAdd(product)}
      className="group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-150 overflow-hidden text-left active:scale-[0.97] shadow-sm hover:shadow-md"
    >
      {/* Image / placeholder */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {product.is_veg ? <Leaf className="w-12 h-12 text-emerald-500" /> : <Beef className="w-12 h-12 text-red-500" />}
          </div>
        )}
        {product.is_featured && (
          <div className="absolute top-1.5 right-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          {product.is_veg ? (
            <div className="w-4 h-4 rounded-sm border-2 border-emerald-600 flex items-center justify-center bg-white">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-sm border-2 border-red-600 flex items-center justify-center bg-white">
              <div className="w-2 h-2 rounded-full bg-red-600" />
            </div>
          )}
        </div>
      </div>

      <div className="p-2.5">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.price)}</span>
          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
            <Plus className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </button>
  )
}

function CartItem({ item }) {
  const { updateQuantity, removeItem, updateItemNotes } = useCartStore()
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
          {item.modifiers?.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {item.modifiers.map(m => m.option_name).join(', ')}
            </p>
          )}
          {item.notes && (
            <p className="text-xs text-slate-400 italic mt-0.5 truncate flex items-center gap-1"><MessageSquare className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{item.notes}</span></p>
          )}
          <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(item.unit_price)} each</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => updateQuantity(item.key, item.quantity - 1)}
            className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:border-red-400 hover:text-red-500 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-6 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.key, item.quantity + 1)}
            className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatCurrency(item.unit_price * item.quantity)}
          </p>
          <button
            onClick={() => removeItem(item.key)}
            className="text-slate-300 hover:text-red-500 transition-colors mt-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
