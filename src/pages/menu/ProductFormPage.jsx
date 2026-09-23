import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Leaf, Star, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurant } = useAuth()
  const restaurantId = restaurant?.id

  const [categories, setCategories] = useState([])
  const [taxes, setTaxes] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id)
  
  const [form, setForm] = useState({
    name: '', description: '', price: '', cost_price: '', category_id: '', tax_id: '', image_url: '', is_veg: true, is_available: true, is_featured: false, prep_time: 15,
  })

  // Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const generateCroppedImage = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return
    const image = new Image()
    image.src = cropImageSrc
    await new Promise(resolve => image.onload = resolve)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 400
    canvas.height = 400
    ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 400, 400)
    setForm(p => ({ ...p, image_url: canvas.toDataURL('image/jpeg', 0.8) }))
    setCropModalOpen(false)
    setCropImageSrc(null)
  }

  useEffect(() => {
    if (!restaurantId) return
    supabase.from('categories').select('id, name').eq('restaurant_id', restaurantId).then(({ data }) => setCategories(data || []))
    supabase.from('taxes').select('id, name, rate').eq('restaurant_id', restaurantId).then(({ data }) => setTaxes(data || []))
  }, [restaurantId])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !restaurantId) return
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (data) {
        setForm({
          name: data.name,
          description: data.description || '',
          price: String(data.price),
          cost_price: String(data.cost_price || 0),
          category_id: data.category_id || '',
          tax_id: data.tax_id || '',
          image_url: data.image_url || '',
          is_veg: data.is_veg,
          is_available: data.is_available,
          is_featured: data.is_featured,
          prep_time: data.prep_time || 15
        })
      } else if (error) {
        toast.error('Failed to load product')
        navigate('/menu')
      }
      setLoading(false)
    }
    fetchProduct()
  }, [id, restaurantId, navigate])

  const saveProduct = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    const payload = { ...form, price: parseFloat(form.price), cost_price: parseFloat(form.cost_price) || 0, prep_time: parseInt(form.prep_time), restaurant_id: restaurantId }
    
    let error;
    if (id) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('products').insert(payload)
      error = insertError
    }
    
    if (!error) { 
      toast.success(id ? 'Product updated!' : 'Product added!')
      navigate('/menu')
    } else {
      toast.error(error.message)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/menu')} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {id ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input label="Product Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paneer Tikka" required />
          </div>
          <Input label="Price (₹)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" required />
          <Input label="Cost Price (₹)" type="number" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="0.00" />
          
          <Select label="Category" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} options={categories.map(c => ({ value: c.id, label: c.name }))} placeholder="Select category" />
          <Select label="Tax" value={form.tax_id} onChange={e => setForm(p => ({ ...p, tax_id: e.target.value }))} options={taxes.map(t => ({ value: t.id, label: `${t.name} (${t.rate}%)` }))} placeholder="Select tax" />
          
          <Input label="Prep Time (mins)" type="number" value={form.prep_time} onChange={e => setForm(p => ({ ...p, prep_time: e.target.value }))} min={1} />
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Product Image</label>
            <div className="flex items-center gap-6">
              {form.image_url ? (
                <img src={form.image_url} alt="Preview" className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-400">No image</span>
                </div>
              )}
              <div className="space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      setCropImageSrc(event.target.result)
                      setCropModalOpen(true)
                    }
                    reader.readAsDataURL(file)
                    e.target.value = null
                  }}
                  className="text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer dark:file:bg-primary-900/30 dark:file:text-primary-400 transition-colors"
                />
                {form.image_url && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="block text-red-500 text-sm hover:underline font-medium">Remove Image</button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." rows={3} />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.is_veg} onChange={e => setForm(p => ({ ...p, is_veg: e.target.checked }))} className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"><Leaf className="w-4 h-4 text-emerald-500" /> Vegetarian</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Available for sale</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-600" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"><Star className="w-4 h-4 text-amber-500" /> Featured Item</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={() => navigate('/menu')} className="flex-1 md:flex-none">Cancel</Button>
          <Button onClick={saveProduct} loading={saving} disabled={!form.name || !form.price} className="flex-1 md:flex-none md:w-48">
            {id ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* Crop Modal */}
      <Modal isOpen={cropModalOpen} onClose={() => { setCropModalOpen(false); setCropImageSrc(null) }} title="Crop Image" size="md">
        <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden">
          {cropImageSrc && (
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => { setCropModalOpen(false); setCropImageSrc(null) }} fullWidth>Cancel</Button>
          <Button onClick={generateCroppedImage} fullWidth>Apply Crop</Button>
        </div>
      </Modal>
    </div>
  )
}
