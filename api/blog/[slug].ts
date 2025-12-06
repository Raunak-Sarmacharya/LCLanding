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
  image_url?: string | null
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
      tags = post.tags.map((t: any) => String(t).trim()).filter(Boolean)
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

  // Sanitize image_url - can be null
  let image_url: string | null = null
  if (post.image_url !== null && post.image_url !== undefined) {
    if (typeof post.image_url === 'string' && post.image_url.trim().length > 0) {
      image_url = post.image_url.trim()
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
    image_url,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CRITICAL: Always set JSON headers first to ensure we never return HTML
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')
    return res.status(204).end()
  }

  // Handle PUT/PATCH requests - update existing post (admin only)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const startTime = Date.now()
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Request received at`, new Date().toISOString())

    try {
      // Check environment variables first
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(500).json({
          error: 'Server configuration error',
          details: 'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.'
        })
      }

      // Check for admin authentication
      const authHeader = req.headers['authorization'] || req.headers['Authorization']

      if (!authHeader) {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(401).json({
          error: 'Unauthorized',
          details: 'Authentication required. Please log in to edit blog posts.'
        })
      }

      // Verify the auth token and check if user is admin
      const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '').trim() : ''

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
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(401).json({
          error: 'Unauthorized',
          details: 'Authentication required. Please log in to edit blog posts.'
        })
      }

      // Any authenticated user can edit posts (all logged-in users are admins)
      const supabase = supabaseWithAuth

      // Extract slug from query parameters
      let slug: string | null = null
      if (req.query?.slug) {
        slug = Array.isArray(req.query.slug) ? req.query.slug[0] : String(req.query.slug)
      } else if (req.url) {
        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
          const pathParts = url.pathname.split('/').filter(Boolean)
          const blogIndex = pathParts.indexOf('blog')
          if (blogIndex >= 0 && pathParts.length > blogIndex + 1) {
            slug = pathParts[blogIndex + 1]
          } else if (pathParts.length > 0) {
            slug = pathParts[pathParts.length - 1]
          }
        } catch (urlError) {
          console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] URL parsing error:`, urlError)
        }
      }

      if (!slug || slug.trim().length === 0 || slug === 'blog' || slug === 'api' || slug === 'index') {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(400).json({ error: 'Slug is required', requestId })
      }

      slug = slug.trim().toLowerCase()

      // Check if post exists
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('id, slug')
        .eq('slug', slug)
        .single()

      if (fetchError || !existingPost) {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(404).json({ error: 'Post not found', requestId })
      }

      // Parse request body
      const body = req.body

      console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Request body type:`, typeof body)
      console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Request body:`, JSON.stringify(body, null, 2))

      if (!body || typeof body !== 'object') {
        console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Invalid request body:`, body)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(400).json({
          error: 'Unable to parse request body',
          details: 'Invalid JSON'
        })
      }

      // Extract and validate fields (all optional for update)
      // Handle empty strings properly - if field is provided (even as empty string), we should validate it
      const title = body.title !== undefined 
        ? (typeof body.title === 'string' ? body.title.trim() : undefined)
        : undefined
      const content = body.content !== undefined
        ? (typeof body.content === 'string' ? body.content.trim() : undefined)
        : undefined
      const author_name = body.author_name !== undefined
        ? (typeof body.author_name === 'string' ? body.author_name.trim() : undefined)
        : undefined
      const excerpt = body.excerpt !== undefined 
        ? (body.excerpt && typeof body.excerpt === 'string' ? body.excerpt.trim() : null)
        : undefined
      const image_url = body.image_url !== undefined
        ? (body.image_url && typeof body.image_url === 'string' ? body.image_url.trim() : null)
        : undefined
      const tags = body.tags !== undefined
        ? (body.tags && Array.isArray(body.tags) 
          ? body.tags.map((t: any) => typeof t === 'string' ? t.trim() : String(t).trim()).filter(Boolean)
          : null)
        : undefined
      const published = body.published !== undefined
        ? (typeof body.published === 'boolean' 
          ? body.published 
          : (typeof body.published === 'string' 
            ? (body.published.toLowerCase() === 'true' || body.published === '1')
            : (typeof body.published === 'number' ? body.published === 1 : undefined)))
        : undefined

      // Validate fields if provided
      const validationErrors: string[] = []

      if (title !== undefined) {
        if (title.length === 0) {
          validationErrors.push('Title cannot be empty')
        } else if (title.length > 500) {
          validationErrors.push('Title must be 500 characters or less')
        }
      }

      if (content !== undefined) {
        if (content.length === 0) {
          validationErrors.push('Content cannot be empty')
        } else if (content.length > 100000) {
          validationErrors.push('Content must be 100,000 characters or less')
        }
      }

      if (author_name !== undefined) {
        if (author_name.length === 0) {
          validationErrors.push('Author name cannot be empty')
        } else if (author_name.length > 200) {
          validationErrors.push('Author name must be 200 characters or less')
        }
      }

      // Excerpt has no character limit - removed per user request

      if (image_url !== undefined && image_url !== null && image_url.length > 0) {
        try {
          new URL(image_url)
        } catch {
          validationErrors.push('Image URL must be a valid URL')
        }
        if (image_url.length > 2000) {
          validationErrors.push('Image URL must be 2000 characters or less')
        }
      }

      if (validationErrors.length > 0) {
        console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Validation errors:`, validationErrors)
        console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Extracted values:`, {
          title: title ? `${title.substring(0, 50)}...` : 'undefined',
          content: content ? `${content.substring(0, 50)}...` : 'undefined',
          author_name: author_name ? `${author_name.substring(0, 50)}...` : 'undefined',
          excerpt: excerpt ? `${excerpt.substring(0, 50)}...` : (excerpt === null ? 'null' : 'undefined'),
          image_url: image_url ? `${image_url.substring(0, 50)}...` : (image_url === null ? 'null' : 'undefined'),
          tags: tags ? JSON.stringify(tags) : (tags === null ? 'null' : 'undefined'),
        })
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        })
      }

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (title !== undefined) updateData.title = title
      if (content !== undefined) updateData.content = content
      if (author_name !== undefined) updateData.author_name = author_name
      if (excerpt !== undefined) updateData.excerpt = excerpt
      if (image_url !== undefined) updateData.image_url = image_url
      // Always set tags explicitly when provided - use empty array to clear, null to remove
      if (tags !== undefined) {
        // Create a new array to ensure we're replacing, not merging
        updateData.tags = tags && tags.length > 0 ? [...tags] : null
      }
      // Always update published if provided - this ensures published status is maintained
      if (published !== undefined) {
        updateData.published = Boolean(published) // Ensure it's a boolean
        console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Setting published to: ${updateData.published}`)
      } else {
        // If published is not provided, default to true to ensure posts stay published when edited
        // This is a safety measure - if the client doesn't specify, we assume they want it published
        updateData.published = true
        console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Published not provided, defaulting to true`)
      }

      // Update post with retry - use a more robust approach
      let updateResult: { data: PostRow | null; error: any }
      try {
        updateResult = await withRetry(async () => {
          console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Updating post with ID: ${existingPost.id}`)
          console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Update data:`, JSON.stringify(updateData, null, 2))
          // Log tags specifically to debug tag replacement
          if (updateData.tags !== undefined) {
            console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Tags update:`, {
              oldTags: existingPost.tags,
              newTags: updateData.tags,
              isNull: updateData.tags === null,
              isArray: Array.isArray(updateData.tags),
              length: Array.isArray(updateData.tags) ? updateData.tags.length : 'N/A'
            })
          }

          // Strategy 1: Try update with select in one query
          let updateQuery = supabase
            .from('posts')
            .update(updateData)
            .eq('id', existingPost.id)

          // Try to update with tags first
          let result = await updateQuery
            .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, tags, image_url')
            .single()

          // If error is about missing tags column, retry without tags
          if (result.error && result.error.message?.includes('column') && result.error.message?.includes('tags')) {
            console.warn(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Tags column not found, updating without tags`)
            const { tags, ...dataWithoutTags } = updateData
            result = await supabase
              .from('posts')
              .update(dataWithoutTags)
              .eq('id', existingPost.id)
              .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, image_url')
              .single()
          }

          // Strategy 2: If select fails, update first then fetch separately
          if (result.error && (result.error.message?.includes('coerce') || result.error.message?.includes('single') || result.error.message?.includes('row') || result.error.message?.includes('No rows'))) {
            console.warn(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Select failed, trying update then separate fetch. Error: ${result.error.message}`)
            
            // First, perform the update without select - Supabase update returns count or data
            const updateOnly = await supabase
              .from('posts')
              .update(updateData)
              .eq('id', existingPost.id)

            if (updateOnly.error) {
              console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Update failed:`, updateOnly.error)
              throw new Error(updateOnly.error.message || 'Database update error')
            }

            // Wait a brief moment for the update to propagate in the database
            await new Promise(resolve => setTimeout(resolve, 150))

            console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Update command completed successfully`)

            // Then fetch the updated row separately
            console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Fetching updated post separately`)
            const fetchResult = await supabase
              .from('posts')
              .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, tags, image_url')
              .eq('id', existingPost.id)
              .single()

            if (fetchResult.error) {
              console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Failed to fetch updated post:`, fetchResult.error)
              // If single() fails, try without it
              const fetchArray = await supabase
                .from('posts')
                .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, tags, image_url')
                .eq('id', existingPost.id)
                .limit(1)

              if (fetchArray.error) {
                throw new Error(`Update succeeded but failed to fetch updated row: ${fetchArray.error.message}`)
              }

              if (!fetchArray.data || fetchArray.data.length === 0) {
                throw new Error('Update succeeded but no rows found when fetching updated post (possible RLS issue)')
              }

              return { data: fetchArray.data[0], error: null }
            }

            return fetchResult
          }

          if (result.error) {
            console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Update error:`, result.error)
            throw new Error(result.error.message || 'Database update error')
          }

          if (!result.data) {
            console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Update succeeded but no data returned`)
            // Try fetching separately as fallback
            const fetchResult = await supabase
              .from('posts')
              .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, tags, image_url')
              .eq('id', existingPost.id)
              .single()

            if (fetchResult.error || !fetchResult.data) {
              throw new Error('Update succeeded but failed to retrieve updated data')
            }

            return fetchResult
          }

          return result
        }, 3, 500)
      } catch (updateError) {
        console.error('[PUT/PATCH /api/blog/[slug]] Update failed:', updateError)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(500).json({
          error: 'Failed to update blog post',
          details: updateError instanceof Error ? updateError.message : 'Unknown error'
        })
      }

      const { data, error } = updateResult

      if (error) {
        console.error('[PUT/PATCH /api/blog/[slug]] Database error:', error)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(500).json({
          error: 'Failed to update blog post',
          details: error.message || 'Database error',
          code: error.code,
          hint: error.hint
        })
      }

      if (!data) {
        console.error('[PUT/PATCH /api/blog/[slug]] No data returned from update')
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(500).json({
          error: 'Failed to update blog post',
          details: 'No data returned from database'
        })
      }

      // Sanitize the returned post
      const sanitizedPost = sanitizePost(data)
      if (!sanitizedPost) {
        console.error(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Failed to sanitize updated post:`, data)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        return res.status(500).json({
          error: 'Failed to update blog post',
          details: 'Invalid data returned from database'
        })
      }

      const executionTime = Date.now() - startTime
      console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Success in ${executionTime}ms, updated post: ${sanitizedPost.id}`)
      console.log(`[PUT/PATCH /api/blog/[slug]] [${requestId}] Updated post data:`, {
        id: sanitizedPost.id,
        title: sanitizedPost.title,
        author_name: sanitizedPost.author_name,
        slug: sanitizedPost.slug,
        excerpt: sanitizedPost.excerpt?.substring(0, 50) + '...',
      })

      // Include full content and image_url in response - use database values
      const responsePost = {
        ...sanitizedPost,
        // Ensure we use the actual database values, not the input values
        content: data.content || sanitizedPost.content,
        image_url: data.image_url !== undefined ? data.image_url : sanitizedPost.image_url,
        title: data.title || sanitizedPost.title,
        author_name: data.author_name || sanitizedPost.author_name,
        excerpt: data.excerpt !== undefined ? data.excerpt : sanitizedPost.excerpt,
      }

      // Set headers and return response
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization')

      return res.status(200).json({ post: responsePost })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(500).json({
        error: 'Internal server error',
        details: errorMessage
      })
    }
  }

  // Only allow GET, PUT, PATCH requests
  // PUBLIC ACCESS: No authentication required - anyone can view published posts
  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS')
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
            .select('id, title, slug, content, excerpt, author_name, created_at, updated_at, published, image_url')
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

    // Add cache header for successful responses - reduced cache time for faster updates
    // Use no-cache for individual posts to ensure updates are visible immediately
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

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

