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
  
  while (true) {
    const { data } = await supabaseClient
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (!data) {
      return slug
    }
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export default async function handler(req: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
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
  if (req.method === 'GET') {
    try {
      const supabase = getSupabaseClient()
      
      // Fetch all published posts, ordered by created_at DESC
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
      
      // If no results with boolean true, try without filter and filter manually
      if (!data || data.length === 0) {
        const { data: allPosts } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (allPosts && allPosts.length > 0) {
          // Filter manually in case published is stored as string
          const publishedPosts = allPosts.filter(p => p.published === true || p.published === 'true' || p.published === 1)
          
          return new Response(
            JSON.stringify({ posts: publishedPosts }),
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

      if (error) {
        // Return empty array instead of error to allow UI to show "No blogs yet"
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

      const posts = data || []

      return new Response(
        JSON.stringify({ posts }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } catch (error) {
      // Return empty array instead of error to allow UI to show "No blogs yet"
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
  if (req.method === 'POST') {
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

      // Parse request body - Vercel functions may have body already parsed
      let body: any
      if (req.body) {
        // Body is already parsed by Vercel
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      } else if (typeof req.json === 'function') {
        // Standard Request API
        body = await req.json()
      } else {
        return new Response(
          JSON.stringify({ error: 'Unable to parse request body', details: 'Request body is missing' }),
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

