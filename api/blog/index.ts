import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper function to get Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Handle GET requests - list all published posts
  if (method === 'GET') {
    try {
      const supabase = getSupabaseClient()

      // Optimized query: select only needed fields and limit results
      const { data: allPosts, error } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, author_name, created_at, updated_at, published')
        .order('created_at', { ascending: false })
        .limit(100) // Limit to 100 most recent posts

      if (error) {
        console.error('Supabase query error:', error)
        return new Response(
          JSON.stringify({ posts: [] }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=60, s-maxage=120', // Cache for 1-2 minutes
            },
          }
        )
      }

      // Filter for published posts - handle boolean, string, and number formats
      const publishedPosts = (allPosts || []).filter(p => {
        const pub = p.published
        if (pub === true || pub === 1 || pub === '1' || pub === 'true') return true
        if (pub === false || pub === 0 || pub === '0' || pub === 'false') return false
        return true
      })

      return new Response(
        JSON.stringify({ posts: publishedPosts }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60, s-maxage=120', // Cache for 1-2 minutes
          },
        }
      )
    } catch (error) {
      console.error('GET /api/blog error:', error)
      return new Response(
        JSON.stringify({ posts: [] }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
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

      const { title, content, excerpt, author_name, slug: providedSlug } = body

      // Validate required fields
      if (!title || !content || !author_name) {
        return new Response(
          JSON.stringify({ error: 'Title, content, and author name are required' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      const supabase = getSupabaseClient()

      // Generate slug if not provided
      const slug = providedSlug || await ensureUniqueSlug(generateSlug(title), supabase)

      // Insert new post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          slug,
          content: content.trim(),
          excerpt: excerpt?.trim() || null,
          author_name: author_name.trim(),
          published: true, // Guest posts are published immediately
        })
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: error.message,
            code: error.code,
            hint: error.hint
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

      if (!data) {
        return new Response(
          JSON.stringify({
            error: 'Failed to create blog post',
            details: 'No data returned from database'
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

      const executionTime = Date.now() - startTime
      console.log(`[POST /api/blog] Success in ${executionTime}ms`)

      return new Response(
        JSON.stringify({ post: data }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
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

