import type { BlogPost } from './types'

/**
 * Calculate reading time for a blog post
 * Uses content if available, otherwise falls back to excerpt
 * Standard reading speed: 200 words per minute (industry standard)
 * 
 * Based on reading-time library best practices:
 * - Properly strips HTML tags and entities
 * - Handles whitespace and special characters
 * - Uses accurate word boundary detection
 * 
 * @param post - Blog post object with content and/or excerpt
 * @returns Reading time in minutes (minimum 1 minute)
 */
export function calculateReadingTime(post: BlogPost): number {
  // Try to use content first (most accurate)
  let text = post.content || ''
  
  // If content is empty or not available, use excerpt as fallback
  if (!text || text.trim().length === 0) {
    text = post.excerpt || ''
  }
  
  // If still no text, return default reading time
  if (!text || text.trim().length === 0) {
    return 3 // Default to 3 minutes if no content available
  }
  
  // Create a temporary DOM element to properly extract text from HTML
  // This handles HTML entities, nested tags, and preserves word boundaries
  let textContent = ''
  if (typeof document !== 'undefined') {
    // Browser environment - use DOM parser for accurate extraction
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = text
    textContent = tempDiv.textContent || tempDiv.innerText || ''
  } else {
    // Server-side or fallback - use regex to strip HTML
    // Remove script and style tags completely
    textContent = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    textContent = textContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML tags
    textContent = textContent.replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    textContent = textContent
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
  }
  
  // Normalize whitespace - replace multiple spaces/newlines/tabs with single space
  textContent = textContent.replace(/\s+/g, ' ').trim()
  
  // Count words using word boundary detection
  // Split by whitespace and filter out empty strings
  const words = textContent.split(/\s+/).filter(word => {
    // Filter out empty strings and very short "words" that are likely artifacts
    return word.length > 0 && word.trim().length > 0
  })
  
  const wordCount = words.length
  
  // If no words found, return default
  if (wordCount === 0) {
    return 3
  }
  
  // Calculate reading time: 200 words per minute (industry standard, matches reading-time library)
  // This is more conservative than 250 WPM and provides more accurate estimates
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))
  
  return readingTime
}

/**
 * Get all tags from a blog post
 * Returns empty array if no tags
 * 
 * @param post - Blog post object
 * @returns Array of tag strings
 */
export function getTags(post: BlogPost): string[] {
  if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
    return post.tags.map(tag => String(tag).trim()).filter(Boolean)
  }
  return []
}

/**
 * Format date string to readable format
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "January 15, 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

