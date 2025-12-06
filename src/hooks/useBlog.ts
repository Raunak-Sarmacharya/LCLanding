import { useState, useEffect } from 'react'
import { getBlogPosts, getBlogPost } from '../lib/api'
import type { BlogPost } from '../lib/types'

interface UseBlogPostsResult {
  posts: BlogPost[]
  loading: boolean
  error: Error | null
}

interface UseBlogPostResult {
  post: BlogPost | null
  loading: boolean
  error: Error | null
}

/**
 * Utility function to clear the blog posts cache
 * Useful after creating/updating posts to ensure fresh data
 */
export function clearBlogPostsCache(): void {
  try {
    localStorage.removeItem('blog_posts_cache')
    localStorage.removeItem('blog_posts_cache_timestamp')
    console.log('[clearBlogPostsCache] Cache cleared')
  } catch (error) {
    console.warn('[clearBlogPostsCache] Failed to clear cache:', error)
  }
}

/**
 * Hook to fetch all published blog posts with retry logic and caching
 */
export function useBlogPosts(): UseBlogPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const CACHE_KEY = 'blog_posts_cache'
    const CACHE_TIMESTAMP_KEY = 'blog_posts_cache_timestamp'
    const CACHE_DURATION = 1 * 60 * 1000 // 1 minute (reduced from 5 minutes for faster updates)
    
    console.log('[useBlogPosts] Hook initialized')

    // Load cached data immediately (only if not forcing refresh)
    if (refreshKey === 0) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

        if (cachedData && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10)
          if (age < CACHE_DURATION) {
            const parsed = JSON.parse(cachedData)
            console.log('[useBlogPosts] Loaded cached data:', parsed?.length || 0, 'posts')
            if (!cancelled) {
              setPosts(Array.isArray(parsed) ? parsed : [])
              setLoading(false)
            }
          } else {
            console.log('[useBlogPosts] Cached data expired, clearing cache')
            localStorage.removeItem(CACHE_KEY)
            localStorage.removeItem(CACHE_TIMESTAMP_KEY)
          }
        } else {
          console.log('[useBlogPosts] No cached data found')
        }
      } catch (cacheError) {
        console.warn('Failed to load cached blog posts:', cacheError)
      }
    } else {
      // Force refresh - clear cache first
      console.log('[useBlogPosts] Force refresh requested, clearing cache')
      clearBlogPostsCache()
    }

    async function fetchPosts(retryCount = 0) {
      const maxRetries = 2

      try {
        setLoading(true)
        setError(null)
        const data = await getBlogPosts()

        if (!cancelled) {
          const postsArray = Array.isArray(data) ? data : []
          console.log('[useBlogPosts] Setting posts:', postsArray.length, 'posts')
          console.log('[useBlogPosts] Posts data:', postsArray.map(p => ({ id: p.id, title: p.title, image_url: p.image_url })))
          setPosts(postsArray)
          setLoading(false)

          // Cache the successful response
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(postsArray))
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
            console.log('[useBlogPosts] Cached', postsArray.length, 'posts')
          } catch (cacheError) {
            console.warn('Failed to cache blog posts:', cacheError)
          }
        } else {
          console.log('[useBlogPosts] Component cancelled, not setting posts')
        }
      } catch (err) {
        if (!cancelled) {
          // Retry with exponential backoff
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
            console.log(`Retrying blog posts fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
            setTimeout(() => fetchPosts(retryCount + 1), delay)
          } else {
            // After all retries failed, show cached data if available
            const cachedData = localStorage.getItem(CACHE_KEY)
            if (cachedData) {
              try {
                const parsed = JSON.parse(cachedData)
                setPosts(Array.isArray(parsed) ? parsed : [])
                setError(new Error('Using cached data. Unable to fetch latest posts.'))
              } catch {
                setPosts([])
                setError(err instanceof Error ? err : new Error('Failed to fetch posts'))
              }
            } else {
              setPosts([])
              setError(err instanceof Error ? err : new Error('Failed to fetch posts'))
            }
            setLoading(false)
          }
        }
      }
    }

    fetchPosts()

    return () => {
      cancelled = true
    }
  }, [refreshKey]) // Add refreshKey as dependency to force re-fetch

  // Listen for blog post update events to force refresh
  useEffect(() => {
    const handleBlogPostUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[useBlogPosts] Blog post updated event received:', customEvent.detail)
      // Force refresh by incrementing refreshKey
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('blogPostUpdated', handleBlogPostUpdate)
    window.addEventListener('blogPostCreated', handleBlogPostUpdate)

    return () => {
      window.removeEventListener('blogPostUpdated', handleBlogPostUpdate)
      window.removeEventListener('blogPostCreated', handleBlogPostUpdate)
    }
  }, [])

  return { posts, loading, error }
}

/**
 * Hook to fetch a single blog post by slug
 */
export function useBlogPost(slug: string): UseBlogPostResult {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchPost() {
      try {
        setLoading(true)
        setError(null)
        // Add cache-busting by appending refresh key to slug internally
        // The getBlogPost function already handles cache-busting with query params
        const data = await getBlogPost(slug)

        if (!cancelled) {
          setPost(data)
          setLoading(false)
          console.log('[useBlogPost] Post fetched successfully:', data?.title)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useBlogPost] Error fetching post:', err)
          setError(err instanceof Error ? err : new Error('Failed to fetch post'))
          setLoading(false)
        }
      }
    }

    fetchPost()

    return () => {
      cancelled = true
    }
  }, [slug, refreshKey]) // Add refreshKey as dependency to force re-fetch

  // Expose refresh function to force re-fetch
  useEffect(() => {
    // Listen for custom event to refresh post data
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent
      // Only refresh if the slug matches or if no slug is specified in the event
      if (!customEvent.detail?.slug || customEvent.detail.slug === slug) {
        console.log('[useBlogPost] Refreshing post data due to update event')
        // Force a refresh by incrementing the key
        setRefreshKey(prev => prev + 1)
        // Also clear any cached data for this specific post
        try {
          // Clear any post-specific cache if it exists
          localStorage.removeItem(`blog_post_cache_${slug}`)
        } catch (error) {
          console.warn('[useBlogPost] Failed to clear post cache:', error)
        }
      }
    }
    
    window.addEventListener('blogPostUpdated', handleRefresh)
    
    return () => {
      window.removeEventListener('blogPostUpdated', handleRefresh)
    }
  }, [slug]) // Add slug as dependency to ensure handler has latest slug value

  return { post, loading, error }
}

