import type { BlogPost, CreateBlogPostInput } from './types'

const API_BASE_URL = '/api'

/**
 * Fetch all published blog posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    console.log('Fetching blog posts from:', `${API_BASE_URL}/blog`)
    const response = await fetch(`${API_BASE_URL}/blog`, {
      cache: 'no-store', // Prevent caching
    })
    
    console.log('Blog posts response status:', response.status, response.statusText)
    
    if (!response.ok) {
      // If 404 or other error, return empty array instead of throwing
      // This allows the UI to show "No blogs yet" instead of an error
      if (response.status === 404 || response.status >= 500) {
        console.warn('Blog API returned error, returning empty array:', response.status, response.statusText)
        return []
      }
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
    }
    
    const data = await response.json().catch((parseError) => {
      // If JSON parsing fails, return empty array
      console.warn('Failed to parse blog posts response:', parseError)
      return { posts: [] }
    })
    
    console.log('Blog posts data received:', {
      hasPosts: !!data.posts,
      postsCount: Array.isArray(data.posts) ? data.posts.length : 0,
      dataKeys: Object.keys(data)
    })
    
    // Ensure we always return an array
    const posts = Array.isArray(data.posts) ? data.posts : []
    console.log('Returning posts:', posts.length)
    
    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    // Return empty array instead of throwing to show "No blogs yet"
    return []
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
      console.error('Failed to create blog post:', response.status, errorData)
      throw new Error(errorData.error || errorData.details || `Failed to create blog post: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Log the response for debugging
    console.log('Blog post created successfully:', data)
    
    if (!data.post) {
      console.error('API response missing post data:', data)
      throw new Error('Invalid response from server: post data missing')
    }
    
    return data.post
  } catch (error) {
    console.error('Error creating blog post:', error)
    throw error
  }
}

