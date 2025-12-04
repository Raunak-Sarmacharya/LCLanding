import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Configure runtime
export const config = {
  runtime: 'nodejs'
}

// Types matching Supabase schema
interface PostRow {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  author_name: string
  published: boolean
  created_at: string
  updated_at: string
  tags?: string[] | null
}

// Helper function to get Supabase client with timeout
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.')
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('Invalid SUPABASE_URL format')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-client-info': 'localcooks-api',
      },
      fetch: (url, options = {}) => {
        // Add timeout to fetch requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId)
        })
      },
    },
  })
}

// Retry wrapper for Supabase queries
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        // Don't retry on authentication errors
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          throw error
        }
        // Don't retry on validation errors
        if (error.message.includes('violates') || error.message.includes('constraint')) {
          throw error
        }
        // Don't retry on "not found" errors
        if (error.message.includes('PGRST116') || error.message.includes('not found')) {
          throw error
        }
      }
      
      if (attempt < maxRetries) {
        const waitTime = delay * attempt
        console.log(`[Retry] Attempt ${attempt}/${maxRetries} failed, retrying in ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

// Sanitize and validate post data
function sanitizePost(post: any): PostRow | null {
  if (!post || typeof post !== 'object') {
    return null
  }

  // Validate required fields
  if (!post.id || typeof post.id !== 'string') {
    return null
  }

  if (!post.title || typeof post.title !== 'string' || post.title.trim().length === 0) {
    return null
  }

  if (!post.slug || typeof post.slug !== 'string' || post.slug.trim().length === 0) {
    return null
  }

  if (!post.content || typeof post.content !== 'string' || post.content.trim().length === 0) {
    return null
  }

  if (!post.author_name || typeof post.author_name !== 'string' || post.author_name.trim().length === 0) {
    return null
  }

  // Validate dates
  const createdAt = post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString()
  const updatedAt = post.updated_at ? new Date(post.updated_at).toISOString() : createdAt

  // Handle published field - ensure it's boolean
  let published = true
  if (post.published !== undefined && post.published !== null) {
    if (typeof post.published === 'boolean') {
      published = post.published
    } else if (typeof post.published === 'string') {
      published = post.published.toLowerCase() === 'true' || post.published === '1'
    } else if (typeof post.published === 'number') {
      published = post.published === 1
    }
  }

  // Sanitize excerpt - can be null
  let excerpt: string | null = null
  if (post.excerpt !== null && post.excerpt !== undefined) {
    if (typeof post.excerpt === 'string' && post.excerpt.trim().length > 0) {
      excerpt = post.excerpt.trim()
    }
  }

  // Sanitize tags - can be null or array
  let tags: string[] | null = null
  if (post.tags !== null && post.tags !== undefined) {
    if (Array.isArray(post.tags)) {
      tags = post.tags.map(t => String(t).trim()).filter(Boolean)
    } else if (typeof post.tags === 'string') {
      // Handle JSON string format
      try {
        const parsed = JSON.parse(post.tags)
        if (Array.isArray(parsed)) {
          tags = parsed.map(t => String(t).trim()).filter(Boolean)
        }
      } catch {
        // If parsing fails, treat as single tag
        const trimmed = post.tags.trim()
        if (trimmed) tags = [trimmed]
      }
    }
  }

  return {
    id: post.id.trim(),
    title: post.title.trim(),
    slug: post.slug.trim(),
    content: post.content.trim(),
    excerpt,
    author_name: post.author_name.trim(),
    created_at: createdAt,
    updated_at: updatedAt,
    published,
    tags,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Always set JSON headers first to ensure we never return HTML
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  // Only allow GET requests
  // PUBLIC ACCESS: No authentication required - anyone can view published posts
  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  console.log(`[GET /api/blog/[slug]] [${requestId}] Request received at`, new Date().toISOString())
  console.log(`[GET /api/blog/[slug]] [${requestId}] req.query:`, JSON.stringify(req.query))
  console.log(`[GET /api/blog/[slug]] [${requestId}] req.url:`, req.url)

  try {
    // Extract slug from query parameters (Vercel dynamic route)
    // In Vercel, dynamic route params are available in req.query
    let slug: string | null = null
    
    // Try multiple ways to get the slug
    if (req.query?.slug) {
      slug = Array.isArray(req.query.slug) ? req.query.slug[0] : String(req.query.slug)
    } else if (req.url) {
      // Fallback: extract from URL path
      try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        const pathParts = url.pathname.split('/').filter(Boolean)
        // Find slug after 'blog' in path like /api/blog/slug-name
        const blogIndex = pathParts.indexOf('blog')
        if (blogIndex >= 0 && pathParts.length > blogIndex + 1) {
          slug = pathParts[blogIndex + 1]
        } else if (pathParts.length > 0) {
          // Last part might be the slug
          slug = pathParts[pathParts.length - 1]
        }
      } catch (urlError) {
        console.error(`[GET /api/blog/[slug]] [${requestId}] URL parsing error:`, urlError)
      }
    }

    console.log(`[GET /api/blog/[slug]] [${requestId}] Extracted slug:`, slug)

    // Validate slug
    if (!slug || slug.trim().length === 0 || slug === 'blog' || slug === 'api' || slug === 'index') {
      console.error(`[GET /api/blog/[slug]] [${requestId}] Invalid or missing slug`)
      // Headers already set at top of handler
      return res.status(400).json({ error: 'Slug is required', requestId })
    }

    // Sanitize slug
    slug = slug.trim().toLowerCase()

    // Get Supabase client
    let supabase: SupabaseClient
    try {
      supabase = getSupabaseClient()
    } catch (clientError) {
      const executionTime = Date.now() - startTime
      console.error(`[GET /api/blog/[slug]] [${requestId}] Client initialization failed after ${executionTime}ms:`, clientError)
      // Headers already set at top of handler
      return res.status(500).json({ 
        error: 'Server configuration error',
        requestId 
      })
    }

    // Fetch the post by slug with retry
    let queryResult: { data: PostRow | null; error: any }
    try {
      queryResult = await withRetry(async () => {
        // Try to select all columns including tags
        let result = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single()
        
        // If error is about missing tags column, select without it explicitly
        if (result.error && result.error.message?.includes('column') && result.error.message?.includes('tags')) {
          console.warn('[GET /api/blog/[slug]] Tags column not found, fetching without tags')
          result = await supabase
            .from('posts')
            .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published')
            .eq('slug', slug)
            .single()
        }
        
        if (result.error && result.error.code !== 'PGRST116') {
          // Don't throw on "not found" errors, but throw on other errors
          throw new Error(result.error.message || 'Supabase query error')
        }
        
        return result
      }, 3, 500)
    } catch (queryError) {
      const executionTime = Date.now() - startTime
      console.error(`[GET /api/blog/[slug]] [${requestId}] Query failed after ${executionTime}ms:`, queryError)
      // Headers already set at top of handler
      return res.status(500).json({ 
        error: 'Failed to fetch blog post',
        details: queryError instanceof Error ? queryError.message : 'Unknown error',
        requestId 
      })
    }

    const { data, error } = queryResult

    // Handle "not found" error
    if (error && error.code === 'PGRST116') {
      // Headers already set at top of handler
      return res.status(404).json({ error: 'Post not found', requestId })
    }

    // Handle other errors
    if (error) {
      console.error(`[GET /api/blog/[slug]] [${requestId}] Database error:`, error)
      // Headers already set at top of handler
      return res.status(500).json({ 
        error: 'Failed to fetch blog post', 
        details: error.message || 'Database error',
        requestId 
      })
    }

    // Check if data exists
    if (!data) {
      // Headers already set at top of handler
      return res.status(404).json({ error: 'Post not found', requestId })
    }

    // Sanitize the post data
    const sanitizedPost = sanitizePost(data)
    if (!sanitizedPost) {
      console.error(`[GET /api/blog/[slug]] [${requestId}] Failed to sanitize post:`, data)
      // Headers already set at top of handler
      return res.status(500).json({ 
        error: 'Invalid post data',
        requestId 
      })
    }

    // Filter out unpublished posts (if published is explicitly false)
    if (sanitizedPost.published === false) {
      // Headers already set at top of handler
      return res.status(404).json({ error: 'Post not found', requestId })
    }

    const executionTime = Date.now() - startTime
    console.log(`[GET /api/blog/[slug]] [${requestId}] Success in ${executionTime}ms, slug: ${slug}`)

    // Add cache header for successful responses
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600') // Cache for 5-10 minutes

    return res.status(200).json({ post: sanitizedPost })
  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`[GET /api/blog/[slug]] [${requestId}] Unexpected error after ${executionTime}ms:`, {
      message: errorMessage,
      stack: errorStack,
    })
    
    // Headers already set at top of handler
    return res.status(500).json({ 
      error: 'Internal server error',
      requestId 
    })
  }
}

