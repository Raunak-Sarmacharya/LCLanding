import { motion } from 'motion/react'
import type { BlogPost } from '../../lib/types'

interface BlogPostViewProps {
  post: BlogPost
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Convert plain text content to paragraphs
  const formatContent = (content: string) => {
    // Split by double newlines to create paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
    return paragraphs
  }

  const paragraphs = formatContent(post.content)

  return (
    <article className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-brand-lg border border-[var(--color-charcoal)]/5">
      {/* Author and Date */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="font-body text-base text-[var(--color-primary)] font-semibold">
          {post.author_name}
        </span>
        <span className="text-[var(--color-charcoal)]/30">•</span>
        <time
          dateTime={post.created_at}
          className="font-mono text-xs text-[var(--color-charcoal)]/50 uppercase tracking-wider"
        >
          {formatDate(post.created_at)}
        </time>
      </div>

      {/* Title */}
      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl text-[var(--color-charcoal)] mb-6 leading-tight">
        {post.title}
      </h1>

      {/* Excerpt (if available) */}
      {post.excerpt && (
        <p className="font-body text-xl text-[var(--color-charcoal)]/70 mb-8 leading-relaxed italic">
          {post.excerpt}
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent mb-8" />

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        {paragraphs.map((paragraph, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="font-body text-lg text-[var(--color-charcoal)] leading-relaxed mb-6 whitespace-pre-line"
          >
            {paragraph.trim()}
          </motion.p>
        ))}
      </div>

      {/* Bottom Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent mt-12" />
    </article>
  )
}

