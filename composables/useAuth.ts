import { ref, computed } from 'vue'
import { useSupabase } from '~/utils/supabase'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)

export const useAuth = () => {
  const supabase = useSupabase()
  const isAuthenticated = computed(() => !!user.value)
  
  const initAuth = async () => {
    loading.value = true
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      user.value = session.user
    } else {
      user.value = null
    }
    
    loading.value = false
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    user.value = null
  }

  const getUser = () => user.value

  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })

  return {
    user,
    loading,
    isAuthenticated,
    initAuth,
    signInWithGoogle,
    signOut,
    getUser,
  }
}
