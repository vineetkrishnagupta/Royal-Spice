import { Outlet } from 'react-router-dom'
import { Flame } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/40">
              <Flame className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Royal Spice POS</h1>
          <p className="text-slate-400 text-sm mt-1">Restaurant Point of Sale System</p>
        </div>

        {/* Auth card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} Royal Spice Restaurant · All rights reserved
        </p>
      </div>
    </div>
  )
}
