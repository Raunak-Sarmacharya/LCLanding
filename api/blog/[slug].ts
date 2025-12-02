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

export default async function handler(req: Request) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Extract slug from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = getSupabaseClient()
    // Fetch the post by slug (only published posts)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error) {
      // If no rows returned, it's a 404
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Post not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      console.error('Supabase error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch blog post', details: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ post: data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

