import React from 'react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, useMemo } from 'react'
import type { BlogPost } from '../../lib/types'
import { useLenis } from '../../contexts/LenisContext'

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
  const navRef = useRef<HTMLElement>(null)
  const sidebarScrollContainerRef = useRef<HTMLDivElement>(null)
  const activeHeadingButtonRef = useRef<HTMLButtonElement | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { lenisRef } = useLenis()
  const [sidebarBottom, setSidebarBottom] = useState<string>('clamp(10rem, 20vh, 20rem)')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Calculate reading time (250 words per minute)
  const calculateReadingTime = (content: string): number => {
    if (!content || content.trim().length === 0) {
      return 3 // Default to 3 minutes if content is not available
    }
    const wordCount = content.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / 250))
  }

  // Get image URL - use post image_url if available, otherwise generate placeholder
  const getImageUrl = (post: BlogPost) => {
    if (post.image_url && post.image_url.trim()) {
      return post.image_url
    }
    // Generate placeholder image if no image_url provided
    const seed = post.id || post.slug
    return `https://picsum.photos/seed/${seed}/1200/600`
  }

  // Clean HTML tags from content (especially from editor output)
  const cleanContent = (content: string): string => {
    if (!content || typeof content !== 'string') {
      return ''
    }
    
    let cleaned = content.trim()
    
    // Remove opening HTML tags at the start (like <pre><code class="language-markdown">)
    // Handle with or without whitespace
    cleaned = cleaned.replace(/^\s*<pre><code[^>]*>\s*/i, '')
    
    // Remove closing HTML tags at the end (like </code></pre><p></p>)
    // Handle various combinations with optional whitespace
    cleaned = cleaned.replace(/\s*<\/code><\/pre>\s*(<p><\/p>)?\s*$/i, '')
    cleaned = cleaned.replace(/\s*<\/code><\/pre>\s*$/i, '')
    
    // Also handle standalone closing tags that might be on separate lines
    cleaned = cleaned.replace(/^\s*<\/code><\/pre>\s*/i, '')
    cleaned = cleaned.replace(/\s*<p><\/p>\s*$/i, '')
    
    return cleaned.trim()
  }

  // Convert plain text content to paragraphs, preserving headings
  // This MUST be defined before any useEffect that uses headings
  const { contentBlocks, headings } = useMemo(() => {
    if (!post.content || typeof post.content !== 'string') {
      return { contentBlocks: [], headings: [] }
    }
    
    // Clean HTML tags from content before processing
    const cleanedContent = cleanContent(post.content)
    const lines = cleanedContent.split('\n')
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
      console.log('[BlogPostView] Content preview:', cleanedContent.substring(0, 200))
    }
    console.log('[BlogPostView] Content blocks:', blocks.length)
    
    return { contentBlocks: blocks, headings: headingsList }
  }, [post.content])

  // Set up intersection observer for active heading tracking
  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return

    let observers: IntersectionObserver[] = []
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let rafId: number | null = null

    // Wait for DOM to be ready before setting up observers
    const setupObservers = () => {
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }

      const headingElements: Array<{ id: string; element: HTMLElement }> = []

      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (!element) {
          console.warn(`[BlogPostView] Heading element not found: ${heading.id}`)
          return
        }

        headingRefs.current.set(heading.id, element)
        headingElements.push({ id: heading.id, element })
      })

      // If no elements found, try again after a short delay
      if (headingElements.length === 0) {
        console.warn('[BlogPostView] No heading elements found, retrying...')
        timeoutId = setTimeout(setupObservers, 100)
        return
      }

      // Track which headings are currently intersecting
      const intersectingHeadings = new Set<string>()

      // Function to update active heading
      const updateActiveHeading = () => {
        if (intersectingHeadings.size > 0) {
          // Get the first heading that's intersecting (topmost)
          const activeId = Array.from(intersectingHeadings).sort((a, b) => {
            const aIndex = headings.findIndex(h => h.id === a)
            const bIndex = headings.findIndex(h => h.id === b)
            return aIndex - bIndex
          })[0]
          setActiveHeadingId(activeId)
        } else {
          // If no headings are intersecting, find the last heading that has been scrolled past
          // This handles the case when user scrolls past all headings
          const scrollY = window.scrollY + window.innerHeight * 0.2 // 20% from top (matching rootMargin)
          let lastPassedHeading: string | null = null
          
          headingElements.forEach(({ id, element }) => {
            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            if (elementTop < scrollY) {
              lastPassedHeading = id
            }
          })
          
          if (lastPassedHeading) {
            setActiveHeadingId(lastPassedHeading)
          }
        }
      }

      headingElements.forEach(({ id, element }) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                intersectingHeadings.add(id)
              } else {
                intersectingHeadings.delete(id)
              }
              
              // Update active heading after a brief delay to batch updates
              setTimeout(updateActiveHeading, 0)
            })
          },
          observerOptions
        )

        observer.observe(element)
        observers.push(observer)
      })
      
      // Set initial active heading (first one) if none is set
      setActiveHeadingId((current) => {
        if (!current && headingElements.length > 0) {
          return headingElements[0].id
        }
        return current
      })
      
      // Also update on scroll to handle edge cases
      const handleScroll = () => {
        updateActiveHeading()
      }
      
      window.addEventListener('scroll', handleScroll, { passive: true })
      
      // Return cleanup function
      return () => {
        window.removeEventListener('scroll', handleScroll)
        observers.forEach((obs) => obs.disconnect())
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    let cleanupFn: (() => void) | null = null
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        cleanupFn = setupObservers() || null
      }, 0)
    })

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      if (cleanupFn) {
        cleanupFn()
      }
      observers.forEach((obs) => obs.disconnect())
      observers = []
    }
  }, [headings])

  // Track scroll progress - works with both Lenis and native scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const article = contentRef.current
      const windowHeight = window.innerHeight
      
      // Get current scroll position - always use window.scrollY for getBoundingClientRect consistency
      // getBoundingClientRect() is always relative to the actual viewport, not Lenis's smoothed position
      const scrollY = window.scrollY || window.pageYOffset || 0
      
      // Get article's position relative to viewport
      const articleRect = article.getBoundingClientRect()
      
      // Calculate absolute positions in document
      const articleTop = articleRect.top + scrollY
      const articleBottom = articleRect.bottom + scrollY
      
      // Progress calculation:
      // 0% when article top enters viewport (articleRect.top = 0)
      // 100% when article bottom exits viewport (articleRect.bottom = windowHeight)
      // 
      // Scroll range: from when top enters (scrollY = articleTop) to when bottom exits (scrollY = articleBottom - windowHeight)
      const scrollStart = articleTop  // Scroll position when article top enters viewport
      const scrollEnd = articleBottom - windowHeight  // Scroll position when article bottom exits viewport
      const totalScrollable = scrollEnd - scrollStart
      
      // Handle edge cases
      if (totalScrollable <= 0) {
        // Article fits entirely in viewport or calculation error
        if (articleRect.top <= 0 && articleRect.bottom >= windowHeight) {
          // Article is taller than viewport and fully visible
          setScrollProgress(50) // Show 50% as middle point
        } else if (articleRect.top >= 0 && articleRect.bottom <= windowHeight) {
          // Article fits entirely in viewport
          setScrollProgress(100) // Fully visible = 100%
        } else {
          setScrollProgress(0)
        }
        return
      }
      
      // Calculate current progress
      // When scrollY = scrollStart, progress = 0%
      // When scrollY = scrollEnd, progress = 100%
      const scrolled = scrollY - scrollStart
      const progress = Math.max(0, Math.min(100, (scrolled / totalScrollable) * 100))
      
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

    // Listen to Lenis scroll events if available
    const lenis = lenisRef?.current?.lenis
    if (lenis) {
      lenis.on('scroll', throttledHandleScroll)
    } else {
      window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    }
    
    window.addEventListener('resize', throttledHandleScroll, { passive: true })
    
    // Initial calculation with a small delay to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      handleScroll()
    }, 100)

    return () => {
      clearTimeout(initialTimeout)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (lenis) {
        lenis.off('scroll', throttledHandleScroll)
      } else {
        window.removeEventListener('scroll', throttledHandleScroll)
      }
      window.removeEventListener('resize', throttledHandleScroll)
    }
  }, [post.content, lenisRef])

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

  // Auto-scroll sidebar to show active heading - optimized for smoothness
  const scrollToActiveHeading = (immediate = false) => {
    if (!activeHeadingId || !sidebarScrollContainerRef.current || !activeHeadingButtonRef.current) return

    const scrollContainer = sidebarScrollContainerRef.current
    const activeButton = activeHeadingButtonRef.current

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      // Get container and button positions relative to the scroll container
      const containerRect = scrollContainer.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      // Calculate positions relative to the scroll container
      const buttonTopRelative = buttonRect.top - containerRect.top + scrollContainer.scrollTop
      const buttonBottomRelative = buttonTopRelative + buttonRect.height
      const containerScrollTop = scrollContainer.scrollTop
      const containerScrollBottom = containerScrollTop + containerRect.height

      // Check if button is outside visible area
      const isAboveViewport = buttonTopRelative < containerScrollTop
      const isBelowViewport = buttonBottomRelative > containerScrollBottom

      if (isAboveViewport || isBelowViewport) {
        // Scroll to show the button with some padding
        const scrollPadding = 20 // 20px padding from top/bottom
        let targetScroll = buttonTopRelative - scrollPadding

        // Ensure we don't scroll past the bounds
        targetScroll = Math.max(0, Math.min(targetScroll, scrollContainer.scrollHeight - containerRect.height))

        // Use smooth scroll for better UX, or instant if immediate flag is set
        scrollContainer.scrollTo({
          top: targetScroll,
          behavior: immediate ? 'auto' : 'smooth'
        })
      }
    })
  }

  // Auto-scroll sidebar to show active heading when it changes
  useEffect(() => {
    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      scrollToActiveHeading()
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [activeHeadingId])

  // Also scroll to active heading when sidebar position changes (to keep it visible)
  useEffect(() => {
    // Wait for CSS transition to complete before scrolling
    const timeoutId = setTimeout(() => {
      scrollToActiveHeading()
    }, 350) // Match the CSS transition duration (300ms) + small buffer

    return () => clearTimeout(timeoutId)
  }, [sidebarBottom])

  // Prevent sidebar from overlapping footer - optimized for smoothness
  useEffect(() => {
    let rafId: number | null = null
    let lastBottom = sidebarBottom

    const updateSidebarPosition = () => {
      if (!sidebarRef.current) return

      const footer = document.getElementById('contact')
      if (!footer) {
        if (lastBottom !== 'clamp(10rem, 20vh, 20rem)') {
          setSidebarBottom('clamp(10rem, 20vh, 20rem)')
          lastBottom = 'clamp(10rem, 20vh, 20rem)'
        }
        return
      }

      const footerRect = footer.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // Calculate distance from bottom of viewport to top of footer
      const footerTopFromBottom = viewportHeight - footerRect.top

      // If footer is visible in viewport and would overlap sidebar
      if (footerTopFromBottom > 0 && footerTopFromBottom < viewportHeight) {
        // Set sidebar bottom to be above footer with padding (2rem = 32px)
        const padding = 32
        const newBottom = Math.max(padding, footerTopFromBottom + padding)
        const newBottomStr = `${newBottom}px`
        
        // Only update if value actually changed to prevent unnecessary re-renders
        if (lastBottom !== newBottomStr) {
          setSidebarBottom(newBottomStr)
          lastBottom = newBottomStr
        }
      } else if (footerRect.top > viewportHeight) {
        // Footer is below viewport, use default position
        const defaultBottom = 'clamp(10rem, 20vh, 20rem)'
        if (lastBottom !== defaultBottom) {
          setSidebarBottom(defaultBottom)
          lastBottom = defaultBottom
        }
      } else {
        // Footer is above viewport, ensure minimum bottom spacing
        const defaultBottom = 'clamp(10rem, 20vh, 20rem)'
        if (lastBottom !== defaultBottom) {
          setSidebarBottom(defaultBottom)
          lastBottom = defaultBottom
        }
      }
    }

    // Throttled scroll handler for smooth performance
    const handleScroll = () => {
      if (rafId !== null) return
      
      rafId = requestAnimationFrame(() => {
        updateSidebarPosition()
        rafId = null
      })
    }

    // Initial check
    updateSidebarPosition()

    // Use Lenis scroll events if available
    const lenis = lenisRef?.current?.lenis
    if (lenis) {
      lenis.on('scroll', handleScroll)
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    // Update on resize with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        updateSidebarPosition()
      }, 150)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (lenis) {
        lenis.off('scroll', handleScroll)
      } else {
        window.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [lenisRef])

  const tags = post.tags && Array.isArray(post.tags) ? post.tags : []
  const readingTime = calculateReadingTime(post.content)

  // Ensure aside container has minimum height for sticky positioning to work
  useEffect(() => {
    if (!contentRef.current || !tocRef.current) return

    const updateHeight = () => {
      if (contentRef.current && tocRef.current) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (contentRef.current && tocRef.current) {
            const articleHeight = contentRef.current.offsetHeight
            // Set minimum height to match article so sticky positioning works
            // This ensures the sticky element can stick throughout the article scroll
            if (articleHeight > 0) {
              tocRef.current.style.minHeight = `${articleHeight}px`
            }
          }
        })
      }
    }

    // Initial height sync with delay to ensure content is rendered
    const timeoutId = setTimeout(updateHeight, 100)
    updateHeight()

    // Update on resize
    window.addEventListener('resize', updateHeight)
    
    // Use MutationObserver to watch for content changes
    const observer = new MutationObserver(() => {
      updateHeight()
    })
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateHeight)
      observer.disconnect()
    }
  }, [contentBlocks, post.content])

  return (
    <div className="relative w-full">
      <div className="max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12">
        {/* Title and Meta - Full Width Above Grid */}
        <div className="mb-6 sm:mb-8">
          {/* Title - First */}
          <h1 className="font-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-[var(--color-charcoal)] mb-4 xs:mb-5 sm:mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Tags and Meta Info - Below Title, Meta on Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 xs:gap-4">
            {/* Tags on Left */}
            {tags.length > 0 && (
              <div className="flex gap-1.5 xs:gap-2 flex-wrap">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block border border-[var(--color-charcoal)]/20 rounded-md px-2 xs:px-2.5 py-1 xs:py-1.5"
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <span className="font-mono text-xs xs:text-sm uppercase tracking-wide text-[var(--color-charcoal)]">
                      {tag}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {/* Reading Time and Date on Right */}
            <div className="flex items-center gap-2 text-sm xs:text-base text-[var(--color-charcoal)]/70 ml-auto">
              <span className="font-mono">
                {readingTime} min read
              </span>
              <span className="text-[var(--color-charcoal)]/30">/</span>
              <time
                dateTime={post.created_at}
                className="font-mono"
              >
                {formatDate(post.created_at)}
              </time>
            </div>
          </div>
        </div>

        {/* Featured Image - Centered, Full Width */}
        <div className="relative w-full mb-8 sm:mb-10 md:mb-12 rounded-xl xs:rounded-2xl overflow-hidden bg-[var(--color-cream-dark)]">
          <img 
            src={getImageUrl(post)}
            alt={post.title}
            className="w-full h-auto object-cover"
            loading="eager"
          />
        </div>

        {/* Mobile Table of Contents - Right Below Image */}
        {headings.length > 0 && (
          <div className="lg:hidden mb-8 sm:mb-10 md:mb-12">
            <div className="bg-white rounded-xl xs:rounded-2xl shadow-brand border border-[var(--color-charcoal)]/5 p-4 xs:p-5 sm:p-6">
              <h3 className="font-heading text-base sm:text-lg font-semibold text-[var(--color-charcoal)] mb-4 sm:mb-6 uppercase tracking-wide">
                IN THIS ARTICLE
              </h3>
              <nav className="space-y-2 sm:space-y-3">
                {headings.map((heading) => {
                  const isActive = activeHeadingId === heading.id
                  return (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`relative block w-full text-left transition-all duration-200 ${
                        isActive
                          ? 'text-[var(--color-primary)] font-semibold'
                          : 'text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]'
                      }`}
                      style={{
                        paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                        fontSize: heading.level === 1 
                          ? 'clamp(0.875rem, 1.2vw, 0.95rem)' 
                          : heading.level === 2 
                          ? 'clamp(0.8rem, 1.1vw, 0.9rem)' 
                          : 'clamp(0.75rem, 1vw, 0.85rem)',
                        lineHeight: 1.5,
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeHeadingMobile"
                          className="absolute top-0 bottom-0 w-0.5 bg-[var(--color-primary)]"
                          style={{ 
                            left: `${(heading.level - 1) * 0.75}rem`,
                          }}
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className="relative block pl-1.5 sm:pl-2">
                        {heading.text}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Grid Layout for Content and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 sm:gap-10 md:gap-12 lg:gap-16 lg:items-start">
          {/* Main Content - Left Side */}
          <article
            ref={contentRef}
            className="w-full lg:pr-0"
          >
            {/* Excerpt - After Image */}
            {post.excerpt && (
              <p className="font-body text-base xs:text-lg sm:text-xl md:text-2xl text-[var(--color-charcoal)]/70 mb-8 sm:mb-10 md:mb-12 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {contentBlocks.length === 0 ? (
                <p className="font-body text-base xs:text-lg text-[var(--color-charcoal)]/60 italic">
                  No content available for this post.
                </p>
              ) : (
                contentBlocks.map((block, index) => {
                  if (block.type === 'heading') {
                    // Create heading element using React.createElement to avoid JSX namespace issues
                    const HeadingTag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
                    const headingProps = {
                      key: block.id || index,
                      id: block.id,
                      className: "blog-heading font-heading text-[var(--color-charcoal)] mt-10 xs:mt-12 sm:mt-14 md:mt-16 mb-6 xs:mb-7 sm:mb-8 first:mt-0 scroll-mt-20 xs:scroll-mt-22 sm:scroll-mt-24",
                      style: {
                        fontSize: block.level === 1 
                          ? 'clamp(1.75rem, 4vw, 2.5rem)' 
                          : block.level === 2 
                          ? 'clamp(1.5rem, 3.5vw, 2rem)' 
                          : 'clamp(1.25rem, 3vw, 1.75rem)',
                        fontWeight: 700,
                        lineHeight: 1.2,
                      },
                      children: block.content,
                    }
                    return React.createElement(HeadingTag, headingProps)
                  } else {
                    return (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="font-body text-base xs:text-lg sm:text-xl text-[var(--color-charcoal)] leading-relaxed mb-6 xs:mb-7 sm:mb-8 whitespace-pre-line"
                      >
                        {block.content.trim()}
                      </motion.p>
                    )
                  }
                })
              )}
            </div>
          </article>

          {/* Table of Contents Sidebar - Right Side - Sticky positioning starts below image */}
          <aside
            ref={tocRef}
            className="hidden lg:block"
            style={{ width: '320px' }}
          >
            {/* Sticky Sidebar - Starts below image, then sticks as you scroll */}
            <div 
              ref={sidebarRef}
              className="z-40 w-full"
              style={{ 
                position: 'sticky',
                top: '6rem',
                maxHeight: sidebarBottom.includes('px') 
                  ? `calc(100vh - ${sidebarBottom.replace('px', '')}px - 6rem)` 
                  : `calc(100vh - 8rem - 6rem)`,
              }}
            >
            <div 
              className="bg-white rounded-xl lg:rounded-2xl shadow-brand border border-[var(--color-charcoal)]/5 flex flex-col"
              style={{
                height: '100%',
                maxHeight: '100%',
              }}
            >
                {/* Progress Indicator - FIXED AT TOP - ALWAYS VISIBLE */}
                <div className={`flex-shrink-0 p-4 lg:p-6 ${headings.length > 0 ? "pb-3 lg:pb-4 border-b border-[var(--color-charcoal)]/10" : ""}`}>
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <span className="font-mono text-[10px] lg:text-xs text-[var(--color-charcoal)]/60 uppercase tracking-wider">
                      PROGRESS
                    </span>
                    <span className="font-mono text-xl lg:text-2xl font-bold text-[var(--color-primary)] tabular-nums">
                      {String(Math.round(scrollProgress)).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-1.5 lg:h-2 bg-[var(--color-charcoal)]/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                      style={{ width: `${scrollProgress}%` }}
                    />
                  </div>
                  <div className="mt-1.5 lg:mt-2 text-right">
                    <span className="font-mono text-[10px] lg:text-xs text-[var(--color-charcoal)]/40">%</span>
                  </div>
                </div>

                {/* In This Article - SCROLLABLE SECTION */}
                <div 
                  ref={sidebarScrollContainerRef}
                  className="flex-1 overflow-y-auto p-4 lg:p-6 pt-3 lg:pt-4"
                  style={{
                    minHeight: 0, // Important for flex child to scroll
                  }}
                >
                  <h3 className="font-heading text-base lg:text-lg font-semibold text-[var(--color-charcoal)] mb-4 lg:mb-6 uppercase tracking-wide">
                    IN THIS ARTICLE
                  </h3>
                  {headings.length > 0 ? (
                    <nav ref={navRef} className="space-y-2 lg:space-y-3">
                      {headings.map((heading) => {
                        const isActive = activeHeadingId === heading.id
                        return (
                          <button
                            key={heading.id}
                            ref={isActive ? activeHeadingButtonRef : null}
                            onClick={() => scrollToHeading(heading.id)}
                            className={`relative block w-full text-left transition-all duration-200 ${
                              isActive
                                ? 'text-[var(--color-primary)] font-semibold'
                                : 'text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]'
                            }`}
                            style={{
                              paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                              fontSize: heading.level === 1 
                                ? 'clamp(0.875rem, 1.2vw, 0.95rem)' 
                                : heading.level === 2 
                                ? 'clamp(0.8rem, 1.1vw, 0.9rem)' 
                                : 'clamp(0.75rem, 1vw, 0.85rem)',
                              lineHeight: 1.5,
                            }}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="activeHeading"
                                className="absolute top-0 bottom-0 w-0.5 bg-[var(--color-primary)]"
                                style={{ 
                                  left: `${(heading.level - 1) * 0.75}rem`,
                                }}
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            )}
                            <span className="relative block pl-1.5 lg:pl-2">
                              {heading.text}
                            </span>
                          </button>
                        )
                      })}
                    </nav>
                  ) : (
                    <p className="text-xs lg:text-sm text-[var(--color-charcoal)]/40 italic">
                      No headings found. Add markdown headings (## Heading) to your content to see them here.
                    </p>
                  )}
                </div>
            </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
