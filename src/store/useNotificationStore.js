import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  subscription: null,

  fetchNotifications: async (restaurantId) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      set({
        notifications: data,
        unreadCount: data.filter(n => !n.is_read).length,
      })
    }
  },

  markAsRead: async (notificationId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    set(s => ({
      notifications: s.notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllAsRead: async (restaurantId) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('restaurant_id', restaurantId)
      .eq('is_read', false)
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  subscribeToNotifications: (restaurantId) => {
    const sub = supabase
      .channel(`notifications:${restaurantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        set(s => ({
          notifications: [payload.new, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        }))
      })
      .subscribe()

    set({ subscription: sub })
    return sub
  },

  unsubscribe: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
      set({ subscription: null })
    }
  },
}))
