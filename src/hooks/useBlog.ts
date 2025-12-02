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
 * Hook to fetch all published blog posts with retry logic and caching
 */
export function useBlogPosts(): UseBlogPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const CACHE_KEY = 'blog_posts_cache'
    const CACHE_TIMESTAMP_KEY = 'blog_posts_cache_timestamp'
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    // Load cached data immediately
    try {
      const cachedData = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10)
        if (age < CACHE_DURATION) {
          const parsed = JSON.parse(cachedData)
          if (!cancelled) {
            setPosts(Array.isArray(parsed) ? parsed : [])
          }
        }
      }
    } catch (cacheError) {
      console.warn('Failed to load cached blog posts:', cacheError)
    }

    async function fetchPosts(retryCount = 0) {
      const maxRetries = 2

      try {
        setLoading(true)
        setError(null)
        const data = await getBlogPosts()

        if (!cancelled) {
          const postsArray = Array.isArray(data) ? data : []
          setPosts(postsArray)
          setLoading(false)

          // Cache the successful response
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(postsArray))
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
          } catch (cacheError) {
            console.warn('Failed to cache blog posts:', cacheError)
          }
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
        const data = await getBlogPost(slug)

        if (!cancelled) {
          setPost(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch post'))
          setLoading(false)
        }
      }
    }

    fetchPost()

    return () => {
      cancelled = true
    }
  }, [slug])

  return { post, loading, error }
}

