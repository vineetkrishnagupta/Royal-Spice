import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import { Input, Textarea, Switch } from '@/components/ui/Input'
import { cn } from '@/utils/helpers'
import { Building2, ShoppingCart, Printer, Bell, User, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'restaurant', label: 'Restaurant', icon: Building2 },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'My Profile', icon: User },
]

export default function SettingsPage() {
  const { restaurant, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('restaurant')
  const [saving, setSaving] = useState(false)
  const [restForm, setRestForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', gstin: '', currency: 'INR',
  })
  const [settings, setSettings] = useState({
    invoice_prefix: 'INV', order_prefix: 'ORD', default_order_type: 'dine_in',
    default_tax_rate: 5, default_service_charge: 5, enable_round_off: true,
    receipt_footer: 'Thank you! Visit again.', show_gstin: true,
    printer_name: '', receipt_width: 80,
    notify_low_stock: true, notify_new_order: true, low_stock_threshold: 10,
  })
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    if (restaurant) {
      setRestForm({ name: restaurant.name || '', address: restaurant.address || '', city: restaurant.city || '', state: restaurant.state || '', pincode: restaurant.pincode || '', phone: restaurant.phone || '', email: restaurant.email || '', gstin: restaurant.gstin || '', currency: restaurant.currency || 'INR' })
    }
    if (profile) {
      setProfileForm({ name: profile.name || '', phone: profile.phone || '' })
    }
    if (restaurant?.id) {
      supabase.from('restaurant_settings').select('*').eq('restaurant_id', restaurant.id).single().then(({ data }) => {
        if (data) setSettings(prev => ({ ...prev, ...data }))
      })
    }
  }, [restaurant, profile])

  const saveRestaurant = async () => {
    setSaving(true)
    const { error } = await supabase.from('restaurants').update(restForm).eq('id', restaurant.id)
    if (!error) { toast.success('Restaurant info saved!') } else { toast.error(error.message) }
    setSaving(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    const { error } = await supabase.from('restaurant_settings')
      .upsert({ ...settings, restaurant_id: restaurant.id })
    if (!error) { toast.success('Settings saved!') } else { toast.error(error.message) }
    setSaving(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(profileForm).eq('id', profile.id)
    if (!error) { toast.success('Profile updated!'); refreshProfile() } else toast.error(error.message)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'restaurant' && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">Restaurant Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1"><Input label="Restaurant Name" value={restForm.name} onChange={e => setRestForm(p => ({ ...p, name: e.target.value }))} /></div>
                <Input label="Phone" value={restForm.phone} onChange={e => setRestForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
                <div className="col-span-2"><Input label="Email" value={restForm.email} onChange={e => setRestForm(p => ({ ...p, email: e.target.value }))} type="email" /></div>
                <div className="col-span-2"><Textarea label="Address" value={restForm.address} onChange={e => setRestForm(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
                <Input label="City" value={restForm.city} onChange={e => setRestForm(p => ({ ...p, city: e.target.value }))} />
                <Input label="State" value={restForm.state} onChange={e => setRestForm(p => ({ ...p, state: e.target.value }))} />
                <Input label="Pincode" value={restForm.pincode} onChange={e => setRestForm(p => ({ ...p, pincode: e.target.value }))} />
                <div className="col-span-2"><Input label="GSTIN" value={restForm.gstin} onChange={e => setRestForm(p => ({ ...p, gstin: e.target.value }))} placeholder="29ABCDE1234F1Z5" /></div>
              </div>
              <Button onClick={saveRestaurant} loading={saving}>Save Changes</Button>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">POS Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Invoice Prefix" value={settings.invoice_prefix} onChange={e => setSettings(p => ({ ...p, invoice_prefix: e.target.value }))} placeholder="INV" />
                <Input label="Order Prefix" value={settings.order_prefix} onChange={e => setSettings(p => ({ ...p, order_prefix: e.target.value }))} placeholder="ORD" />
                <Input label="Default Tax Rate (%)" type="number" value={settings.default_tax_rate} onChange={e => setSettings(p => ({ ...p, default_tax_rate: parseFloat(e.target.value) }))} min={0} max={100} step={0.5} />
                <Input label="Default Service Charge (%)" type="number" value={settings.default_service_charge} onChange={e => setSettings(p => ({ ...p, default_service_charge: parseFloat(e.target.value) }))} min={0} max={100} step={0.5} />
              </div>
              <div className="space-y-3">
                <Switch label="Enable Round Off" checked={settings.enable_round_off} onChange={v => setSettings(p => ({ ...p, enable_round_off: v }))} />
                <Switch label="Show GSTIN on Receipt" checked={settings.show_gstin} onChange={v => setSettings(p => ({ ...p, show_gstin: v }))} />
              </div>
              <Textarea label="Receipt Footer Message" value={settings.receipt_footer} onChange={e => setSettings(p => ({ ...p, receipt_footer: e.target.value }))} rows={2} />
              <Button onClick={saveSettings} loading={saving}>Save Settings</Button>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">Printer Settings</h2>
              <Input label="Printer Name" value={settings.printer_name} onChange={e => setSettings(p => ({ ...p, printer_name: e.target.value }))} placeholder="e.g. Epson TM-T82" hint="System printer name for thermal printing" />
              <Input label="Receipt Width (mm)" type="number" value={settings.receipt_width} onChange={e => setSettings(p => ({ ...p, receipt_width: parseInt(e.target.value) }))} min={58} max={80} step={2} hint="Standard: 80mm or 58mm" />
              <Button onClick={saveSettings} loading={saving}>Save Printer Settings</Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">Notification Preferences</h2>
              <div className="space-y-4">
                <Switch label="Notify on new orders" checked={settings.notify_new_order} onChange={v => setSettings(p => ({ ...p, notify_new_order: v }))} />
                <Switch label="Notify on low stock" checked={settings.notify_low_stock} onChange={v => setSettings(p => ({ ...p, notify_low_stock: v }))} />
                <Input label="Low Stock Threshold (default)" type="number" value={settings.low_stock_threshold} onChange={e => setSettings(p => ({ ...p, low_stock_threshold: parseInt(e.target.value) }))} min={1} hint="Alert when stock falls below this value" />
              </div>
              <Button onClick={saveSettings} loading={saving}>Save Notifications</Button>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card p-6 space-y-5">
              <h2 className="section-title">My Profile</h2>
              <Input label="Full Name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
              <Input label="Phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} type="tel" />
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm">
                <p className="text-slate-400">Email: <span className="text-slate-600 dark:text-slate-300">{profile?.email}</span></p>
                <p className="text-slate-400 mt-1">Role: <span className="text-slate-600 dark:text-slate-300 capitalize">{profile?.role}</span></p>
              </div>
              <Button onClick={saveProfile} loading={saving}>Update Profile</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
