import type { BlogPost, CreateBlogPostInput } from './types'

// Use absolute URL in production, relative in development
const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : `${window.location.origin}/api`)
  : '/api'

/**
 * Fetch all published blog posts
 * PUBLIC ACCESS: No authentication required - anyone can view published posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const startTime = Date.now()
  try {
    const url = `${API_BASE_URL}/blog`
    console.log('[getBlogPosts] Fetching from:', url)

    // Add timeout to fetch (30s to ensure API has time to respond - increased from 15s)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response: Response
    try {
      console.log(`[getBlogPosts] Starting fetch to ${url}`)
      response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      })
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime
      console.log(`[getBlogPosts] Response received in ${fetchTime}ms, status: ${response.status}`)
      console.log(`[getBlogPosts] Response headers:`, Object.fromEntries(response.headers.entries()))
      
      // Check if response body is readable
      if (!response.body) {
        console.error('[getBlogPosts] Response body is null or undefined')
        return []
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime
      console.error(`[getBlogPosts] Fetch error after ${fetchTime}ms:`, fetchError)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond')
      }
      // Log more details about the error
      if (fetchError instanceof Error) {
        console.error(`[getBlogPosts] Error details:`, {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
        })
      }
      throw fetchError
    }

    if (!response.ok) {
      // If 404 or other error, return empty array instead of throwing
      console.error(`[getBlogPosts] Response not OK: ${response.status} ${response.statusText}`)
      if (response.status === 404 || response.status >= 500) {
        return []
      }
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
    }

    // Read response body with timeout protection
    let data: any
    try {
      console.log('[getBlogPosts] Starting to read response body...')
      // Use response.json() directly for better performance and error handling
      const jsonPromise = response.json()
      let timeoutHandle: NodeJS.Timeout | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Response body read timeout after 10s')), 10000)
      })
      
      try {
        const bodyStartTime = Date.now()
        data = await Promise.race([jsonPromise, timeoutPromise])
        if (timeoutHandle) clearTimeout(timeoutHandle)
        const bodyReadTime = Date.now() - bodyStartTime
        console.log(`[getBlogPosts] Response body read in ${bodyReadTime}ms`)
        console.log('[getBlogPosts] Parsed response data:', data)
        console.log('[getBlogPosts] data.posts type:', typeof data.posts, 'isArray:', Array.isArray(data.posts))
        console.log('[getBlogPosts] data.posts value:', data.posts)
      } catch (raceError) {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        console.error('[getBlogPosts] Error in Promise.race:', raceError)
        throw raceError
      }
    } catch (readError) {
      const readTime = Date.now() - startTime
      console.error(`[getBlogPosts] Error reading response body after ${readTime}ms:`, readError)
      if (readError instanceof Error) {
        console.error('[getBlogPosts] Read error details:', {
          name: readError.name,
          message: readError.message,
          stack: readError.stack,
        })
      }
      // If we got the response but can't read it, return empty array
      return []
    }

    // Ensure we always return an array
    const posts = Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : [])
    const totalTime = Date.now() - startTime
    console.log(`[getBlogPosts] Success in ${totalTime}ms, returned ${posts.length} posts`)
    console.log('[getBlogPosts] Posts array:', posts)
    return posts
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[getBlogPosts] Error after ${totalTime}ms:`, error)
    // Return empty array instead of throwing to show "No blogs yet"
    return []
  }
}

/**
 * Fetch a single blog post by slug
 * PUBLIC ACCESS: No authentication required - anyone can view published posts
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${slug}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch blog post: ${response.statusText}`)
    }

    const data = await response.json()
    return data.post || null
  } catch (error) {
    throw error
  }
}

/**
 * Create a new blog post (admin only)
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout (same as GET)

  try {
    console.log('[createBlogPost] Starting request')
    
    // Get auth token from Supabase session
    // Supabase stores sessions in localStorage, so we can create a client and get the session
    let authToken: string | null = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      
      if (supabaseUrl && supabaseAnonKey) {
        // Create client with session persistence enabled
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          }
        })
        
        // Get the current session - Supabase reads from localStorage automatically
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('Session error:', sessionError)
        }
        
        authToken = session?.access_token || null
        
        // If no token, wait a brief moment and retry (session might be setting up after login)
        if (!authToken) {
          await new Promise(resolve => setTimeout(resolve, 200))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          authToken = retrySession?.access_token || null
        }
      }
    } catch (authError) {
      console.warn('Failed to get auth token:', authError)
    }

    if (!authToken) {
      throw new Error('Authentication required. Please log in as an admin. If you just logged in, please wait a moment and try again.')
    }

    console.log('[createBlogPost] Fetching to:', `${API_BASE_URL}/blog`)
    
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(input),
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime
      console.log(`[createBlogPost] Response received in ${fetchTime}ms, status: ${response.status}`)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime
      console.error(`[createBlogPost] Fetch error after ${fetchTime}ms:`, fetchError)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond. Your post may have been saved - please check the blog page.')
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || `Failed to create blog post: ${response.statusText}`)
    }

    // Read response body with timeout protection
    let text: string
    try {
      const textPromise = response.text()
      let timeoutHandle: NodeJS.Timeout | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Response body read timeout')), 10000)
      })
      
      try {
        text = await Promise.race([textPromise, timeoutPromise])
        if (timeoutHandle) clearTimeout(timeoutHandle)
      } catch (raceError) {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        throw raceError
      }
    } catch (readError) {
      const readTime = Date.now() - startTime
      console.error(`[createBlogPost] Error reading response body after ${readTime}ms:`, readError)
      throw new Error('Failed to read server response')
    }

    if (!text || text.trim() === '') {
      throw new Error('Empty response from server')
    }

    let data: any
    try {
      data = JSON.parse(text)
      console.log('[createBlogPost] Parsed response data:', data)
    } catch (parseError) {
      console.error('[createBlogPost] JSON parse error:', parseError)
      throw new Error('Invalid JSON response from server')
    }

    if (!data.post) {
      console.error('[createBlogPost] Missing post in response:', data)
      throw new Error('Invalid response from server: post data missing')
    }

    const totalTime = Date.now() - startTime
    console.log(`[createBlogPost] Success in ${totalTime}ms`)
    return data.post
  } catch (error) {
    clearTimeout(timeoutId)
    const totalTime = Date.now() - startTime
    console.error(`[createBlogPost] Error after ${totalTime}ms:`, error)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond. Your post may have been saved - please check the blog page.')
    }
    throw error
  }
}


