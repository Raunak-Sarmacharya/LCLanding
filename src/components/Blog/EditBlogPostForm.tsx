import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useParams, useNavigate } from 'react-router-dom'
import { updateBlogPost, getBlogPost } from '../../lib/api'
import { clearBlogPostsCache } from '../../hooks/useBlog'
import type { UpdateBlogPostInput, BlogPost } from '../../lib/types'
import TiptapEditor from './TiptapEditor'

export default function EditBlogPostForm() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedPost, setUpdatedPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState<UpdateBlogPostInput>({
    title: '',
    content: '',
    excerpt: '',
    author_name: '',
    tags: [],
    image_url: '',
  })
  const [tagsInput, setTagsInput] = useState('')
  const [editorTags, setEditorTags] = useState<string[]>([])

  // Load existing post data
  useEffect(() => {
    if (!slug) {
      setError('Slug is required')
      setIsLoading(false)
      return
    }

    async function loadPost() {
      try {
        setIsLoading(true)
        setError(null)
        const post = await getBlogPost(slug!)
        
        if (!post) {
          setError('Post not found')
          setIsLoading(false)
          return
        }

        // Populate form with existing data
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || '',
          author_name: post.author_name,
          tags: post.tags || [],
          image_url: post.image_url || '',
        })
        setTagsInput((post.tags || []).join(', '))
        setEditorTags(post.tags || [])
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading post:', err)
        setError(err instanceof Error ? err.message : 'Failed to load post')
        setIsLoading(false)
      }
    }

    loadPost()
  }, [slug])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    // Enforce excerpt character limit (200 characters)
    if (name === 'excerpt' && value.length > 200) {
      return // Don't update if exceeds limit
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setIsSubmitted(false)

    try {
      if (!slug) {
        setError('Slug is required')
        setIsSubmitting(false)
        return
      }

      // Validate form
      if (!formData.title?.trim()) {
        setError('Title is required')
        setIsSubmitting(false)
        return
      }
      if (!formData.content?.trim()) {
        setError('Content is required')
        setIsSubmitting(false)
        return
      }
      if (!formData.author_name?.trim()) {
        setError('Author name is required')
        setIsSubmitting(false)
        return
      }

      // Parse tags from comma-separated input and merge with editor tags
      const inputTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      
      // Merge editor tags (from # mentions) with input tags, removing duplicates
      const allTags = [...new Set([...editorTags, ...inputTags])]

      // Prepare update data - only include fields that are actually provided
      const updateData: UpdateBlogPostInput = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        author_name: formData.author_name.trim(),
      }

      // Only include optional fields if they have values
      const trimmedExcerpt = formData.excerpt?.trim()
      if (trimmedExcerpt) {
        updateData.excerpt = trimmedExcerpt
      } else {
        updateData.excerpt = null // Explicitly set to null if empty
      }

      const trimmedImageUrl = formData.image_url?.trim()
      if (trimmedImageUrl) {
        updateData.image_url = trimmedImageUrl
      } else {
        updateData.image_url = null // Explicitly set to null if empty
      }

      if (allTags.length > 0) {
        updateData.tags = allTags
      } else {
        updateData.tags = null // Explicitly set to null if empty
      }

      console.log('[EditBlogPostForm] Sending update data:', updateData)

      const post = await updateBlogPost(slug, updateData)

      // Ensure we have a valid post response
      if (!post || !post.id) {
        throw new Error('Invalid response from server: post data is missing')
      }

      // Store the updated post
      setUpdatedPost(post)

      // Clear blog posts cache so updated post appears immediately
      clearBlogPostsCache()

      // Reset submitting state first
      setIsSubmitting(false)

      // Then set submitted state to show success message
      setIsSubmitted(true)

      // Redirect to the updated post after showing success message
      setTimeout(() => {
        if (post?.slug) {
          navigate(`/blog/${post.slug}`)
        } else {
          navigate('/blog')
        }
      }, 3000)
    } catch (err) {
      // Always reset submitting state on error
      setIsSubmitting(false)
      setIsSubmitted(false)

      // Provide more specific error messages
      let errorMessage = 'Failed to update blog post. Please try again.'

      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('took too long')) {
          errorMessage = 'Request timed out, but your changes may have been saved successfully! Please check the blog page. If you don\'t see the changes, try updating again.'
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (err.message.includes('may have been saved')) {
          // If the error message already mentions the post may have been saved, use it as-is
          errorMessage = err.message
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
      
      // If timeout occurred, also log a helpful message
      if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('took too long'))) {
        console.warn('[EditBlogPostForm] Timeout occurred, but post may have been updated. Check blog page.')
      }

      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-body text-[var(--color-charcoal)]/60">Loading post...</p>
      </div>
    )
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
          Post Updated! 🎉
        </h2>
        <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-md mx-auto mb-8">
          Your blog post has been updated successfully!
        </p>
        {updatedPost?.slug && (
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
          value={formData.author_name || ''}
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
          value={formData.title || ''}
          onChange={handleInputChange}
          required
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-2xl text-[var(--color-charcoal)] transition-colors duration-300"
          placeholder=""
        />
      </div>

      {/* Excerpt (Optional) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
            Short description
            <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
          </span>
          <span className="font-body text-sm text-[var(--color-charcoal)]/50">
            {(formData.excerpt?.length || 0)}/200
          </span>
        </div>
        <textarea
          name="excerpt"
          value={formData.excerpt || ''}
          onChange={handleInputChange}
          rows={3}
          maxLength={200}
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
          placeholder="A brief description of your post (max 200 characters)..."
        />
        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
          Keep it concise. This will appear on blog cards and should be 200 characters or less.
        </p>
      </div>

      {/* Blog Image URL (Optional) */}
      <div className="space-y-4">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
          Blog Image URL
          <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
        </span>
        <input
          type="url"
          name="image_url"
          value={formData.image_url || ''}
          onChange={handleInputChange}
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300"
          placeholder="https://example.com/image.jpg"
        />
        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
          Enter a URL to an image for your blog post. If left empty, a placeholder image will be generated automatically.
        </p>
        {/* Preview image if URL is provided */}
        {formData.image_url && formData.image_url.trim() && (
          <div className="mt-4 rounded-lg overflow-hidden border border-[var(--color-charcoal)]/10">
            <img 
              src={formData.image_url} 
              alt="Preview" 
              className="w-full h-auto max-h-[300px] object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Tags (Optional) */}
      <div className="space-y-4">
        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
          Tags
          <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
        </span>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300"
          placeholder="Recipe, Cooking, Cuisine (comma-separated)"
        />
        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
          Enter tags separated by commas. These will appear on your blog post cards.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block mb-2">
            Here is my blog post content:
          </span>
          <p className="font-body text-sm text-[var(--color-charcoal)]/60 mb-4">
            Use the toolbar to format your content. Headings will automatically appear in the "In this article" sidebar. Type <code className="bg-[var(--color-cream-dark)]/50 px-1.5 py-0.5 rounded text-[var(--color-primary)]">#</code> to add tags.
          </p>
        </div>
        <TiptapEditor
          content={formData.content || ''}
          onChange={(newContent) => {
            setFormData((prev) => ({ ...prev, content: newContent }))
            setError(null)
          }}
          tags={editorTags}
          onTagsChange={setEditorTags}
          placeholder="Start writing your blog post..."
        />
        <div className="space-y-2">
          <p className="font-body text-sm text-[var(--color-charcoal)]/40">
            • Use the heading buttons (H1, H2, H3) for main sections (appears in sidebar)
          </p>
          <p className="font-body text-sm text-[var(--color-charcoal)]/40">
            • Type <code className="bg-[var(--color-cream-dark)]/50 px-1.5 py-0.5 rounded text-[var(--color-primary)]">#</code> followed by a tag name to add tags
          </p>
          <p className="font-body text-sm text-[var(--color-charcoal)]/40">
            • Headings will automatically create a table of contents in the sidebar
          </p>
        </div>
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
            <span>Updating...</span>
          </>
        ) : (
          <>
            <span>Update My Post</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </>
        )}
      </motion.button>
    </motion.form>
  )
}

