import type { BlogPost, CreateBlogPostInput, UpdateBlogPostInput } from './types'

// Use absolute URL in production, relative in development
const API_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : `${window.location.origin}/api`)
  : '/api'

/**
 * Get Supabase client for direct database access (used in development)
 */
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Fetch blog posts directly from Supabase (for local development)
 */
async function fetchBlogPostsFromSupabase(): Promise<BlogPost[]> {
  const startTime = Date.now()
  console.log('[getBlogPosts] Using direct Supabase connection (development mode)')
  
  try {
    const supabase = await getSupabaseClient()
    
    // Try to select with tags, but handle gracefully if column doesn't exist
    // Include content for accurate reading time calculation
    let result = await supabase
      .from('posts')
      .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, tags')
      .order('created_at', { ascending: false })
      .limit(100)

    let data: any[] | null = null
    let error: any = null

    // If error is about missing tags column, retry without it
    if (result.error && result.error.message?.includes('column') && result.error.message?.includes('tags')) {
      console.warn('[getBlogPosts] Tags column not found, fetching without tags')
      const retryResult = await supabase
        .from('posts')
        .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published')
        .order('created_at', { ascending: false })
        .limit(100)
      
      const { data: retryData, error: retryError } = retryResult
      if (retryError) {
        throw new Error(retryError.message || 'Failed to fetch posts from database')
      }
      
      // Map retry data to include null tags
      data = (retryData || []).map((post: any) => ({ ...post, tags: null }))
      error = null
    } else {
      const resultData = result
      data = resultData.data
      error = resultData.error
    }

    if (error) {
      console.error('[getBlogPosts] Supabase query error:', error)
      throw new Error(error.message || 'Failed to fetch posts from database')
    }

    // Sanitize and validate posts (matching API route logic)
    // Note: List view doesn't include content (matching API behavior)
    const posts: BlogPost[] = []
    for (const post of (data || [])) {
      if (post && post.id && post.title && post.slug && post.author_name) {
        posts.push({
          id: String(post.id).trim(),
          title: String(post.title).trim(),
          slug: String(post.slug).trim(),
          content: post.content ? String(post.content).trim() : '', // Include content for accurate reading time
          excerpt: post.excerpt ? String(post.excerpt).trim() : null,
          author_name: String(post.author_name).trim(),
          created_at: post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString(),
          updated_at: post.updated_at ? new Date(post.updated_at).toISOString() : new Date().toISOString(),
          published: post.published !== undefined ? Boolean(post.published) : true,
          tags: Array.isArray(post.tags) ? post.tags.map((t: any) => String(t).trim()).filter(Boolean) : null,
          image_url: post.image_url ? String(post.image_url).trim() : null,
        })
      }
    }

    const totalTime = Date.now() - startTime
    console.log(`[getBlogPosts] Successfully fetched ${posts.length} posts from Supabase in ${totalTime}ms`)
    return posts
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[getBlogPosts] Error fetching from Supabase after ${totalTime}ms:`, error)
    throw error
  }
}

/**
 * Fetch a single blog post directly from Supabase (for local development)
 */
async function fetchBlogPostFromSupabase(slug: string): Promise<BlogPost | null> {
  const startTime = Date.now()
  console.log(`[getBlogPost] Using direct Supabase connection (development mode) for slug: ${slug}`)
  
  try {
    const supabase = await getSupabaseClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        console.log(`[getBlogPost] Post not found with slug: ${slug}`)
        return null
      }
      console.error('[getBlogPost] Supabase query error:', error)
      throw new Error(error.message || 'Failed to fetch post from database')
    }

    if (!data) {
      return null
    }

    // Sanitize and validate post
    if (!data.id || !data.title || !data.slug || !data.author_name) {
      console.error('[getBlogPost] Invalid post data:', data)
      return null
    }

    const post: BlogPost = {
      id: String(data.id).trim(),
      title: String(data.title).trim(),
      slug: String(data.slug).trim(),
      content: data.content ? String(data.content).trim() : '',
      excerpt: data.excerpt ? String(data.excerpt).trim() : null,
      author_name: String(data.author_name).trim(),
      created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
      updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
      published: data.published !== undefined ? Boolean(data.published) : true,
      tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).trim()).filter(Boolean) : null,
      image_url: data.image_url ? String(data.image_url).trim() : null,
    }

    const totalTime = Date.now() - startTime
    console.log(`[getBlogPost] Successfully fetched post from Supabase in ${totalTime}ms`)
    return post
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[getBlogPost] Error fetching from Supabase after ${totalTime}ms:`, error)
    throw error
  }
}

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
  const FETCH_TIMEOUT = 10000 // 10 seconds (API responds in <400ms, so this is sufficient)
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
      // Add cache-busting query parameter to ensure fresh data
      const cacheBustUrl = `${url}?t=${Date.now()}`
      console.log(`[getBlogPosts] Starting fetch request to: ${cacheBustUrl}`)
      response = await fetch(cacheBustUrl, {
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
      const contentLength = responseHeaders['content-length']
      const corsOrigin = responseHeaders['access-control-allow-origin']

      console.log(`[getBlogPosts] Response headers:`, {
        'content-type': contentType,
        'content-length': contentLength || 'not set',
        'access-control-allow-origin': corsOrigin || 'not set',
      })

      // Warn if Content-Length is missing (may indicate streaming issues)
      if (!contentLength) {
        console.warn(`[getBlogPosts] Missing Content-Length header - may cause streaming issues`)
      }

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
 * 
 * In development mode, calls Supabase directly to bypass API routes.
 * In production, uses API routes for better security and server-side processing.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const startTime = Date.now()
  
  // In development, call Supabase directly to avoid API route issues
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    try {
      console.log('[getBlogPosts] Development mode: Using direct Supabase connection')
      const posts = await fetchBlogPostsFromSupabase()
      const totalTime = Date.now() - startTime
      console.log(`[getBlogPosts] Operation completed in ${totalTime}ms, returning ${posts.length} posts`)
      return posts
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[getBlogPosts] Error in development mode after ${totalTime}ms:`, error)
      // Fallback to API route if direct connection fails
      console.log('[getBlogPosts] Falling back to API route...')
    }
  }

  // Production mode or fallback: use API routes
  const url = `${API_BASE_URL}/blog`
  try {
    console.log('[getBlogPosts] Using API route')
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
 * 
 * In development mode, calls Supabase directly to bypass API routes.
 * In production, uses API routes for better security and server-side processing.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const startTime = Date.now()
  
  // In development, call Supabase directly to avoid API route issues
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    try {
      console.log(`[getBlogPost] Development mode: Using direct Supabase connection for slug: ${slug}`)
      const post = await fetchBlogPostFromSupabase(slug)
      const totalTime = Date.now() - startTime
      console.log(`[getBlogPost] Operation completed in ${totalTime}ms`)
      return post
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[getBlogPost] Error in development mode after ${totalTime}ms:`, error)
      // Fallback to API route if direct connection fails
      console.log('[getBlogPost] Falling back to API route...')
    }
  }

  // Production mode or fallback: use API routes
  const FETCH_TIMEOUT = 10000 // 10 seconds
  
  try {
    console.log(`[getBlogPost] Using API route for slug: ${slug}`)
    
    // Create abort controller for fetch timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn(`[getBlogPost] Fetch timeout after ${FETCH_TIMEOUT}ms, aborting...`)
      controller.abort()
    }, FETCH_TIMEOUT)

    let response: Response
    try {
      // Add cache-busting query parameter to ensure fresh data
      // Use both timestamp and random value to ensure uniqueness
      const cacheBuster = `?t=${Date.now()}&r=${Math.random().toString(36).substr(2, 9)}`
      response = await fetch(`${API_BASE_URL}/blog/${slug}${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        redirect: 'follow',
      })
      clearTimeout(timeoutId)

      const fetchTime = Date.now() - startTime
      console.log(`[getBlogPost] Response received in ${fetchTime}ms, status: ${response.status}`)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[getBlogPost] Fetch timeout after ${fetchTime}ms`)
        throw new Error('Request timeout - the server took too long to respond')
      }

      console.error(`[getBlogPost] Fetch error after ${fetchTime}ms:`, {
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
      throw new Error('Failed to fetch blog post: Network error')
    }

    // Check response status
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[getBlogPost] Post not found (404)`)
        return null
      }
      throw new Error(`Failed to fetch blog post: ${response.status} ${response.statusText}`)
    }

    // Check Content-Type to ensure we're getting JSON, not HTML
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      console.error(`[getBlogPost] Unexpected Content-Type: ${contentType}, expected application/json`)
      
      // Try to read as text to see what we got
      const text = await response.text()
      console.error(`[getBlogPost] Received non-JSON response (first 200 chars):`, text.substring(0, 200))
      
      // If it's HTML (likely a 404 page or error page), return null
      if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE')) {
        throw new Error('Server returned HTML instead of JSON. The blog post may not exist or the API route is misconfigured.')
      }
      
      throw new Error(`Server returned unexpected content type: ${contentType}`)
    }

    // Read response body
    let data: any
    try {
      console.log('[getBlogPost] Starting to read response body...')
      const bodyStartTime = Date.now()
      
      data = await response.json()
      
      const bodyReadTime = Date.now() - bodyStartTime
      console.log(`[getBlogPost] Response body read in ${bodyReadTime}ms`)
      console.log('[getBlogPost] Parsed response data structure:', {
        hasPost: !!data.post,
        postKeys: data.post ? Object.keys(data.post) : [],
      })
    } catch (parseError) {
      const readTime = Date.now() - startTime
      console.error(`[getBlogPost] Error parsing JSON after ${readTime}ms:`, parseError)
      
      // If it's a JSON parse error, try to read as text to see what we got
      try {
        const text = await response.text()
        console.error(`[getBlogPost] Response text (first 500 chars):`, text.substring(0, 500))
        
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. The blog post may not exist or the API route is misconfigured.')
        }
      } catch (textError) {
        // Ignore text read errors
      }
      
      throw new Error('Failed to parse server response as JSON')
    }

    const totalTime = Date.now() - startTime
    console.log(`[getBlogPost] Success in ${totalTime}ms`)
    
    return data.post || null
  } catch (error) {
    const totalTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[getBlogPost] Error after ${totalTime}ms:`, errorMessage)
    throw error
  }
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure unique slug by checking database
 */
