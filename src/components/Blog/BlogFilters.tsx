import { useState, useMemo, useEffect } from 'react'
import type { BlogPost } from '../../lib/types'
import { IconSearch } from '@tabler/icons-react'
import SearchModal from './SearchModal'

interface BlogFiltersProps {
  posts: BlogPost[]
  onFilterChange: (filteredPosts: BlogPost[]) => void
}

export default function BlogFilters({ posts, onFilterChange }: BlogFiltersProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  // Extract all unique tags from posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [posts])

  // Filter posts based on selected tags
  const filteredPosts = useMemo(() => {
    let filtered = posts

    // Filter by tags (posts must have at least one selected tag if tags are selected)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post => {
        if (!post.tags || !Array.isArray(post.tags)) return false
        return selectedTags.some(tag => post.tags!.includes(tag))
      })
    }

    return filtered
  }, [posts, selectedTags])

  // Update parent when filters change
  useEffect(() => {
    onFilterChange(filteredPosts)
  }, [filteredPosts, onFilterChange])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const handleClearFilters = () => {
    setSelectedTags([])
  }

  const hasActiveFilters = selectedTags.length > 0

  return (
    <div className="w-full">
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-[var(--color-charcoal)]/70 uppercase tracking-wider">
            Filter
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="font-mono text-sm text-[var(--color-charcoal)]/70 hover:text-[var(--color-primary)] transition-colors duration-200"
            >
              (clear)
            </button>
          )}
        </div>

        {/* Search Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-charcoal)]/10 bg-white hover:border-[var(--color-primary)]/30 transition-colors duration-200"
            aria-label="Search"
          >
            <IconSearch className="w-4 h-4 text-[var(--color-charcoal)]/60" />
          </button>
        </div>
      </div>

      {/* Tag Pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map(tag => {
            const isSelected = selectedTags.includes(tag)
            return (
              <label
                key={tag}
                className="relative inline-flex items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleTagToggle(tag)}
                  className="sr-only"
                />
                <div
                  className={`
                    px-4 py-2 rounded-lg border transition-all duration-200
                    ${isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-[var(--color-charcoal)] border-[var(--color-charcoal)]/20 hover:border-[var(--color-primary)]/40'
                    }
                  `}
                >
                  <span className="font-mono text-xs uppercase tracking-wide">
                    {tag}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        posts={posts}
      />
    </div>
  )
}

