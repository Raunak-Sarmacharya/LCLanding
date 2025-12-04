import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch, IconX } from '@tabler/icons-react'
import type { BlogPost } from '../../lib/types'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  posts: BlogPost[]
}

export default function SearchModal({ isOpen, onClose, posts }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter posts based on search query - show all by default, filter as user types
  const searchResults = useMemo(() => {
    // If no query, show all posts (limited to 10 for performance)
    if (!searchQuery.trim()) {
      return posts.slice(0, 10)
    }
    
    // Filter posts based on search query
    const query = searchQuery.toLowerCase().trim()
    return posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query)
      const excerptMatch = post.excerpt?.toLowerCase().includes(query) || false
      const contentMatch = post.content?.toLowerCase().includes(query) || false
      const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(query)) || false
      return titleMatch || excerptMatch || contentMatch || tagMatch
    })
  }, [posts, searchQuery])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Get image URL for post
  const getImageUrl = (post: BlogPost) => {
    if (post.image_url && post.image_url.trim()) {
      return post.image_url
    }
    const seed = post.id || post.slug
    return `https://picsum.photos/seed/${seed}/200/150`
  }

  // Get primary tag color
  const getTagColor = (index: number) => {
    const colors = [
      'bg-[var(--color-primary)]',
      'bg-[var(--color-sage)]',
      'bg-[var(--color-gold)]',
      'bg-[var(--color-coral)]',
    ]
    return colors[index % colors.length]
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal - Effortel style: light grey/white overlay */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 sm:pt-32 px-4">
        <div
          className="bg-[var(--color-cream)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Header */}
          <div className="p-6 border-b border-[var(--color-charcoal)]/10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-heading text-lg text-[var(--color-charcoal)]">Search Posts</h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/60 transition-colors text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]"
                aria-label="Close search"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-white/90 rounded-lg px-4 py-3 border border-[var(--color-charcoal)]/10">
              <IconSearch className="w-5 h-5 text-[var(--color-charcoal)]/50 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH..."
                className="flex-1 outline-none border-none bg-transparent font-mono text-sm uppercase tracking-wider text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[var(--color-charcoal)]/40 hover:text-[var(--color-charcoal)] transition-colors"
                  aria-label="Clear search"
                >
                  <IconX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {searchResults.length === 0 && searchQuery.trim() && (
              <div className="text-center py-12">
                <p className="font-body text-[var(--color-charcoal)]/60">
                  No results found for "{searchQuery}"
                </p>
                <p className="font-body text-sm text-[var(--color-charcoal)]/40 mt-2">
                  Try a different search term
                </p>
              </div>
            )}

            {searchResults.length > 0 && (
              <>
                {searchQuery.trim() && (
                  <div className="mb-4">
                    <p className="font-body text-sm text-[var(--color-charcoal)]/60">
                      {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                    </p>
                  </div>
                )}
                {!searchQuery.trim() && (
                  <div className="mb-4">
                    <p className="font-body text-sm text-[var(--color-charcoal)]/60">
                      Showing recent posts. Start typing to filter...
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  {searchResults.map((post, index) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/60 transition-all duration-200 group cursor-pointer"
                    >
                      {/* Thumbnail - Effortel style: colored background with image */}
                      <div className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden ${getTagColor(index)} flex items-center justify-center shadow-sm`}>
                        <img
                          src={getImageUrl(post)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-sm sm:text-base text-[var(--color-charcoal)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {post.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-charcoal)]/50 px-1.5 py-0.5 rounded border border-[var(--color-charcoal)]/10"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-charcoal)]/50">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

