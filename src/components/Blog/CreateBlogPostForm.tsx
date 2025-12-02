import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createBlogPost } from '../../lib/api'
import type { CreateBlogPostInput } from '../../lib/types'

export default function CreateBlogPostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPost, setCreatedPost] = useState<any>(null)
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author_name: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setIsSubmitted(false)

    try {
      // Validate form
      if (!formData.title.trim()) {
        setError('Title is required')
        setIsSubmitting(false)
        return
      }
      if (!formData.content.trim()) {
        setError('Content is required')
        setIsSubmitting(false)
        return
      }
      if (!formData.author_name.trim()) {
        setError('Your name is required')
        setIsSubmitting(false)
        return
      }

      const post = await createBlogPost({
        title: formData.title.trim(),
        slug: formData.slug?.trim() || undefined,
        content: formData.content.trim(),
        excerpt: formData.excerpt?.trim() || undefined,
        author_name: formData.author_name.trim(),
      })

      // Ensure we have a valid post response
      if (!post || !post.id) {
        throw new Error('Invalid response from server: post data is missing')
      }

      // Store the created post
      setCreatedPost(post)

      // Reset submitting state first
      setIsSubmitting(false)

      // Then set submitted state to show success message
      setIsSubmitted(true)

      // Redirect to the new post after showing success message
      setTimeout(() => {
        if (post?.slug) {
          window.location.href = `/blog/${post.slug}`
        } else {
          window.location.href = '/blog'
        }
      }, 3000)
    } catch (err) {
      // Always reset submitting state on error
      setIsSubmitting(false)
      setIsSubmitted(false)

      // Provide more specific error messages
      let errorMessage = 'Failed to create blog post. Please try again.'

      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('took too long')) {
          errorMessage = 'Request timed out. Your post may have been saved. Please check the blog page or try again.'
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)

      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="text-center py-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-8 bg-[var(--color-sage)]/20 rounded-full flex items-center justify-center"
        >
          <svg className="w-12 h-12 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h2 className="font-heading text-3xl sm:text-4xl text-[var(--color-charcoal)] mb-4">
          Post Published! 🎉
        </h2>
        <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-md mx-auto mb-8">
          Your blog post has been published successfully!
        </p>
        {createdPost?.slug && (
          <p className="font-body text-sm text-[var(--color-charcoal)]/50">
            Redirecting to your post...
          </p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-8"
    >
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg p-4"
          >
            <p className="font-body text-[var(--color-primary)] text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author Name */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)]">
          My name is
        </span>
        <input
          type="text"
          name="author_name"
          value={formData.author_name}
          onChange={handleInputChange}
          required
          className="flex-1 min-w-[200px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-[var(--color-charcoal)] transition-colors duration-300"
          placeholder=""
        />
      </div>

      {/* Title */}
      <div className="space-y-4">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
          My blog post title is
        </span>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-2xl text-[var(--color-charcoal)] transition-colors duration-300"
          placeholder=""
        />
      </div>

      {/* Slug (Optional) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
          <span className="font-heading text-xl sm:text-2xl text-[var(--color-charcoal)]">
            URL slug
            <span className="text-[var(--color-charcoal)]/40 text-base ml-2">(Optional)</span>
          </span>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            className="flex-1 min-w-[200px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 font-mono"
            placeholder="auto-generated-from-title"
          />
        </div>
        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
          Leave empty to auto-generate from title. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Excerpt (Optional) */}
      <div className="space-y-4">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
          Short description
          <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
        </span>
        <textarea
          name="excerpt"
          value={formData.excerpt}
          onChange={handleInputChange}
          rows={2}
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
          placeholder="A brief description of your post..."
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
          Here is my blog post content:
        </span>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          required
          rows={12}
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
          placeholder="Write your blog post here... Use double line breaks to create paragraphs."
        />
        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
          Use double line breaks (blank lines) to create paragraphs.
        </p>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-charcoal)]/20 disabled:cursor-not-allowed text-white px-10 py-4 rounded-full font-body font-semibold text-lg transition-all duration-300 shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:shadow-[var(--color-primary)]/35 flex items-center gap-3"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Publishing...</span>
          </>
        ) : (
          <>
            <span>Publish My Post</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </motion.button>
    </motion.form>
  )
}

