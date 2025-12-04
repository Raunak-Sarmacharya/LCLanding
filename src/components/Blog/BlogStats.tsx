import { useMemo } from 'react'
import type { BlogPost } from '../../lib/types'

interface BlogStatsProps {
  posts: BlogPost[]
  filteredPosts: BlogPost[]
}

export default function BlogStats({ posts, filteredPosts }: BlogStatsProps) {
  const stats = useMemo(() => {
    // Calculate total reading time (assuming 250 words per minute)
    const totalWords = posts.reduce((acc, post) => {
      if (!post.content) return acc
      return acc + post.content.trim().split(/\s+/).length
    }, 0)
    const totalReadingTime = Math.ceil(totalWords / 250)

    // Count unique authors
    const uniqueAuthors = new Set(posts.map(post => post.author_name))
    const authorCount = uniqueAuthors.size

    // Count posts by year
    const currentYear = new Date().getFullYear()
    const thisYearPosts = posts.filter(post => {
      const postYear = new Date(post.created_at).getFullYear()
      return postYear === currentYear
    }).length

    return {
      totalPosts: posts.length,
      filteredPosts: filteredPosts.length,
      totalReadingTime,
      authorCount,
      thisYearPosts,
    }
  }, [posts, filteredPosts])

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[var(--color-cream-dark)]/30 rounded-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Total Posts */}
          <div className="text-center">
            <div className="font-display text-4xl sm:text-5xl md:text-6xl text-[var(--color-primary)] mb-2">
              {stats.totalPosts}
            </div>
            <div className="font-body text-sm sm:text-base text-[var(--color-charcoal)]/70">
              Total Posts
            </div>
          </div>

          {/* Total Reading Time */}
          <div className="text-center">
            <div className="font-display text-4xl sm:text-5xl md:text-6xl text-[var(--color-primary)] mb-2">
              {stats.totalReadingTime}
            </div>
            <div className="font-body text-sm sm:text-base text-[var(--color-charcoal)]/70">
              Minutes of Content
            </div>
          </div>

          {/* Authors */}
          <div className="text-center">
            <div className="font-display text-4xl sm:text-5xl md:text-6xl text-[var(--color-primary)] mb-2">
              {stats.authorCount}
            </div>
            <div className="font-body text-sm sm:text-base text-[var(--color-charcoal)]/70">
              Contributors
            </div>
          </div>

          {/* This Year Posts */}
          <div className="text-center">
            <div className="font-display text-4xl sm:text-5xl md:text-6xl text-[var(--color-primary)] mb-2">
              {stats.thisYearPosts}
            </div>
            <div className="font-body text-sm sm:text-base text-[var(--color-charcoal)]/70">
              Posts This Year
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

