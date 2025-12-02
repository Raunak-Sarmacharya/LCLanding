import type { BlogPost, CreateBlogPostInput } from './types'

// Use absolute URL in production, relative in development
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '/api'
      : `${window.location.origin}/api`)
  : '/api'

/**
 * Fetch all published blog posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const url = `${API_BASE_URL}/blog`
    
    // Add timeout to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let response: Response
    try {
      response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond')
      }
      throw fetchError
    }
    
    if (!response.ok) {
      // If 404 or other error, return empty array instead of throwing
      if (response.status === 404 || response.status >= 500) {
        return []
      }
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
    }
    
    const text = await response.text()
    
    if (!text || text.trim() === '') {
      return []
    }
    
    let data: any
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      return []
    }
    
    // Ensure we always return an array
    const posts = Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : [])
    return posts
  } catch (error) {
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
    throw error
  }
}

/**
 * Create a new blog post (guest posting)
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.details || `Failed to create blog post: ${response.statusText}`)
    }
    
    const text = await response.text()
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server')
    }
    
    let data: any
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      throw new Error('Invalid JSON response from server')
    }
    
    if (!data.post) {
      throw new Error('Invalid response from server: post data missing')
    }
    
    return data.post
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond')
    }
    throw error
  }
}

