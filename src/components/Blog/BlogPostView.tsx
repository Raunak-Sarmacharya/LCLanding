import { motion } from 'motion/react'
import { useEffect, useRef, useState, useMemo } from 'react'
import type { BlogPost } from '../../lib/types'

interface BlogPostViewProps {
  post: BlogPost
}

interface Heading {
  id: string
  text: string
  level: number
  element: HTMLElement | null
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const tocRef = useRef<HTMLDivElement>(null)
  const headingRefs = useRef<Map<string, HTMLElement>>(new Map())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Convert plain text content to paragraphs, preserving headings
  // This MUST be defined before any useEffect that uses headings
  const { contentBlocks, headings } = useMemo(() => {
    if (!post.content || typeof post.content !== 'string') {
      return { contentBlocks: [], headings: [] }
    }
    const lines = post.content.split('\n')
    const blocks: Array<{ type: 'heading' | 'paragraph'; content: string; id?: string; level?: number }> = []
    const headingsList: Heading[] = []
    let currentParagraph: string[] = []
    let headingCounter = 0

    lines.forEach((line) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('#')) {
        // Save current paragraph if exists
        if (currentParagraph.length > 0) {
          blocks.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
          })
          currentParagraph = []
        }

        // Process heading
        const match = trimmed.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
          const level = match[1].length
          const text = match[2].trim()
          const id = `heading-${headingCounter++}`
          
          headingsList.push({
            id,
            text,
            level,
            element: null,
          })
          
          blocks.push({
            type: 'heading',
            content: text,
            id,
            level,
          })
        }
      } else if (trimmed) {
        currentParagraph.push(line)
      } else {
        // Empty line - end current paragraph
        if (currentParagraph.length > 0) {
          blocks.push({
            type: 'paragraph',
            content: currentParagraph.join('\n'),
          })
          currentParagraph = []
        }
      }
    })

    // Add remaining paragraph
    if (currentParagraph.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: currentParagraph.join('\n'),
      })
    }

    // Debug: Log headings found
    if (headingsList.length > 0) {
      console.log('[BlogPostView] ✅ Headings extracted:', headingsList.length, headingsList.map(h => `${'#'.repeat(h.level)} ${h.text}`))
    } else {
      console.log('[BlogPostView] ⚠️ No headings found in content. Make sure to use markdown headings like #, ##, ###')
      console.log('[BlogPostView] Content preview:', post.content.substring(0, 200))
    }
    console.log('[BlogPostView] Content blocks:', blocks.length)
    
    return { contentBlocks: blocks, headings: headingsList }
  }, [post.content])

  // Set up intersection observer for active heading tracking
  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }

    const observers: IntersectionObserver[] = []

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (!element) return

      headingRefs.current.set(heading.id, element)

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveHeadingId(heading.id)
            }
          })
        },
        observerOptions
      )

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach((obs) => obs.disconnect())
    }
  }, [headings])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const article = contentRef.current
      const rect = article.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const articleHeight = article.scrollHeight || rect.height
      
      // Get the article's position relative to viewport
      const articleTop = rect.top
      const articleBottom = rect.bottom
      
      // If article hasn't entered viewport yet (bottom is above or at viewport top)
      if (articleBottom <= 0) {
        setScrollProgress(0)
        return
      }
      
      // If article has been fully scrolled past (top is at or below viewport bottom)
      if (articleTop >= windowHeight) {
        setScrollProgress(100)
        return
      }
      
      // Calculate progress: how much of the article has been scrolled through the viewport
      // Standard formula used by scroll progress indicators:
      // Progress from 0% (article top enters viewport) to 100% (article bottom exits viewport)
      //
      // The total scrollable distance is: articleHeight + windowHeight
      // This represents the distance from when article top enters viewport to when article bottom exits
      //
      // How much has been scrolled: windowHeight - articleTop
      // When articleTop = 0 (just entered): scrolled = windowHeight
      // When articleTop = -(articleHeight - windowHeight) (bottom exiting): scrolled = windowHeight + articleHeight - windowHeight = articleHeight
      //
      // But we want progress from 0% to 100%, so we need to adjust:
      // Start point: articleTop = 0, scrolled = 0 (we want 0%)
      // End point: articleBottom = 0, which means articleTop = windowHeight - articleHeight, scrolled = articleHeight (we want 100%)
      
      // Calculate how much of the article has passed the top of the viewport
      // When articleTop is negative, it means we've scrolled past the top
      const scrolledPastTop = Math.max(0, -articleTop)
      
      // Total distance to scroll: from when top enters (articleTop = 0) to when bottom exits
      // Bottom exits when: articleTop = windowHeight - articleHeight
      // So total scrollable = articleHeight
      const totalScrollable = articleHeight
      
      // Progress = how much scrolled / total scrollable
      const progress = totalScrollable > 0 
        ? Math.min(100, Math.max(0, (scrolledPastTop / totalScrollable) * 100))
        : 0
      
      setScrollProgress(progress)
    }

    // Use requestAnimationFrame for smoother updates
    let rafId: number | null = null
    const throttledHandleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        handleScroll()
        rafId = null
      })
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    window.addEventListener('resize', throttledHandleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', throttledHandleScroll)
      window.removeEventListener('resize', throttledHandleScroll)
    }
  }, [post.content])

  // Scroll to heading
  const scrollToHeading = (headingId: string) => {
    const element = headingRefs.current.get(headingId) || document.getElementById(headingId)
    if (element) {
      const offset = 100 // Offset from top
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const tags = post.tags && Array.isArray(post.tags) ? post.tags : []

  return (
    <div className="relative w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">
          {/* Main Content - Left Side */}
          <article
            ref={contentRef}
            className="w-full"
          >
            {/* Author, Date, and Tags */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
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
              {tags.length > 0 && (
                <>
                  <span className="text-[var(--color-charcoal)]/30">•</span>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block border border-[var(--color-charcoal)]/20 rounded-md px-2.5 py-1"
                        style={{
                          background: index === 0 ? 'var(--color-butter)' : 'var(--color-cream-dark)',
                        }}
                      >
                        <span className="font-mono text-xs uppercase tracking-wide text-[var(--color-charcoal)]">
                          {tag}
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--color-charcoal)] mb-8 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt (if available) */}
            {post.excerpt && (
              <p className="font-body text-xl sm:text-2xl text-[var(--color-charcoal)]/70 mb-12 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {contentBlocks.length === 0 ? (
                <p className="font-body text-lg text-[var(--color-charcoal)]/60 italic">
                  No content available for this post.
                </p>
              ) : (
                contentBlocks.map((block, index) => {
                  if (block.type === 'heading') {
                    const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements
                    return (
                      <HeadingTag
                        key={block.id || index}
                        id={block.id}
                        className="blog-heading font-heading text-[var(--color-charcoal)] mt-16 mb-8 first:mt-0 scroll-mt-24"
                        style={{
                          fontSize: block.level === 1 ? '2.5rem' : block.level === 2 ? '2rem' : '1.75rem',
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {block.content}
                      </HeadingTag>
                    )
                  } else {
                    return (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="font-body text-lg sm:text-xl text-[var(--color-charcoal)] leading-relaxed mb-8 whitespace-pre-line"
                      >
                        {block.content.trim()}
                      </motion.p>
                    )
                  }
                })
              )}
            </div>
          </article>

          {/* Table of Contents Sidebar - Right Side - ALWAYS SHOWN */}
          <aside
            ref={tocRef}
            className="hidden lg:block"
          >
            <div className="bg-white rounded-2xl p-6 shadow-brand border border-[var(--color-charcoal)]/5">
                {/* Progress Indicator - At the top like reference - ALWAYS SHOWN */}
                <div className={headings.length > 0 ? "mb-8 pb-8 border-b border-[var(--color-charcoal)]/10" : "mb-0"}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-[var(--color-charcoal)]/60 uppercase tracking-wider">
                      Progress
                    </span>
                    <span className="font-mono text-2xl font-bold text-[var(--color-primary)] tabular-nums">
                      {String(Math.round(scrollProgress)).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-charcoal)]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                      style={{ width: `${scrollProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-mono text-xs text-[var(--color-charcoal)]/40">%</span>
                  </div>
                </div>

                {/* In This Article - Always show section, but content only if headings exist */}
                <div>
                  <h3 className="font-heading text-lg font-semibold text-[var(--color-charcoal)] mb-6">
                    In this article
                  </h3>
                  {headings.length > 0 ? (
                    <nav className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                      {headings.map((heading) => {
                        const isActive = activeHeadingId === heading.id
                        return (
                          <button
                            key={heading.id}
                            onClick={() => scrollToHeading(heading.id)}
                            className={`block w-full text-left transition-all duration-200 ${
                              isActive
                                ? 'text-[var(--color-primary)] font-semibold'
                                : 'text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]'
                            }`}
                            style={{
                              paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                              fontSize: heading.level === 1 ? '0.95rem' : heading.level === 2 ? '0.9rem' : '0.85rem',
                              lineHeight: 1.5,
                            }}
                          >
                            <span className="relative block">
                              {heading.text}
                              {isActive && (
                                <motion.span
                                  layoutId="activeHeading"
                                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-primary)]"
                                  style={{ left: `${(heading.level - 1) * -0.75}rem` }}
                                  initial={false}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </nav>
                  ) : (
                    <p className="text-sm text-[var(--color-charcoal)]/40 italic">
                      No headings found. Add markdown headings (## Heading) to your content to see them here.
                    </p>
                  )}
                </div>
              </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
