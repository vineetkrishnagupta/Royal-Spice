import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ROLE_PERMISSIONS } from '@/utils/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)

  const DEFAULT_RESTAURANT_ID = 'a1b2c3d4-0001-0001-0001-000000000001'
  const DEFAULT_BRANCH_ID = 'a1b2c3d4-0002-0001-0001-000000000001'

  const loadProfile = useCallback(async (userId) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*, restaurants(*), branches(*)')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        console.info('Auto-provisioning profile for user:', userId)
        const { data: authUser } = await supabase.auth.getUser()
        const u = authUser?.user
        const name = u?.user_metadata?.name || u?.email?.split('@')[0] || 'User'
        const restaurantName = u?.user_metadata?.restaurant_name || `${name}'s Restaurant`
        const email = u?.email || ''

        // Try calling the RPC setup_new_restaurant to create a unique restaurant
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('setup_new_restaurant', {
          p_restaurant_name: restaurantName,
          p_user_name: name,
        })

        if (!rpcErr && rpcRes?.restaurant_id) {
          const res = await supabase
            .from('profiles')
            .select('*, restaurants(*), branches(*)')
            .eq('id', userId)
            .maybeSingle()
          data = res.data
        } else {
          console.warn('RPC setup_new_restaurant fallback:', rpcErr?.message)
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              restaurant_id: DEFAULT_RESTAURANT_ID,
              branch_id: DEFAULT_BRANCH_ID,
              name,
              email,
              role: 'owner',
              is_active: true,
            })

          if (!insErr) {
            const res = await supabase
              .from('profiles')
              .select('*, restaurants(*), branches(*)')
              .eq('id', userId)
              .maybeSingle()
            data = res.data
          }
        }
      } else if (!data.restaurant_id || !data.restaurants) {
        await supabase
          .from('profiles')
          .update({
            restaurant_id: DEFAULT_RESTAURANT_ID,
            branch_id: DEFAULT_BRANCH_ID,
          })
          .eq('id', userId)

        const res = await supabase
          .from('profiles')
          .select('*, restaurants(*), branches(*)')
          .eq('id', userId)
          .maybeSingle()
        data = res.data
      }

      if (data) {
        setProfile(data)
        setRestaurant(data.restaurants)
        setBranch(data.branches)
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true)
        await loadProfile(session.user.id)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setRestaurant(null)
        setBranch(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async ({ email, password, name, restaurantName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          restaurant_name: restaurantName,
        },
      },
    })
    if (error) throw error

    if (data?.user && data?.session) {
      try {
        await supabase.rpc('setup_new_restaurant', {
          p_restaurant_name: restaurantName || `${name}'s Restaurant`,
          p_user_name: name,
        })
      } catch (e) {
        console.warn('Signup setup_new_restaurant RPC notice:', e)
      }
    }
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const forgotPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(() => {
    if (user?.id) return loadProfile(user.id)
  }, [user, loadProfile])

  const switchBranch = useCallback(async (branchId) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('profiles')
      .update({ branch_id: branchId })
      .eq('id', user.id)
    if (!error) await loadProfile(user.id)
  }, [user, loadProfile])

  // Compute permissions from role
  const permissions = profile
    ? (profile.permissions?.length > 0
        ? profile.permissions
        : ROLE_PERMISSIONS[profile.role] || [])
    : []

  const hasPermission = (permission) => permissions.includes(permission)
  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin'

  const value = {
    session,
    user,
    profile,
    restaurant,
    branch,
    permissions,
    loading,
    isAuthenticated: !!session,
    isOwnerOrAdmin,
    hasPermission,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    updatePassword,
    refreshProfile,
    switchBranch,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
