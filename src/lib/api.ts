import type { BlogPost, CreateBlogPostInput } from './types'

// Use absolute URL in production, relative in development
const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : `${window.location.origin}/api`)
  : '/api'

/**
 * Fetch all published blog posts with retry logic
 * PUBLIC ACCESS: No authentication required - anyone can view published posts
 */
async function fetchBlogPostsWithRetry(
  url: string,
  retryCount = 0,
  maxRetries = 2
): Promise<BlogPost[]> {
  const attemptStartTime = Date.now()
  const FETCH_TIMEOUT = 15000 // 15 seconds (API responds in <400ms, so this is sufficient)
  const BODY_READ_TIMEOUT = 5000 // 5 seconds for reading response body

  try {
    console.log(`[getBlogPosts] Attempt ${retryCount + 1}/${maxRetries + 1} - Fetching from: ${url}`)

    // Create abort controller for fetch timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`[getBlogPosts] Fetch timeout after ${FETCH_TIMEOUT}ms, aborting...`)
      controller.abort()
    }, FETCH_TIMEOUT)

    let response: Response
    try {
      console.log(`[getBlogPosts] Starting fetch request to: ${url}`)
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
      
      const fetchTime = Date.now() - attemptStartTime
      console.log(`[getBlogPosts] Response received in ${fetchTime}ms, status: ${response.status}`)
      
      // Validate response headers
      const responseHeaders = Object.fromEntries(response.headers.entries())
      const contentType = responseHeaders['content-type'] || ''
      const corsOrigin = responseHeaders['access-control-allow-origin']
      
      console.log(`[getBlogPosts] Response headers:`, {
        'content-type': contentType,
        'content-length': responseHeaders['content-length'] || 'not set',
        'access-control-allow-origin': corsOrigin || 'not set',
      })
      
      // Validate Content-Type
      if (!contentType.includes('application/json')) {
        console.warn(`[getBlogPosts] Unexpected Content-Type: ${contentType}, expected application/json`)
      }
      
      // Validate CORS header
      if (!corsOrigin) {
        console.warn(`[getBlogPosts] Missing CORS header - may cause issues`)
      }
      
      // Check if response body is readable
      if (!response.body) {
        console.error('[getBlogPosts] Response body is null or undefined')
        throw new Error('Response body is not readable')
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - attemptStartTime
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[getBlogPosts] Fetch timeout after ${fetchTime}ms`)
        throw new Error('Request timeout - the server took too long to respond')
      }
      
      console.error(`[getBlogPosts] Fetch error after ${fetchTime}ms:`, {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
      throw fetchError
    }

    // Check response status
    if (!response.ok) {
      const statusTime = Date.now() - attemptStartTime
      console.error(`[getBlogPosts] Response not OK after ${statusTime}ms: ${response.status} ${response.statusText}`)
      
      // For 404 or 500+, return empty array (graceful degradation)
      if (response.status === 404 || response.status >= 500) {
        return []
      }
      throw new Error(`Failed to fetch blog posts: ${response.status} ${response.statusText}`)
    }

    // Read response body with timeout protection
    let data: any
    try {
      console.log('[getBlogPosts] Starting to read response body...')
      const bodyStartTime = Date.now()
      
      // Read response as JSON with timeout
      const jsonPromise = response.json()
      let bodyTimeoutHandle: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        bodyTimeoutHandle = setTimeout(() => {
          console.warn(`[getBlogPosts] Body read timeout after ${BODY_READ_TIMEOUT}ms`)
          reject(new Error('Response body read timeout'))
        }, BODY_READ_TIMEOUT)
      })
      
      try {
        data = await Promise.race([jsonPromise, timeoutPromise])
        if (bodyTimeoutHandle) clearTimeout(bodyTimeoutHandle)
        
        const bodyReadTime = Date.now() - bodyStartTime
        console.log(`[getBlogPosts] Response body read in ${bodyReadTime}ms`)
        console.log('[getBlogPosts] Parsed response data structure:', {
          hasPosts: !!data.posts,
          postsIsArray: Array.isArray(data.posts),
          postsLength: Array.isArray(data.posts) ? data.posts.length : 'N/A',
        })
      } catch (raceError) {
        if (bodyTimeoutHandle) clearTimeout(bodyTimeoutHandle)
        const bodyReadTime = Date.now() - bodyStartTime
        console.error(`[getBlogPosts] Error reading body after ${bodyReadTime}ms:`, raceError)
        throw raceError
      }
    } catch (readError) {
      const readTime = Date.now() - attemptStartTime
      console.error(`[getBlogPosts] Error reading response body after ${readTime}ms:`, {
        name: readError instanceof Error ? readError.name : 'Unknown',
        message: readError instanceof Error ? readError.message : String(readError),
      })
      throw new Error('Failed to read response body')
    }

    // Validate and extract posts
    if (!data || typeof data !== 'object') {
      console.error('[getBlogPosts] Invalid response data structure:', typeof data)
      throw new Error('Invalid response data structure')
    }
    
    const posts = Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : [])
    
    // Validate posts array structure
    if (posts.length > 0) {
      const firstPost = posts[0]
      const requiredFields = ['id', 'title', 'slug']
      const missingFields = requiredFields.filter(field => !(field in firstPost))
      if (missingFields.length > 0) {
        console.warn(`[getBlogPosts] Posts missing required fields: ${missingFields.join(', ')}`)
      }
    }
    
    const totalTime = Date.now() - attemptStartTime
    console.log(`[getBlogPosts] Success in ${totalTime}ms, returned ${posts.length} posts`)
    return posts
  } catch (error) {
    const attemptTime = Date.now() - attemptStartTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
      console.warn(`[getBlogPosts] Attempt ${retryCount + 1} failed after ${attemptTime}ms: ${errorMessage}`)
      console.log(`[getBlogPosts] Retrying in ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchBlogPostsWithRetry(url, retryCount + 1, maxRetries)
    }
    
    // All retries exhausted
    console.error(`[getBlogPosts] All ${maxRetries + 1} attempts failed. Last error after ${attemptTime}ms:`, errorMessage)
    return [] // Return empty array for graceful degradation
  }
}

/**
 * Fetch all published blog posts
 * PUBLIC ACCESS: No authentication required - anyone can view published posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const startTime = Date.now()
  const url = `${API_BASE_URL}/blog`
  
  try {
    console.log('[getBlogPosts] Starting fetch operation')
    const posts = await fetchBlogPostsWithRetry(url)
    const totalTime = Date.now() - startTime
    console.log(`[getBlogPosts] Operation completed in ${totalTime}ms, returning ${posts.length} posts`)
    return posts
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[getBlogPosts] Unexpected error after ${totalTime}ms:`, error)
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


