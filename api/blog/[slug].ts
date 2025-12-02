import { createClient } from '@supabase/supabase-js'

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export default async function handler(req: Request | any) {
  // Only allow GET requests
  // PUBLIC ACCESS: No authentication required - anyone can view published posts
  const method = req.method || (req as Request)?.method
  if (method !== 'GET') {
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

  try {
    // Extract slug from URL - handle both Request object and Vercel format
    let slug: string
    if (req.url) {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      slug = pathParts[pathParts.length - 1]
    } else if (req.query?.slug) {
      slug = req.query.slug
    } else {
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    if (!slug || slug === 'blog' || slug === 'api') {
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
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
    // Fetch the post by slug
    // This query is public and doesn't require authentication
    // First try with published filter, if that fails, try without
    let { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single()

    // If error is about published column, try without the filter
    if (error && (error.message?.includes('published') || error.code === '42703')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (!fallbackError) {
        data = fallbackData
        error = null
      }
    }

    if (error) {
      // If no rows returned, it's a 404
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Post not found' }),
          {
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Failed to fetch blog post', details: error.message }),
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
        JSON.stringify({ error: 'Post not found' }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Filter out unpublished posts in JavaScript (if published is explicitly false)
    // Show post if published is null/undefined/true, hide if explicitly false
    if (data.published === false || data.published === 0 || data.published === '0' || data.published === 'false') {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        {
          status: 404,
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
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
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

