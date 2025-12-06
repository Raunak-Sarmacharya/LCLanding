import React from 'react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { BlogPost } from '../../lib/types'
import { useLenis } from '../../contexts/LenisContext'
import { useAuth } from '../../hooks/useAuth'
import { calculateReadingTime, formatDate } from '../../lib/blogUtils'
import ResponsiveTags from './ResponsiveTags'

/**
 * Render markdown formatting in text
 * Converts **bold**, *italic*, `code`, [links](url) to React elements
 * Handles nested formatting (e.g., **bold with *italic* inside**)
 */
function renderMarkdownText(text: string, depth: number = 0): React.ReactNode[] {
  if (!text || depth > 3) return [text] // Prevent infinite recursion

  const parts: React.ReactNode[] = []
  let key = 0

  interface Match {
    start: number
    end: number
    type: 'code' | 'link' | 'bold' | 'italic'
    content: string
    url?: string
  }

  const matches: Match[] = []

  // Process inline code first (highest priority - no formatting inside)
  const codeRegex = /`([^`]+)`/g
  let codeMatch
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    matches.push({
      start: codeMatch.index,
      end: codeMatch.index + codeMatch[0].length,
      type: 'code',
      content: codeMatch[1],
    })
  }

  // Process links [text](url) - but skip if inside code
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let linkMatch
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    const isInsideCode = matches.some(
      (m) => m.type === 'code' && linkMatch!.index >= m.start && linkMatch!.index < m.end
    )
    if (!isInsideCode) {
      matches.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length,
        type: 'link',
        content: linkMatch[1],
        url: linkMatch[2],
      })
    }
  }

  // Process bold **text** or __text__ - but skip if inside code or link
  const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g
  let boldMatch
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    const isInsideOther = matches.some(
      (m) => (m.type === 'code' || m.type === 'link') && boldMatch!.index >= m.start && boldMatch!.index < m.end
    )
    if (!isInsideOther) {
      matches.push({
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        type: 'bold',
        content: boldMatch[1] || boldMatch[2],
      })
    }
  }

  // Process italic *text* or _text_ - but skip if inside code, link, or bold
  const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g
  let italicMatch
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    const isInsideOther = matches.some(
      (m) => (m.type === 'code' || m.type === 'link' || m.type === 'bold') && 
             italicMatch!.index >= m.start && italicMatch!.index < m.end
    )
    if (!isInsideOther) {
      matches.push({
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        type: 'italic',
        content: italicMatch[1] || italicMatch[2],
      })
    }
  }

  // Sort matches by position and remove overlaps (keep higher priority)
  const sortedMatches = matches
    .sort((a, b) => a.start - b.start)
    .filter((match, index, arr) => {
      // Remove if this match overlaps with a higher priority match
      return !arr.some((other, otherIndex) => {
        if (otherIndex >= index) return false
        const priority = { code: 4, link: 3, bold: 2, italic: 1 }
        if (priority[other.type] > priority[match.type]) {
          return match.start < other.end && match.end > other.start
        }
        return false
      })
    })

  let lastIndex = 0

  sortedMatches.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      const beforeText = text.substring(lastIndex, match.start)
      if (beforeText) {
        parts.push(beforeText)
      }
    }

    // For bold/italic, recursively process nested formatting
    const content = (match.type === 'bold' || match.type === 'italic') && depth < 2
      ? renderMarkdownText(match.content, depth + 1)
      : match.content

    switch (match.type) {
      case 'code':
        parts.push(
          <code
            key={key++}
            className="bg-[var(--color-cream-dark)]/50 px-1.5 py-0.5 rounded text-[var(--color-primary)] font-mono text-sm"
          >
            {content}
          </code>
        )
        break
      case 'link':
        parts.push(
          <a
            key={key++}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            {content}
          </a>
        )
        break
      case 'bold':
        parts.push(<strong key={key++}>{content}</strong>)
        break
      case 'italic':
        parts.push(<em key={key++}>{content}</em>)
        break
    }

    lastIndex = match.end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

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
  const { isAdmin } = useAuth()
  const [sidebarBottom, setSidebarBottom] = useState<string>('clamp(10rem, 20vh, 20rem)')
  // State for fixed sidebar positioning
  const [sidebarStyle, setSidebarStyle] = useState<{
    isFixed: boolean
    left: number
    top: number
  }>({ isFixed: false, left: 0, top: 96 }) // 96px = 6rem default top


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

      // Get current scroll position
      // Use Lenis scroll position if available, otherwise use window.scrollY
      const lenis = lenisRef?.current?.lenis
      const scrollY = lenis ? lenis.scroll : (window.scrollY || window.pageYOffset || 0)

      // Get article's absolute position in the document
      // We need to calculate this differently because Lenis uses transforms
      const articleRect = article.getBoundingClientRect()

      // With Lenis, getBoundingClientRect is already correct because it's relative to viewport
      // The scroll position from Lenis gives us how far we've scrolled
      const articleTop = articleRect.top + scrollY
      const articleHeight = article.offsetHeight
      const articleBottom = articleTop + articleHeight

      // Progress calculation:
      // 0% when we start reading the article (scrolled to article top)
      // 100% when we've scrolled through the entire article
      const scrollStart = articleTop - windowHeight * 0.1  // Start slightly before article enters
      const scrollEnd = articleBottom - windowHeight * 0.3  // End when near bottom of article
      const totalScrollable = scrollEnd - scrollStart

      // Handle edge cases
      if (totalScrollable <= 0) {
        setScrollProgress(articleRect.top <= 0 ? 100 : 0)
        return
      }

      // Calculate current progress
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

    // Listen to Lenis scroll events if available, otherwise use window scroll
    const lenis = lenisRef?.current?.lenis
    if (lenis) {
      lenis.on('scroll', throttledHandleScroll)
    }
    // Always add window scroll listener as fallback (covers cases where Lenis isn't controlling scroll)
    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
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
      }
      window.removeEventListener('scroll', throttledHandleScroll)
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

  // Prevent sidebar from overlapping footer AND handle fixed positioning
  // Since Lenis uses transforms that break CSS sticky, we use JavaScript to manage fixed positioning
  useEffect(() => {
    let rafId: number | null = null
    let lastBottom = sidebarBottom
    let lastIsFixed = sidebarStyle.isFixed
    let lastLeft = sidebarStyle.left

    const updateSidebarPosition = () => {
      if (!sidebarRef.current || !tocRef.current || !contentRef.current) return

      // Get current scroll position
      const lenis = lenisRef?.current?.lenis
      const scrollY = lenis ? lenis.scroll : (window.scrollY || window.pageYOffset || 0)

      // Get the tocRef's position (this is where the sidebar placeholder is)
      const tocRect = tocRef.current.getBoundingClientRect()
      const tocAbsoluteTop = tocRect.top + scrollY

      // The sidebar should become fixed when we've scrolled past where it would naturally be
      const fixedTopOffset = 96 // 6rem in pixels
      const shouldBeFixed = scrollY > (tocAbsoluteTop - fixedTopOffset)

      // Calculate the left position from the tocRef element
      const newLeft = tocRect.left

      // Handle footer
      const footer = document.getElementById('contact')
      let newBottom = 'clamp(10rem, 20vh, 20rem)'

      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        // Calculate distance from bottom of viewport to top of footer
        const footerTopFromBottom = viewportHeight - footerRect.top

        // If footer is visible in viewport and would overlap sidebar
        if (footerTopFromBottom > 0 && footerTopFromBottom < viewportHeight) {
          const padding = 32
          const footerBottom = Math.max(padding, footerTopFromBottom + padding)
          newBottom = `${footerBottom}px`
        }
      }

      // Update state only if values changed
      if (lastBottom !== newBottom) {
        setSidebarBottom(newBottom)
        lastBottom = newBottom
      }

      if (lastIsFixed !== shouldBeFixed || lastLeft !== newLeft) {
        setSidebarStyle({
          isFixed: shouldBeFixed,
          left: newLeft,
          top: fixedTopOffset,
        })
        lastIsFixed = shouldBeFixed
        lastLeft = newLeft
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

    // Listen to both Lenis and window scroll events
    const lenis = lenisRef?.current?.lenis
    if (lenis) {
      lenis.on('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

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
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [lenisRef, sidebarBottom, sidebarStyle.isFixed, sidebarStyle.left])


  const tags = post.tags && Array.isArray(post.tags) ? post.tags : []
  const readingTime = calculateReadingTime(post)

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
              <ResponsiveTags
                tags={tags}
                gap="gap-1.5 xs:gap-2"
                tagClassName="inline-block border border-[var(--color-charcoal)]/20 rounded-md px-2 xs:px-2.5 py-1 xs:py-1.5"
                getTagStyle={() => ({
                  background: 'rgba(0, 0, 0, 0.05)',
                })}
                renderTagContent={(tag) => (
                  <span className="font-mono text-xs xs:text-sm uppercase tracking-wide text-[var(--color-charcoal)]">
                    {tag}
                  </span>
                )}
              />
            )}
            {/* Reading Time, Date, Author, and Edit Button on Right */}
            <div className="flex items-center gap-3 xs:gap-4 ml-auto">
              <div className="flex items-center gap-2 text-sm xs:text-base text-[var(--color-charcoal)]/70">
                <span className="font-body text-[var(--color-primary)] font-semibold">
                  {post.author_name}
                </span>
                <span className="text-[var(--color-charcoal)]/30">•</span>
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
              {/* Edit Button - Admin Only */}
              {isAdmin && (
                <Link
                  to={`/blog/${post.slug}/edit`}
                  className="inline-flex items-center gap-1.5 xs:gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded-full font-body font-semibold text-xs xs:text-sm transition-all duration-300 hover:scale-105 shadow-md shadow-[var(--color-primary)]/20"
                  title="Edit this post"
                >
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden xs:inline">Edit</span>
                </Link>
              )}
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
                      className={`relative block w-full text-left transition-all duration-200 ${isActive
                        ? 'text-[var(--color-primary)] font-semibold'
                        : 'text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]'
                        }`}
                      style={{
                        paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                        fontSize: heading.level === 1
                          ? 'clamp(0.875rem, 1.2vw, 0.95rem)'
                          : heading.level === 2
                            ? 'clamp(0.8rem, 1.1vw, 0.9rem)'
                            : heading.level === 3
                              ? 'clamp(0.75rem, 1vw, 0.85rem)'
                              : heading.level === 4
                                ? 'clamp(0.7rem, 0.95vw, 0.8rem)'
                                : heading.level === 5
                                  ? 'clamp(0.65rem, 0.9vw, 0.75rem)'
                                  : 'clamp(0.6rem, 0.85vw, 0.7rem)',
                        fontWeight: heading.level <= 2 ? 600 : 500,
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
                  if (block.type === 'heading' && block.level !== undefined) {
                    // Create heading element using React.createElement to avoid JSX namespace issues
                    const level = block.level as 1 | 2 | 3 | 4 | 5 | 6
                    const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
                    
                    // Define heading hierarchy with distinct sizes and weights
                    const headingStyles: Record<1 | 2 | 3 | 4 | 5 | 6, { fontSize: string; fontWeight: number }> = {
                      1: { fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 },      // H1: Largest, boldest
                      2: { fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700 },  // H2: Large, bold
                      3: { fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)', fontWeight: 600 }, // H3: Medium, semi-bold
                      4: { fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: 600 },  // H4: Small-medium, semi-bold
                      5: { fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 600 },   // H5: Small, semi-bold
                      6: { fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontWeight: 600 },     // H6: Smallest, semi-bold
                    }
                    
                    // Ensure level is within valid range (1-6), default to 3 if invalid
                    const validLevel = (level >= 1 && level <= 6) ? level : 3
                    const style = headingStyles[validLevel]
                    
                    const headingProps = {
                      key: block.id || index,
                      id: block.id,
                      className: "blog-heading font-heading text-[var(--color-charcoal)] mt-10 xs:mt-12 sm:mt-14 md:mt-16 mb-6 xs:mb-7 sm:mb-8 first:mt-0 scroll-mt-20 xs:scroll-mt-22 sm:scroll-mt-24",
                      style: {
                        fontSize: style.fontSize,
                        fontWeight: style.fontWeight,
                        lineHeight: 1.2,
                      },
                      children: block.content,
                    }
                    return React.createElement(HeadingTag, headingProps)
                  } else {
                    return (
                      <p
                        key={index}
                        className="font-body text-base xs:text-lg sm:text-xl text-[var(--color-charcoal)] leading-relaxed mb-6 xs:mb-7 sm:mb-8 whitespace-pre-line"
                      >
                        {renderMarkdownText(block.content.trim())}
                      </p>
                    )
                  }
                })
              )}
            </div>
          </article>

          {/* Table of Contents Sidebar - Right Side */}
          {/* The aside acts as a placeholder to maintain grid layout */}
          <aside
            ref={tocRef}
            className="hidden lg:block relative"
            style={{ width: '320px', minHeight: '100px' }}
          >
            {/* Sidebar content - Fixed when scrolling past initial position */}
            <div
              ref={sidebarRef}
              className="z-40"
              style={{
                position: sidebarStyle.isFixed ? 'fixed' : 'relative',
                top: sidebarStyle.isFixed ? `${sidebarStyle.top}px` : 0,
                left: sidebarStyle.isFixed ? `${sidebarStyle.left}px` : 0,
                width: '320px',
                maxHeight: sidebarBottom.includes('px')
                  ? `calc(100vh - ${sidebarBottom.replace('px', '')}px - 6rem)`
                  : `calc(100vh - 14rem)`,
              }}
            >
              <div
                className="bg-white rounded-xl lg:rounded-2xl shadow-brand border border-[var(--color-charcoal)]/5 flex flex-col overflow-hidden"
                style={{
                  maxHeight: 'inherit',
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
                            className={`relative block w-full text-left transition-all duration-200 ${isActive
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
