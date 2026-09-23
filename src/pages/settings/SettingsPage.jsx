import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, COLOR_THEMES } from '@/contexts/ThemeContext'
import Button from '@/components/ui/Button'
import { Input, Textarea, Switch } from '@/components/ui/Input'
import { cn } from '@/utils/helpers'
import { Building2, ShoppingCart, Printer, Bell, User, Palette, ChevronRight, Monitor, Moon, Sun, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'restaurant', label: 'Restaurant', icon: Building2 },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'profile', label: 'My Profile', icon: User },
]

export default function SettingsPage() {
  const { restaurant, profile, refreshProfile } = useAuth()
  const { themeMode, colorThemeId, customColor, changeThemeMode, changeColorTheme, changeCustomColor } = useTheme()
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

          {activeTab === 'appearance' && (
            <div className="card p-6 space-y-8">
              <h2 className="section-title">Appearance & Theme</h2>

              {/* Dark / Light / System mode */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Display Mode</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light',  label: 'Light',  Icon: Sun },
                    { id: 'dark',   label: 'Dark',   Icon: Moon },
                    { id: 'system', label: 'System', Icon: Monitor },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => changeThemeMode(id)}
                      className={cn(
                        'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                        themeMode === id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-50 dark:hover:bg-slate-800',
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{label}</span>
                      {themeMode === id && <Check className="w-4 h-4 absolute top-2 right-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Color</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Choose a color that matches your restaurant's identity</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COLOR_THEMES.filter(t => t.id !== 'custom').map(theme => {
                    const swatchColor = theme.colors?.[500] || customColor
                    const isActive = colorThemeId === theme.id
                    return (
                      <button
                        key={theme.id}
                        onClick={() => changeColorTheme(theme.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left group',
                          isActive
                            ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 transition-all"
                          style={{
                            background: swatchColor,
                            ringColor: isActive ? swatchColor : 'transparent',
                          }}
                        />
                        <div className="min-w-0">
                          <p className={cn('text-xs font-semibold truncate', isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300')}>{theme.name}</p>
                          <p className="text-xs text-slate-400 truncate">{theme.description}</p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-primary-500 ml-auto flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Custom Color</p>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={e => {
                        changeCustomColor(e.target.value)
                        if (colorThemeId !== 'custom') changeColorTheme('custom')
                      }}
                      className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pick any color</p>
                    <p className="text-xs text-slate-400 mt-0.5">A full palette will be generated automatically</p>
                    <button
                      onClick={() => { changeColorTheme('custom'); changeCustomColor(customColor) }}
                      className={cn(
                        'mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        colorThemeId === 'custom'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20',
                      )}
                    >
                      {colorThemeId === 'custom' ? '✓ Using custom color' : 'Apply custom color'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Strip */}
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Preview</p>
                <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">Primary Button</button>
                    <button className="px-4 py-2 border-2 border-primary-500 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">Outline</button>
                    <span className="px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium rounded-lg">Badge</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
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
