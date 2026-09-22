/**
 * Central order calculation utility.
 * ALL price calculations must go through these functions.
 * Never duplicate this logic in components.
 */

/**
 * Calculate item total including modifiers
 * @param {Object} item - Cart item
 * @returns {number}
 */
export function calcItemTotal(item) {
  const basePrice = item.unit_price || item.price || 0
  const modifierTotal = (item.modifiers || []).reduce(
    (sum, m) => sum + (m.price || 0),
    0
  )
  return (basePrice + modifierTotal) * (item.quantity || item.qty || 1)
}

/**
 * Calculate item tax amount
 * @param {number} amount - Taxable amount
 * @param {number} taxRate - Tax rate in percentage
 * @returns {number}
 */
export function calcTax(amount, taxRate) {
  return (amount * taxRate) / 100
}

/**
 * Calculate CGST and SGST for GST-registered businesses
 * @param {number} amount
 * @param {number} gstRate - Total GST rate
 * @returns {{ cgst: number, sgst: number }}
 */
export function calcGST(amount, gstRate) {
  const halfRate = gstRate / 2
  return {
    cgst: (amount * halfRate) / 100,
    sgst: (amount * halfRate) / 100,
  }
}

/**
 * Calculate discount amount
 * @param {number} subtotal
 * @param {Object} discount - { type: 'percentage'|'fixed', value: number }
 * @returns {number}
 */
export function calcDiscount(subtotal, discount) {
  if (!discount || !discount.value) return 0
  if (discount.type === 'percentage') {
    return Math.min((subtotal * discount.value) / 100, subtotal)
  }
  return Math.min(discount.value, subtotal)
}

/**
 * Master order calculator — single source of truth
 *
 * Calculation flow:
 *   Subtotal = Σ item totals
 *   Item Discount = per-item discounts
 *   Subtotal After Item Discounts = Subtotal - Item Discounts
 *   Order Discount = on subtotal after item discounts
 *   Taxable Amount = Subtotal - All Discounts
 *   Tax = Σ tax rates on taxable amount
 *   Service Charge = % on taxable amount
 *   Grand Total = Taxable Amount + Tax + Service Charge
 *   Round Off = nearest integer
 *   Final Total = Grand Total + Round Off
 *
 * @param {Object} params
 * @param {Array} params.items - Cart items
 * @param {Object} params.discount - { type, value }
 * @param {number} params.taxRate - Tax percentage
 * @param {number} params.serviceChargeRate - Service charge percentage
 * @param {boolean} params.applyRoundOff - Round to nearest integer
 * @param {Object} params.coupon - { type, value }
 * @returns {Object} Breakdown
 */
export function calcOrderTotals({
  items = [],
  discount = null,
  taxRate = 0,
  serviceChargeRate = 0,
  applyRoundOff = false,
  coupon = null,
}) {
  const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0)

  const discountAmount = calcDiscount(subtotal, discount)
  const couponDiscount = calcDiscount(subtotal - discountAmount, coupon)
  const totalDiscount = discountAmount + couponDiscount

  const taxableAmount = Math.max(subtotal - totalDiscount, 0)
  const taxAmount = calcTax(taxableAmount, taxRate)
  const serviceCharge = (taxableAmount * serviceChargeRate) / 100

  const grandTotal = taxableAmount + taxAmount + serviceCharge
  const roundOff = applyRoundOff ? Math.round(grandTotal) - grandTotal : 0
  const finalTotal = grandTotal + roundOff

  const { cgst, sgst } = calcGST(taxableAmount, taxRate)

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(totalDiscount),
    taxableAmount: round2(taxableAmount),
    taxAmount: round2(taxAmount),
    cgst: round2(cgst),
    sgst: round2(sgst),
    serviceCharge: round2(serviceCharge),
    grandTotal: round2(grandTotal),
    roundOff: round2(roundOff),
    finalTotal: round2(finalTotal),
  }
}

function round2(val) {
  return Math.round(val * 100) / 100
}

/**
 * Calculate change amount for cash payments
 */
export function calcChange(total, amountPaid) {
  return Math.max(0, amountPaid - total)
}

/**
 * Calculate remaining amount for split payments
 */
export function calcRemaining(total, payments) {
  const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  return Math.max(0, total - paid)
}
