import { create } from 'zustand'
import { calcOrderTotals, calcItemTotal } from '@/utils/calculations'

export const useCartStore = create((set, get) => ({
  // Order meta
  orderId: null,
  orderType: 'dine_in',
  tableId: null,
  tableName: null,
  customerId: null,
  customerName: null,
  notes: '',

  // Cart
  items: [],

  // Financials
  discount: null, // { type: 'percentage'|'fixed', value: number, label: string }
  coupon: null,
  taxRate: 5,
  serviceChargeRate: 5,
  applyRoundOff: true,

  // Computed totals (derived)
  totals: {
    subtotal: 0, discountAmount: 0, taxableAmount: 0,
    taxAmount: 0, cgst: 0, sgst: 0, serviceCharge: 0,
    grandTotal: 0, roundOff: 0, finalTotal: 0,
  },

  // Actions
  setOrderMeta: (meta) => set((s) => ({ ...s, ...meta })),

  addItem: (product, variant = null, modifiers = []) => {
    const { items } = get()
    const key = `${product.id}-${variant?.id || 'default'}-${JSON.stringify(modifiers.map(m => m.option_id).sort())}`

    const existing = items.find(i => i.key === key)
    if (existing) {
      return get().updateQuantity(existing.key, existing.quantity + 1)
    }

    const unitPrice = product.price + (variant?.price_modifier || 0)

    const newItem = {
      key,
      product_id: product.id,
      variant_id: variant?.id || null,
      name: product.name + (variant ? ` (${variant.name})` : ''),
      unit_price: unitPrice,
      quantity: 1,
      modifiers: modifiers.map(m => ({
        modifier_id: m.modifier_id,
        modifier_name: m.modifier_name,
        option_id: m.option_id,
        option_name: m.option_name,
        price: m.price || 0,
      })),
      notes: '',
      tax_rate: product.taxes?.rate || get().taxRate,
    }

    set({ items: [...items, newItem] })
    get()._recalculate()
  },

  updateQuantity: (key, qty) => {
    if (qty <= 0) return get().removeItem(key)
    set(s => ({
      items: s.items.map(i => i.key === key ? { ...i, quantity: qty } : i)
    }))
    get()._recalculate()
  },

  removeItem: (key) => {
    set(s => ({ items: s.items.filter(i => i.key !== key) }))
    get()._recalculate()
  },

  updateItemNotes: (key, notes) => {
    set(s => ({
      items: s.items.map(i => i.key === key ? { ...i, notes } : i)
    }))
  },

  setDiscount: (discount) => {
    set({ discount })
    get()._recalculate()
  },

  setCoupon: (coupon) => {
    set({ coupon })
    get()._recalculate()
  },

  setTaxRate: (rate) => {
    set({ taxRate: rate })
    get()._recalculate()
  },

  setServiceChargeRate: (rate) => {
    set({ serviceChargeRate: rate })
    get()._recalculate()
  },

  _recalculate: () => {
    const { items, discount, coupon, taxRate, serviceChargeRate, applyRoundOff } = get()
    const totals = calcOrderTotals({ items, discount, coupon, taxRate, serviceChargeRate, applyRoundOff })
    set({ totals })
  },

  clearCart: () => set({
    orderId: null,
    tableId: null,
    tableName: null,
    customerId: null,
    customerName: null,
    notes: '',
    items: [],
    discount: null,
    coupon: null,
    totals: {
      subtotal: 0, discountAmount: 0, taxableAmount: 0,
      taxAmount: 0, cgst: 0, sgst: 0, serviceCharge: 0,
      grandTotal: 0, roundOff: 0, finalTotal: 0,
    },
  }),

  loadHeldOrder: (order) => {
    set({
      orderId: order.id,
      orderType: order.type,
      tableId: order.table_id,
      tableName: order.table_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      notes: order.notes || '',
      items: (order.order_items || []).map(item => ({
        key: `${item.product_id}-${item.variant_id || 'default'}-held`,
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        modifiers: item.order_item_modifiers || [],
        notes: item.notes || '',
      })),
    })
    get()._recalculate()
  },
}))
