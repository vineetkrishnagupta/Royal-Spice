import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-bold text-white">Check your inbox</h2>
        <p className="text-slate-400 text-sm">
          We've sent a password reset link to <span className="text-primary-400 font-medium">{email}</span>
        </p>
        <Link to="/login" className="block text-sm text-primary-400 hover:text-primary-300 mt-4">
          ← Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Reset password</h2>
        <p className="text-slate-400 text-sm mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              required
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <Link to="/login" className="block text-center text-sm text-slate-500 hover:text-slate-400">
        ← Back to login
      </Link>
    </div>
  )
}