async function ensureUniqueSlug(baseSlug: string, supabase: any): Promise<string> {
  let slug = baseSlug
  let counter = 1
  const maxAttempts = 100

  while (counter <= maxAttempts) {
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error checking slug uniqueness:', error?.message)
    }

    if (!data) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Fallback: append timestamp
  return `${baseSlug}-${Date.now()}`
}

/**
 * Create a blog post directly in Supabase (for local development)
 */
async function createBlogPostFromSupabase(input: CreateBlogPostInput): Promise<BlogPost> {
  const startTime = Date.now()
  console.log('[createBlogPost] Using direct Supabase connection (development mode)')
  
  try {
    const supabase = await getSupabaseClient()
    
    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required. Please log in as an admin.')
    }

    // Generate slug if not provided
    let slug: string
    if (input.slug && input.slug.trim()) {
      slug = input.slug.trim()
    } else {
      const baseSlug = generateSlug(input.title)
      slug = await ensureUniqueSlug(baseSlug, supabase)
    }

    // Prepare insert data
    const insertData: any = {
      title: input.title.trim(),
      slug,
      content: input.content.trim(),
      excerpt: input.excerpt?.trim() || null,
      author_name: input.author_name.trim(),
      published: true,
    }

    // Try to include tags if provided, but handle gracefully if column doesn't exist
    if (input.tags && input.tags.length > 0) {
      insertData.tags = input.tags
    }

    // Try to include image_url if provided, but handle gracefully if column doesn't exist
    if (input.image_url && input.image_url.trim()) {
      insertData.image_url = input.image_url.trim()
    }

    // Insert new post - try with tags first
    let result = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single()

    // If error is about missing tags column, retry without tags
    if (result.error && result.error.message?.includes('column') && result.error.message?.includes('tags')) {
      console.warn('[createBlogPost] Tags column not found, inserting without tags')
      const { tags, ...dataWithoutTags } = insertData
      result = await supabase
        .from('posts')
        .insert(dataWithoutTags)
        .select()
        .single()
    }

    const { data, error } = result

    if (error) {
      console.error('[createBlogPost] Supabase insert error:', error)
      throw new Error(error.message || 'Failed to create blog post in database')
    }

    if (!data) {
      throw new Error('No data returned from database')
    }

    // Validate and format response
    if (!data.id || !data.title || !data.slug || !data.author_name) {
      console.error('[createBlogPost] Invalid post data returned:', data)
      throw new Error('Invalid data returned from database')
    }

    const post: BlogPost = {
      id: String(data.id).trim(),
      title: String(data.title).trim(),
      slug: String(data.slug).trim(),
      content: data.content ? String(data.content).trim() : '',
      excerpt: data.excerpt ? String(data.excerpt).trim() : null,
      author_name: String(data.author_name).trim(),
      created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
      updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
      published: data.published !== undefined ? Boolean(data.published) : true,
      tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).trim()).filter(Boolean) : null,
      image_url: data.image_url ? String(data.image_url).trim() : null,
    }

    const totalTime = Date.now() - startTime
    console.log(`[createBlogPost] Successfully created post in Supabase in ${totalTime}ms`)
    return post
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[createBlogPost] Error in development mode after ${totalTime}ms:`, error)
    throw error
  }
}

/**
 * Create a new blog post (admin only)
 * 
 * In development mode, calls Supabase directly to bypass API routes.
 * In production, uses API routes for better security and server-side processing.
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  const startTime = Date.now()
  
  // In development, call Supabase directly to avoid API route issues
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    try {
      console.log('[createBlogPost] Development mode: Using direct Supabase connection')
      const post = await createBlogPostFromSupabase(input)
      const totalTime = Date.now() - startTime
      console.log(`[createBlogPost] Operation completed in ${totalTime}ms`)
      return post
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[createBlogPost] Error in development mode after ${totalTime}ms:`, error)
      // Fallback to API route if direct connection fails
      console.log('[createBlogPost] Falling back to API route...')
    }
  }

  // Production mode or fallback: use API routes
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    console.log('[createBlogPost] Starting request')

    // Get auth token from Supabase session
    let authToken: string | null = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          }
        })

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('Session error:', sessionError)
        }

        authToken = session?.access_token || null

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

