import { supabase } from '../middleware/supabase'

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
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const { data } = await supabase
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

export default async function handler(req: Request) {
  // Handle GET requests - list all published posts
  if (req.method === 'GET') {
    try {
      // Fetch all published posts, ordered by created_at DESC
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch blog posts', details: error.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ posts: data || [] }),
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

  // Handle POST requests - create new post
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const { title, content, excerpt, author_name, slug: providedSlug } = body

      // Validate required fields
      if (!title || !content || !author_name) {
        return new Response(
          JSON.stringify({ error: 'Title, content, and author name are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Generate slug if not provided
      const slug = providedSlug || await ensureUniqueSlug(generateSlug(title))

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
        console.error('Supabase error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create blog post', details: error.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({ post: data }),
        {
          status: 201,
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

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

