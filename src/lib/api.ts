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
    
    const text = await response.text()
    console.log('Blog posts raw response:', text.substring(0, 500))
    
    let data: any
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse blog posts response:', parseError, 'Raw text:', text)
      return []
    }
    
    console.log('Blog posts data received:', {
      hasPosts: !!data.posts,
      postsCount: Array.isArray(data.posts) ? data.posts.length : 0,
      dataKeys: Object.keys(data),
      fullData: data
    })
    
    // Ensure we always return an array
    const posts = Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : [])
    console.log('Returning posts:', posts.length, 'Posts:', posts)
    
    if (posts.length > 0) {
      console.log('First post sample:', {
        id: posts[0].id,
        title: posts[0].title,
        published: posts[0].published,
        author_name: posts[0].author_name,
        hasAllFields: !!(posts[0].id && posts[0].title && posts[0].content),
        allKeys: Object.keys(posts[0])
      })
      
      // Validate post structure matches BlogPost interface
      const requiredFields = ['id', 'title', 'slug', 'content', 'author_name', 'published', 'created_at', 'updated_at']
      const missingFields = requiredFields.filter(field => !(field in posts[0]))
      if (missingFields.length > 0) {
        console.warn('Post missing required fields:', missingFields)
      }
    }
    
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

