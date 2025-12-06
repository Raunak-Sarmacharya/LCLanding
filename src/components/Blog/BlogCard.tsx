import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { BlogPost } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, getTags, calculateReadingTime } from '../../lib/blogUtils'
import ResponsiveTags from './ResponsiveTags'

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  const { isAdmin } = useAuth()
  
  // Get image URL - use post image_url if available, otherwise generate placeholder
  const getImageUrl = (post: BlogPost) => {
    // Check if image_url exists and is a valid non-empty string
    if (post.image_url && typeof post.image_url === 'string' && post.image_url.trim().length > 0) {
      // Check if it's a valid URL (starts with http:// or https://)
      const trimmedUrl = post.image_url.trim()
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl
      }
    }
    // Generate placeholder image if no image_url provided
    const seed = post.id || post.slug
    return `https://picsum.photos/seed/${seed}/600/400`
  }

  const tags = getTags(post)
  const readingTime = calculateReadingTime(post)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -8 }}
      className="card-hover bg-white rounded-xl xs:rounded-2xl overflow-hidden shadow-brand border border-[var(--color-charcoal)]/5"
    >
      <Link to={`/blog/${post.slug}`} className="block group">
        {/* Blog Image */}
        <div 
          className="relative w-full h-[200px] xs:h-[220px] sm:h-[240px] overflow-hidden bg-[var(--color-cream-dark)]"
        >
          <img 
            src={getImageUrl(post)}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-4 xs:p-5 sm:p-6 md:p-8">
          {/* Author, Date, and Reading Time */}
          <div className="mb-3 xs:mb-4 flex items-center gap-2 xs:gap-2.5 sm:gap-3 flex-wrap text-xs xs:text-sm">
            <span className="font-body text-[var(--color-primary)] font-semibold">
              {post.author_name}
            </span>
            <span className="text-[var(--color-charcoal)]/30">•</span>
            <span className="font-mono text-[10px] xs:text-xs text-[var(--color-charcoal)]/50">
              {readingTime} min read
            </span>
            <span className="text-[var(--color-charcoal)]/30">•</span>
            <time
              dateTime={post.created_at}
              className="font-mono text-[10px] xs:text-xs text-[var(--color-charcoal)]/50 uppercase tracking-wider"
            >
              {formatDate(post.created_at)}
            </time>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-2.5 xs:mb-3" style={{ maxWidth: '100%', minWidth: 0 }}>
              <ResponsiveTags
                tags={tags}
                gap="gap-1.5 xs:gap-2"
                tagClassName="inline-block border border-[var(--color-charcoal)]/20 rounded-md px-1.5 xs:px-2 py-0.5 xs:py-1"
                getTagStyle={(index) => ({
                  background: index === 0 ? 'var(--color-butter)' : 'var(--color-cream-dark)',
                })}
                renderTagContent={(tag) => (
                  <span className="font-mono text-[10px] xs:text-xs uppercase tracking-wide text-[var(--color-charcoal)]">
                    {tag}
                  </span>
                )}
              />
            </div>
          )}

          {/* Title */}
          <h2 className="font-heading text-xl xs:text-2xl sm:text-3xl text-[var(--color-charcoal)] mb-3 xs:mb-4 group-hover:text-[var(--color-primary)] transition-colors duration-300 leading-tight">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="font-body text-sm xs:text-base text-[var(--color-charcoal)]/70 mb-4 xs:mb-5 sm:mb-6 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Read More Link and Edit Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 xs:gap-2 text-[var(--color-primary)] font-body text-sm xs:text-base font-semibold group-hover:gap-2.5 xs:group-hover:gap-3 transition-all duration-300">
              <span>Read More</span>
              <svg
                className="w-4 h-4 xs:w-5 xs:h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
            {/* Edit Button - Admin Only */}
            {isAdmin && (
              <Link
                to={`/blog/${post.slug}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-full font-body font-semibold text-xs transition-all duration-300 hover:scale-105"
                title="Edit this post"
              >
                <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit</span>
              </Link>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

