import { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client for client-side auth
let supabaseClient: SupabaseClient | null = null

const getSupabaseClient = (): SupabaseClient | null => {
  // Return cached client if already initialized
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // Debug logging (only in development or if explicitly enabled)
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    console.log('Supabase initialization check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    })
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const isProduction = import.meta.env.PROD
    console.error('❌ Supabase environment variables not set.')
    if (isProduction) {
      console.error('🔧 For Vercel production:')
      console.error('   1. Go to Vercel Dashboard > Settings > Environment Variables')
      console.error('   2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      console.error('   3. Redeploy your application')
    } else {
      console.error('🔧 Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    }
    return null
  }
  
  if (!supabaseUrl.startsWith('http')) {
    console.error('❌ Invalid Supabase URL. It should start with http:// or https://')
    console.error('   Current value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined')
    return null
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

const supabase = getSupabaseClient()

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const client = getSupabaseClient()
    
    if (!client) {
      setIsLoading(false)
      return
    }

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsAdmin(false)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          // Any logged-in user is an admin
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Any logged-in user is an admin
        setIsAdmin(true)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Try to get client, reinitialize if needed
    const client = getSupabaseClient()
    
    if (!client) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Supabase client not initialized. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
          'Create a .env file in the project root with these variables.'
        )
      }
      throw new Error('Failed to initialize Supabase client. Please check your environment variables.')
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return data
  }

  const logout = async () => {
    const client = getSupabaseClient()
    if (!client) {
      return
    }

    await client.auth.signOut()
  }

  return { isAdmin, isLoading, user, login, logout }
}