/**
 * Update a blog post directly in Supabase (for local development)
 */
async function updateBlogPostFromSupabase(slug: string, input: UpdateBlogPostInput): Promise<BlogPost> {
  const startTime = Date.now()
  console.log(`[updateBlogPost] Using direct Supabase connection (development mode) for slug: ${slug}`)
  
  try {
    const supabase = await getSupabaseClient()
    
    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required. Please log in as an admin.')
    }

    // Check if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (fetchError || !existingPost) {
      throw new Error('Post not found')
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updateData.title = input.title.trim()
    if (input.content !== undefined) updateData.content = input.content.trim()
    if (input.author_name !== undefined) updateData.author_name = input.author_name.trim()
    if (input.excerpt !== undefined) updateData.excerpt = input.excerpt?.trim() || null
    if (input.image_url !== undefined) updateData.image_url = input.image_url?.trim() || null
    if (input.published !== undefined) updateData.published = input.published
    if (input.tags !== undefined) updateData.tags = input.tags && input.tags.length > 0 ? input.tags : null

    // Update post - try with tags first
    let result = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', existingPost.id)
      .select()
      .single()

    // If error is about missing tags column, retry without tags
    if (result.error && result.error.message?.includes('column') && result.error.message?.includes('tags')) {
      console.warn('[updateBlogPost] Tags column not found, updating without tags')
      const { tags, ...dataWithoutTags } = updateData
      result = await supabase
        .from('posts')
        .update(dataWithoutTags)
        .eq('id', existingPost.id)
        .select()
        .single()
    }

    const { data, error } = result

    if (error) {
      console.error('[updateBlogPost] Supabase update error:', error)
      throw new Error(error.message || 'Failed to update blog post in database')
    }

    if (!data) {
      throw new Error('No data returned from database')
    }

    // Validate and format response
    if (!data.id || !data.title || !data.slug || !data.author_name) {
      console.error('[updateBlogPost] Invalid post data returned:', data)
      throw new Error('Invalid data returned from database')
    }

    const post: BlogPost = {
      id: String(data.id).trim(),
      title: String(data.title).trim(),
      slug: String(data.slug).trim(),
      content: data.content ? String(data.content).trim() : '',
      excerpt: data.excerpt ? String(data.excerpt).trim() : null,
      author_name: String(data.author_name).trim(),
      created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
      updated_at: data.updated_at ? new Date(data.updated_at).toISOString() : new Date().toISOString(),
      published: data.published !== undefined ? Boolean(data.published) : true,
      tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t).trim()).filter(Boolean) : null,
      image_url: data.image_url ? String(data.image_url).trim() : null,
    }

    const totalTime = Date.now() - startTime
    console.log(`[updateBlogPost] Successfully updated post in Supabase in ${totalTime}ms`)
    return post
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[updateBlogPost] Error in development mode after ${totalTime}ms:`, error)
    throw error
  }
}

/**
 * Update an existing blog post (admin only)
 * 
 * In development mode, calls Supabase directly to bypass API routes.
 * In production, uses API routes for better security and server-side processing.
 */
export async function updateBlogPost(slug: string, input: UpdateBlogPostInput): Promise<BlogPost> {
  const startTime = Date.now()
  
  // In development, call Supabase directly to avoid API route issues
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    try {
      console.log(`[updateBlogPost] Development mode: Using direct Supabase connection for slug: ${slug}`)
      const post = await updateBlogPostFromSupabase(slug, input)
      const totalTime = Date.now() - startTime
      console.log(`[updateBlogPost] Operation completed in ${totalTime}ms`)
      return post
    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`[updateBlogPost] Error in development mode after ${totalTime}ms:`, error)
      // Fallback to API route if direct connection fails
      console.log('[updateBlogPost] Falling back to API route...')
    }
  }

  // Production mode or fallback: use API routes
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    console.log(`[updateBlogPost] Starting request for slug: ${slug}`)

    // Get auth token from Supabase session
    let authToken: string | null = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          }
        })

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('Session error:', sessionError)
        }

        authToken = session?.access_token || null

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

    console.log('[updateBlogPost] Fetching to:', `${API_BASE_URL}/blog/${slug}`)

    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/blog/${slug}`, {
        method: 'PUT',
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
      console.log(`[updateBlogPost] Response received in ${fetchTime}ms, status: ${response.status}`)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const fetchTime = Date.now() - startTime
      console.error(`[updateBlogPost] Fetch error after ${fetchTime}ms:`, fetchError)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond. Your changes may have been saved - please check the blog page.')
      }
      throw fetchError
    }

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  // Handle validation errors - details might be an array
                  let errorMessage = errorData.error || `Failed to update blog post: ${response.statusText}`
                  if (errorData.details) {
                    if (Array.isArray(errorData.details)) {
                      errorMessage = `${errorMessage}: ${errorData.details.join(', ')}`
                    } else {
                      errorMessage = `${errorMessage}: ${errorData.details}`
                    }
                  }
                  console.error('[updateBlogPost] Error response:', errorData)
                  throw new Error(errorMessage)
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
      console.error(`[updateBlogPost] Error reading response body after ${readTime}ms:`, readError)
      throw new Error('Failed to read server response')
    }

    if (!text || text.trim() === '') {
      throw new Error('Empty response from server')
    }

    let data: any
    try {
      data = JSON.parse(text)
      console.log('[updateBlogPost] Parsed response data:', data)
    } catch (parseError) {
      console.error('[updateBlogPost] JSON parse error:', parseError)
      throw new Error('Invalid JSON response from server')
    }

    if (!data.post) {
      console.error('[updateBlogPost] Missing post in response:', data)
      throw new Error('Invalid response from server: post data missing')
    }

    const totalTime = Date.now() - startTime
    console.log(`[updateBlogPost] Success in ${totalTime}ms`)
    return data.post
  } catch (error) {
    clearTimeout(timeoutId)
    const totalTime = Date.now() - startTime
    console.error(`[updateBlogPost] Error after ${totalTime}ms:`, error)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond. Your changes may have been saved - please check the blog page.')
    }
    throw error
  }
}


