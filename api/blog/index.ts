import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

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
}

interface SanitizedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  author_name: string
  created_at: string
  updated_at: string
  published: boolean
}

// Helper function to get Supabase client with retry support
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

  // Create client with timeout configuration
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-client-info': 'localcooks-api',
      },
      fetch: (url, options = {}) => {
        // Add timeout to fetch requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for Supabase requests
        
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
function sanitizePost(post: any): SanitizedPost | null {
  if (!post || typeof post !== 'object') {
    return null
  }

  // Validate required fields
  if (!post.id || typeof post.id !== 'string') {
    console.warn('[sanitizePost] Invalid or missing id:', post.id)
    return null
  }

  if (!post.title || typeof post.title !== 'string' || post.title.trim().length === 0) {
    console.warn('[sanitizePost] Invalid or missing title:', post.title)
    return null
  }

  if (!post.slug || typeof post.slug !== 'string' || post.slug.trim().length === 0) {
    console.warn('[sanitizePost] Invalid or missing slug:', post.slug)
    return null
  }

  if (!post.author_name || typeof post.author_name !== 'string' || post.author_name.trim().length === 0) {
    console.warn('[sanitizePost] Invalid or missing author_name:', post.author_name)
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

  return {
    id: post.id.trim(),
    title: post.title.trim(),
    slug: post.slug.trim(),
    excerpt,
    author_name: post.author_name.trim(),
    created_at: createdAt,
    updated_at: updatedAt,
    published,
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, supabaseClient: SupabaseClient): Promise<string> {
  let slug = baseSlug
  let counter = 1
  const maxAttempts = 100 // Prevent infinite loops

  while (counter <= maxAttempts) {
    const { data, error } = await supabaseClient
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    // If no data found, slug is unique
    if (!data && error?.code !== 'PGRST116') {
      // If there's an error other than "not found", log it but continue
      console.warn('Error checking slug uniqueness:', error?.message)
    }

    if (!data) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }

  // Fallback: append timestamp if we hit max attempts
  return `${baseSlug}-${Date.now()}`
}

export default async function handler(req: Request | any) {
  // Handle CORS preflight
  const method = req.method || (req as Request)?.method
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      },
    })
  }

  // Handle GET requests - list ALL posts (no filtering)
  // PUBLIC ACCESS: No authentication required - returns all posts including unpublished
  if (method === 'GET') {
    const startTime = Date.now()
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`[GET /api/blog] [${requestId}] Request received at`, new Date().toISOString())

    try {
      // Get Supabase client with retry
      let supabase: SupabaseClient
      try {
        supabase = getSupabaseClient()
      } catch (clientError) {
        const executionTime = Date.now() - startTime
        console.error(`[GET /api/blog] [${requestId}] Client initialization failed after ${executionTime}ms:`, clientError)
        return new Response(
          JSON.stringify({ 
            posts: [], 
            error: 'Server configuration error',
            requestId 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Accept',
              'Cache-Control': 'no-cache',
            },
          }
        )
      }

      // Execute query with retry logic
      let queryResult: { data: PostRow[] | null; error: any }
      try {
        queryResult = await withRetry(async () => {
          const result = await supabase
            .from('posts')
            .select('id, title, slug, excerpt, author_name, created_at, updated_at, published')
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (result.error) {
            throw new Error(result.error.message || 'Supabase query error')
          }
          
          return result
        }, 3, 500)
      } catch (queryError) {
        const executionTime = Date.now() - startTime
        console.error(`[GET /api/blog] [${requestId}] Query failed after ${executionTime}ms:`, queryError)
        
        // Return empty array on error (graceful degradation)
        return new Response(
          JSON.stringify({ 
            posts: [], 
            error: 'Failed to fetch posts',
            requestId 
          }),
          {
            status: 200, // Return 200 to show empty state, not error state
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Accept',
              'Cache-Control': 'no-cache',
            },
          }
        )
      }

      // Sanitize and validate all posts
      const rawPosts = queryResult.data || []
      const sanitizedPosts: SanitizedPost[] = []
      let invalidCount = 0

      for (const post of rawPosts) {
        const sanitized = sanitizePost(post)
        if (sanitized) {
          sanitizedPosts.push(sanitized)
        } else {
          invalidCount++
          console.warn(`[GET /api/blog] [${requestId}] Invalid post skipped:`, post?.id || 'unknown')
        }
      }

      if (invalidCount > 0) {
        console.warn(`[GET /api/blog] [${requestId}] Skipped ${invalidCount} invalid posts`)
      }

      const executionTime = Date.now() - startTime
      console.log(`[GET /api/blog] [${requestId}] Success in ${executionTime}ms, returned ${sanitizedPosts.length} posts (${rawPosts.length} raw, ${invalidCount} invalid)`)

      // Serialize response body - ensure it's fully serialized before creating Response
      const responseData = { posts: sanitizedPosts }
      let responseBody: string
      
      try {
        // Fully serialize the response body before creating Response object
        responseBody = JSON.stringify(responseData)
        const contentLength = new TextEncoder().encode(responseBody).length
        console.log(`[GET /api/blog] [${requestId}] Response body size: ${contentLength} bytes`)
        
        // Verify serialization is complete
        if (!responseBody || responseBody.length === 0) {
          throw new Error('Serialized response body is empty')
        }
      } catch (serializeError) {
        const executionTime = Date.now() - startTime
        console.error(`[GET /api/blog] [${requestId}] Serialization failed after ${executionTime}ms:`, serializeError)
        const errorResponse = JSON.stringify({ 
          posts: [], 
          error: 'Failed to serialize response',
          requestId 
        })
        return new Response(errorResponse, {
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
            'Cache-Control': 'no-cache',
          },
        })
      }

      // Create Response with properly serialized body
      // Ensure response is properly formatted for Vercel serverless functions
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
        'Cache-Control': 'public, max-age=60, s-maxage=120', // Cache for 1-2 minutes
      }
      
      // Validate response before returning
      const responseSize = new TextEncoder().encode(responseBody).length
      console.log(`[GET /api/blog] [${requestId}] Response created:`, {
        status: 200,
        bodySize: `${responseSize} bytes`,
        postsCount: sanitizedPosts.length,
        headers: Object.keys(responseHeaders),
      })
      
      // Create response - ensure body is a proper string
      // Vercel serverless functions work best with string responses
      // Important: Response must be properly formatted for Vercel to stream it correctly
      const response = new Response(responseBody, {
        status: 200,
        statusText: 'OK',
        headers: responseHeaders,
      })
      
      // Ensure response is ready before returning
      // This helps Vercel properly stream the response to the client
      console.log(`[GET /api/blog] [${requestId}] Returning response to client`)
      
      // Return response immediately - Vercel will handle streaming
      return response
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      console.error(`[GET /api/blog] [${requestId}] Unexpected error after ${executionTime}ms:`, {
        message: errorMessage,
        stack: errorStack,
      })
      
      return new Response(
        JSON.stringify({ 
          posts: [], 
          error: 'Internal server error',
          requestId 
        }),
        {
          status: 200, // Return 200 to show empty state
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
            'Cache-Control': 'no-cache',
          },
        }
      )
    }
  }

  // Handle POST requests - create new post
  if (method === 'POST') {
    const startTime = Date.now()
    console.log('[POST /api/blog] Request received at', new Date().toISOString())

    try {
      // Check environment variables first
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        return new Response(
          JSON.stringify({
            error: 'Server configuration error',
            details: 'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Check for admin authentication
      const authHeader = req.headers?.get?.('authorization') || 
                        (req as any).headers?.authorization ||
                        (req as any).headers?.['Authorization']
      
      if (!authHeader) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            details: 'Authentication required. Please log in to create blog posts.'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Verify the auth token and check if user is admin
      const token = authHeader.replace('Bearer ', '').trim()
      
      // Create a Supabase client with the user's token to verify it
      const supabaseUrl = process.env.SUPABASE_URL!
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
      const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      })
      
      // Verify the session by getting the user
      const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser()
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            details: 'Authentication required. Please log in to create blog posts.'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Any authenticated user can create posts (all logged-in users are admins)

      // Use the authenticated supabase client for database operations
      const supabase = supabaseWithAuth

      // Parse request body
      let body: any
      try {
        if (typeof req.json === 'function') {
          body = await req.json()
        } else if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        } else {
          throw new Error('No request body')
        }
      } catch (parseError) {
        return new Response(
          JSON.stringify({ error: 'Unable to parse request body', details: 'Invalid JSON' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Extract and validate fields
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      const content = typeof body.content === 'string' ? body.content.trim() : ''
      const author_name = typeof body.author_name === 'string' ? body.author_name.trim() : ''
      const excerpt = body.excerpt && typeof body.excerpt === 'string' ? body.excerpt.trim() : null
      const providedSlug = body.slug && typeof body.slug === 'string' ? body.slug.trim() : null

      // Validate required fields with detailed error messages
      const validationErrors: string[] = []
      
      if (!title || title.length === 0) {
        validationErrors.push('Title is required and cannot be empty')
      } else if (title.length > 500) {
        validationErrors.push('Title must be 500 characters or less')
      }
      
      if (!content || content.length === 0) {
        validationErrors.push('Content is required and cannot be empty')
      } else if (content.length > 100000) {
        validationErrors.push('Content must be 100,000 characters or less')
      }
      
      if (!author_name || author_name.length === 0) {
        validationErrors.push('Author name is required and cannot be empty')
      } else if (author_name.length > 200) {
        validationErrors.push('Author name must be 200 characters or less')
      }
      
      if (excerpt && excerpt.length > 1000) {
        validationErrors.push('Excerpt must be 1,000 characters or less')
      }
      
      if (providedSlug) {
        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        if (!slugRegex.test(providedSlug)) {
          validationErrors.push('Slug must contain only lowercase letters, numbers, and hyphens')
        }
        if (providedSlug.length > 200) {
          validationErrors.push('Slug must be 200 characters or less')
        }
      }

      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed',
            details: validationErrors 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Generate slug if not provided
      let slug: string
      try {
        slug = providedSlug || await withRetry(
          () => ensureUniqueSlug(generateSlug(title), supabase),
          3,
          500
        )
      } catch (slugError) {
        console.error('[POST /api/blog] Slug generation failed:', slugError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate unique slug',
            details: slugError instanceof Error ? slugError.message : 'Unknown error'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Insert new post with retry
      let insertResult: { data: PostRow | null; error: any }
      try {
        insertResult = await withRetry(async () => {
          const result = await supabase
            .from('posts')
            .insert({
              title,
              slug,
              content,
              excerpt: excerpt || null,
              author_name,
              published: true, // Guest posts are published immediately
            })
            .select()
            .single()
          
          if (result.error) {
            throw new Error(result.error.message || 'Database insert error')
          }
          
          return result
        }, 3, 500)
      } catch (insertError) {
        console.error('[POST /api/blog] Insert failed:', insertError)
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: insertError instanceof Error ? insertError.message : 'Unknown error'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      const { data, error } = insertResult

      if (error) {
        console.error('[POST /api/blog] Database error:', error)
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: error.message || 'Database error',
            code: error.code,
            hint: error.hint
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      if (!data) {
        console.error('[POST /api/blog] No data returned from insert')
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: 'No data returned from database'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Sanitize the returned post
      const sanitizedPost = sanitizePost(data)
      if (!sanitizedPost) {
        console.error('[POST /api/blog] Failed to sanitize created post:', data)
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: 'Invalid data returned from database'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      const executionTime = Date.now() - startTime
      console.log(`[POST /api/blog] Success in ${executionTime}ms, created post: ${sanitizedPost.id}`)

      // Include full content in response (not just sanitized version)
      const responsePost = {
        ...sanitizedPost,
        content: data.content || content, // Include full content
      }

      // Fully serialize response body before creating Response
      const responseBody = JSON.stringify({ post: responsePost })
      const responseSize = new TextEncoder().encode(responseBody).length
      
      const responseHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
      }

      // Create Response - removed Content-Length header to let Vercel handle it
      const response = new Response(responseBody, {
        status: 201,
        headers: responseHeaders,
      })
      
      // Validate response before returning
      console.log(`[POST /api/blog] Response created:`, {
        status: 201,
        bodySize: `${responseSize} bytes`,
        postId: sanitizedPost.id,
        headers: Object.keys(responseHeaders),
      })
      
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: errorMessage
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

