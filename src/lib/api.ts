import type { BlogPost, CreateBlogPostInput } from './types'

const API_BASE_URL = '/api'

/**
 * Fetch all published blog posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/blog`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.posts || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw error
  }
}

/**
 * Fetch a single blog post by slug
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
    console.error('Error fetching blog post:', error)
    throw error
  }
}

/**
 * Create a new blog post (guest posting)
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  try {
    const response = await fetch(`${API_BASE_URL}/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create blog post: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.post
  } catch (error) {
    console.error('Error creating blog post:', error)
    throw error
  }
}

