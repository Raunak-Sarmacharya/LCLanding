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
 * Hook to fetch all published blog posts
 */
export function useBlogPosts(): UseBlogPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPosts() {
      try {
        setLoading(true)
        setError(null)
        const data = await getBlogPosts()
        
        if (!cancelled) {
          setPosts(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          // Even on error, set posts to empty array and stop loading
          // This allows UI to show "No blogs yet" instead of error state
          setPosts([])
          setError(null) // Don't show error, just show empty state
          setLoading(false)
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

