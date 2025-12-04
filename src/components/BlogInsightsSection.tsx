import { motion, useInView } from 'motion/react'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBlogPosts } from '../hooks/useBlog'
import type { BlogPost } from '../lib/types'
import { IconArrowNarrowRight } from '@tabler/icons-react'
import gsap from 'gsap'

/**
 * Blog Insights Section - Horizontal Scrollable Blog Cards
 * 
 * Design based on Figma reference:
 * - Image on left, text content on right
 * - Only one card fully visible at once
 * - Previous and next cards show as ghost cards (reduced opacity)
 * - Snap scrolling for centered cards
 * - Tags, title, reading time, and date on right side
 * - Responsive for mobile and desktop
 */

// Helper function to calculate reading time (250 words per minute)
function calculateReadingTime(content: string): number {
  // Handle empty content (list view doesn't include content)
  if (!content || content.trim().length === 0) {
    return 3 // Default to 3 minutes if content is not available
  }
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 250))
}

// Helper function to extract tags from title/content
function extractTags(title: string, content: string): string[] {
  // Combine title and content for keyword extraction
  const text = `${title} ${content}`.toLowerCase()
  
  // Common food/cooking related keywords
  const keywords = [
    'recipe', 'cooking', 'chef', 'cuisine', 'food', 'meal', 'dish',
    'biryani', 'noodles', 'cake', 'shrimp', 'wrap', 'local', 'authentic',
    'homemade', 'traditional', 'spice', 'flavor', 'taste', 'kitchen',
    'restaurant', 'dining', 'culinary', 'gourmet', 'delicious'
  ]
  
  const foundTags: string[] = []
  
  // Find matching keywords
  keywords.forEach(keyword => {
    if (text.includes(keyword) && foundTags.length < 3) {
      // Capitalize first letter
      const tag = keyword.charAt(0).toUpperCase() + keyword.slice(1)
      if (!foundTags.includes(tag)) {
        foundTags.push(tag)
      }
    }
  })
  
  // If no tags found, extract first word from title as fallback
  if (foundTags.length === 0) {
    const firstWord = title.split(' ')[0]
    if (firstWord.length > 2) {
      foundTags.push(firstWord)
    }
  }
  
  // Limit to 2-3 tags
  return foundTags.slice(0, 3)
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogInsightsSection() {
  const { posts, loading } = useBlogPosts()
  const sectionRef = useRef<HTMLElement>(null)
  // Always 5 cards: 2 left, 1 center, 2 right
  const cardRefs = useRef<(HTMLLIElement | null)[]>(new Array(5).fill(null))
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  // Use virtual index for infinite scroll (can go infinitely in either direction)
  const [virtualIndex, setVirtualIndex] = useState(0)
  const xRefs = useRef<{ [key: number]: number }>({})
  const yRefs = useRef<{ [key: number]: number }>({})
  const isInitialized = useRef(false)
  const animationTimelineRef = useRef<gsap.core.Timeline | null>(null)
  
  // Convert virtual index to actual post index (for infinite scroll)
  const getPostIndex = (virtualIdx: number): number => {
    if (publishedPosts.length === 0) return 0
    // Use modulo to map virtual index to actual post index
    // Handle negative indices properly
    const mod = ((virtualIdx % publishedPosts.length) + publishedPosts.length) % publishedPosts.length
    return mod
  }
  
  // Get the actual current post index (for reference if needed)
  // const current = getPostIndex(virtualIndex)

  // Debug: Log posts to see what we're getting
  useEffect(() => {
    console.log('[BlogInsightsSection] Posts received:', posts.length)
    console.log('[BlogInsightsSection] Posts data:', posts)
    if (posts.length > 0) {
      console.log('[BlogInsightsSection] First post published status:', posts[0]?.published)
      console.log('[BlogInsightsSection] All posts published status:', posts.map(p => ({ id: p.id, title: p.title, published: p.published })))
    }
  }, [posts])

  // Filter posts: show if published is true OR undefined (treat undefined as published)
  // Only exclude posts where published is explicitly false
  const publishedPosts = posts
    .filter(post => post.published !== false) // Show if true or undefined
    .slice(0, 6) // Limit to 6 posts

  // Carousel navigation handlers with smooth GSAP animations
  // Infinite scroll: always go in the same direction, never loop back
  
  const handlePreviousClick = () => {
    // Decrement virtual index (infinite scroll - keeps going left)
    const newVirtualIndex = virtualIndex - 1
    animateToVirtualIndex(newVirtualIndex)
  }

  const handleNextClick = () => {
    // Increment virtual index (infinite scroll - keeps going right)
    const newVirtualIndex = virtualIndex + 1
    animateToVirtualIndex(newVirtualIndex)
  }

  // handleSlideClick is now handled inline in the card onClick handler
  // Removed separate function as cards now use animateToVirtualIndex directly

  // Smooth animation to virtual index using GSAP Timeline
  // This enables infinite scroll in either direction with smooth, organic transitions
  const animateToVirtualIndex = (targetVirtualIndex: number) => {
    // Capture current positions BEFORE any state changes
    const currentPositions = cardRefs.current.map((card) => {
      if (!card) return null
      // Get current GSAP transform values
      return {
        x: (gsap.getProperty(card, 'x') as number) || 0,
        z: (gsap.getProperty(card, 'z') as number) || 0,
        rotationY: (gsap.getProperty(card, 'rotationY') as number) || 0,
        scale: (gsap.getProperty(card, 'scale') as number) || 1,
        opacity: (gsap.getProperty(card, 'opacity') as number) || 1,
      }
    })
    
    // Update virtual index to get new content
    setVirtualIndex(targetVirtualIndex)
    
    // Use double requestAnimationFrame to ensure DOM has fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Kill any existing timeline to prevent conflicts
        if (animationTimelineRef.current) {
          animationTimelineRef.current.kill()
          animationTimelineRef.current = null
        }
        
        // Create a new timeline for coordinated, smooth animations
        const tl = gsap.timeline({
          defaults: {
            ease: 'power2.inOut', // Smooth in-out easing for natural acceleration and deceleration
            force3D: true, // Force GPU acceleration
            transformOrigin: 'center center',
          },
          overwrite: 'auto', // Automatically handle conflicting animations smoothly
        })
        
        // Store timeline reference for cleanup
        animationTimelineRef.current = tl
        
        // Animate all cards smoothly with fromTo and immediateRender: false to prevent jumps
        // We always show 5 cards: 2 left, 1 center, 2 right
        cardRefs.current.forEach((card, index) => {
          if (!card || !currentPositions[index]) return
          
          // Calculate which virtual position this card represents
          // Cards are rendered in order: [left2, left1, center, right1, right2]
          // So index 0 = left2, index 1 = left1, index 2 = center, etc.
          const offset = index - 2 // -2, -1, 0, 1, 2 (relative to center)
          const isActive = offset === 0 // Only center card is active
          
          // Calculate target 3D transform values
          // Reduced spacing from 850 to 750 to show more of faded cards on sides
          const targetTranslateX = offset * 750
          const targetTranslateZ = isActive ? 0 : -200 // Push inactive cards back
          const targetRotateY = isActive ? 0 : offset * 15 // Rotate on Y-axis for carousel effect
          const targetScale = isActive ? 1 : 0.85
          const targetOpacity = isActive ? 1 : 0.3
          
          // Get saved current position
          const current = currentPositions[index]!
          
          // Calculate stagger delay for organic, cascading flow
          // Center card starts first, then adjacent cards, creating a smooth ripple effect
          const staggerDelay = Math.abs(offset) * 0.06 // 0ms (center), 60ms, 120ms delays
          
          // Use fromTo with immediateRender: false to prevent visual jumps
          // This ensures smooth transitions from current position to target
          tl.fromTo(
            card,
            {
              // Start from saved current position
              x: current.x,
              z: current.z,
              rotationY: current.rotationY,
              scale: current.scale,
              opacity: current.opacity,
              immediateRender: false, // Critical: prevents jump by not rendering "from" values immediately
            },
            {
              // Animate to target position
              x: targetTranslateX,
              z: targetTranslateZ,
              rotationY: targetRotateY,
              scale: targetScale,
              opacity: targetOpacity,
              zIndex: isActive ? 10 : Math.abs(offset),
              duration: 1.2, // Smooth duration for elegant transitions
              clearProps: false, // Don't clear props after animation
            },
            staggerDelay // Stagger start times for cascading effect
          )
        })
      })
    })
  }

  // Track previous posts length to detect when new posts are loaded
  const prevPostsLength = useRef(publishedPosts.length)
  
  // Initialize carousel positions immediately on mount to prevent stacking
  // Use useLayoutEffect to position cards before browser paint
  // This ensures cards are positioned correctly on initial load
  useLayoutEffect(() => {
    if (publishedPosts.length === 0) return
    
    // Reset initialization if posts changed (new posts loaded)
    if (prevPostsLength.current !== publishedPosts.length) {
      isInitialized.current = false
      prevPostsLength.current = publishedPosts.length
    }
    
    // Only set initial positions if not yet initialized
    // This prevents stacking on first render
    if (!isInitialized.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const frameId = requestAnimationFrame(() => {
        // We always have 5 cards: indices 0-4 representing offsets -2, -1, 0, 1, 2
        cardRefs.current.forEach((card, cardIndex) => {
          if (!card) return
          
          const offset = cardIndex - 2 // Map cardIndex to offset: 0->-2, 1->-1, 2->0, 3->1, 4->2
          const isActive = offset === 0 // Only center card (offset 0) is active
          
          // Reduced spacing from 850 to 750 to show more of faded cards on sides
          const translateX = offset * 750
          const translateZ = isActive ? 0 : -200
          const rotateY = isActive ? 0 : offset * 15
          const scale = isActive ? 1 : 0.85
          const opacity = isActive ? 1 : 0.3
          
          // Set initial position using GSAP's set() with immediateRender
          // This positions cards before the browser paints, preventing stacking
          // Only runs once on initial mount or when posts change
          gsap.set(card, {
            x: translateX,
            z: translateZ,
            rotationY: rotateY,
            scale: scale,
            opacity: opacity,
            zIndex: isActive ? 10 : Math.abs(offset),
            transformOrigin: 'center center',
            force3D: true,
            immediateRender: true,
          })
        })
        
        isInitialized.current = true
      })
      
      return () => cancelAnimationFrame(frameId)
    }
  }, [publishedPosts.length]) // Only re-run when posts change, not on virtualIndex changes

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      // Kill any running animations when component unmounts
      if (animationTimelineRef.current) {
        animationTimelineRef.current.kill()
        animationTimelineRef.current = null
      }
      // Kill all tweens on cards
      cardRefs.current.forEach((card) => {
        if (card) {
          gsap.killTweensOf(card)
        }
      })
    }
  }, [])

  // Mouse tracking for 3D effect on center card (cardIndex 2, offset 0)
  useEffect(() => {
    const animate = () => {
      // Only the center card (index 2, offset 0) responds to mouse movement
      const centerCardIndex = 2
      const card = cardRefs.current[centerCardIndex]
      if (card) {
        const x = xRefs.current[centerCardIndex] || 0
        const y = yRefs.current[centerCardIndex] || 0
        card.style.setProperty("--x", `${x}px`)
        card.style.setProperty("--y", `${y}px`)
      }
      requestAnimationFrame(animate)
    }

    const frameId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [publishedPosts.length])

  // Generate a placeholder image URL based on post title (for now)
  const getImageUrl = (post: BlogPost) => {
    // You can replace this with actual image URLs from your blog posts
    // For now, using a placeholder service
    const seed = post.id || post.slug
    return `https://picsum.photos/seed/${seed}/600/400`
  }

  if (loading) {
    return null // Don't show loading state, just hide until loaded
  }

  if (publishedPosts.length === 0) {
    return null // Don't show section if no posts
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-visible"
      style={{ 
        willChange: 'scroll-position', 
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        border: 'none',
        outline: 'none',
        backgroundColor: 'var(--color-primary-dark)',
        background: 'var(--color-primary-dark)',
        position: 'relative',
        zIndex: 0
      }}
    >
      {/* Main background - part of section, extends beyond to ensure seamless transition */}
      <div 
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: '-40px', // Overlap with AppPromo's bottom overlay
          bottom: '-21px', // Overlap with NewsletterSection's top
          zIndex: 0,
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none',
          backgroundColor: 'var(--color-primary-dark)',
          background: 'var(--color-primary-dark)',
          transform: 'translateZ(0)', // Force GPU rendering
          backfaceVisibility: 'hidden',
          willChange: 'auto' // Prevent separation on scroll
        }}
      />
      
      {/* Premium Background - Constrained to upper portion only, not affecting bottom transition */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, overflow: 'hidden' }}>
        {/* Remove white blur that causes lightening - only keep subtle left-side effect */}
        {/* White blur removed to prevent lightening in bottom-right area */}
        <div 
          className="absolute top-[10%] -left-40 w-[600px] h-[600px] rounded-full bg-[var(--color-primary-dark)]/30 blur-[80px] will-change-transform" 
          style={{ 
            maxHeight: '60%', // Limit to upper portion
            clipPath: 'inset(0 0 40% 0)' // Clip bottom 40% to avoid transition area
          }} 
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            // Clip bottom 200px to ensure pure primary-dark in transition zone
            clipPath: 'inset(0 0 200px 0)',
          }}
        />
      </div>
      
      {/* Bottom transition zone - Pure primary-dark overlay covering any decorative effects */}
      {/* This ensures seamless connection with NewsletterSection */}
      <div 
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: '-21px',
          height: '200px', // Covers bottom transition area and any decorative bleed
          zIndex: 2, // Above decorative elements
          backgroundColor: 'var(--color-primary-dark)',
          background: 'var(--color-primary-dark)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      />

      {/* Content Container */}
      <div className="relative max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 w-full box-border overflow-x-visible pt-8 sm:pt-10 md:pt-12 pb-20 sm:pb-24 md:pb-28" style={{ zIndex: 2 }}>
        {/* Premium Section Header - Matching AppPromo style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-10 md:mb-12"
        >
          {/* Label - Matching AppPromo pattern */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 sm:mb-6"
          >
            <span className="inline-block font-mono text-xs sm:text-sm text-white/60 uppercase tracking-[0.3em]">
              From Our Kitchen
            </span>
          </motion.div>

          {/* Main Title - Elegant and Premium */}
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-[clamp(2rem,6vw,4.5rem)] sm:text-[clamp(2.5rem,7vw,5rem)] text-white leading-[0.9] tracking-tight"
          >
            Food <span className="font-display text-[var(--color-butter)] italic">Stories</span>
          </motion.h2>
        </motion.div>

        {/* Carousel Container with 3D Perspective - Matching Figma Design */}
        <div className="relative overflow-visible">
          <div 
            className="relative w-full flex items-center justify-center" 
            style={{ 
              perspective: '1500px', // Increased perspective for more dramatic effect
              perspectiveOrigin: 'center center',
              transformStyle: 'preserve-3d', 
              minHeight: '500px',
              position: 'relative',
            }}
          >
            <ul
              className="relative flex items-center justify-center"
              style={{
                width: 'max-content',
                height: '100%',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Always render 5 cards: 2 left, 1 center, 2 right */}
              {/* Cards are positioned at virtual indices: [virtualIndex-2, virtualIndex-1, virtualIndex, virtualIndex+1, virtualIndex+2] */}
              {/* Use stable keys based on offset, not virtual position, to prevent React remounting during animation */}
              {[-2, -1, 0, 1, 2].map((offset) => {
                const virtualPos = virtualIndex + offset
                const postIndex = getPostIndex(virtualPos)
                const post = publishedPosts[postIndex]
                
                if (!post) return null
                
                const tags = extractTags(post.title, post.content)
                const readingTime = calculateReadingTime(post.content)
                const formattedDate = formatDate(post.created_at)
                const cardIndex = offset + 2 // Map offset to card index: -2->0, -1->1, 0->2, 1->3, 2->4

                const handleMouseMove = (event: React.MouseEvent) => {
                  const el = cardRefs.current[cardIndex]
                  if (!el || offset !== 0) return // Only center card (offset 0) responds to mouse
                  const r = el.getBoundingClientRect()
                  xRefs.current[cardIndex] = event.clientX - (r.left + Math.floor(r.width / 2))
                  yRefs.current[cardIndex] = event.clientY - (r.top + Math.floor(r.height / 2))
                }

                const handleMouseLeave = () => {
                  xRefs.current[cardIndex] = 0
                  yRefs.current[cardIndex] = 0
                }

                const isActive = offset === 0 // Only center card is active

                return (
                  <li
                    key={`card-${offset}`} // Use stable offset-based key to prevent remounting during animation
                    ref={(el) => { 
                      cardRefs.current[cardIndex] = el
                      // Set initial position immediately when element mounts
                      // This ensures cards are positioned correctly on first render
                      if (el) {
                        // Reduced spacing from 850 to 750 to show more of faded cards on sides
                        gsap.set(el, {
                          x: offset * 750,
                          z: isActive ? 0 : -200,
                          rotationY: isActive ? 0 : offset * 15,
                          scale: isActive ? 1 : 0.85,
                          opacity: isActive ? 1 : 0.3,
                          zIndex: isActive ? 10 : Math.abs(offset),
                          transformOrigin: 'center center',
                          force3D: true,
                          immediateRender: true,
                        })
                      }
                    }}
                    className="absolute flex flex-col items-center justify-center cursor-pointer"
                    style={{
                      width: '855px',
                      height: '363px',
                      transformOrigin: 'center center',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform, opacity',
                      pointerEvents: 'auto',
                    }}
                    onClick={() => {
                      // Calculate target virtual index based on offset
                      animateToVirtualIndex(virtualIndex + offset)
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      className="relative w-full h-full"
                      style={{
                        transform: isActive
                          ? 'translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)'
                          : 'none',
                        // Removed CSS transition to prevent conflicts with GSAP animations
                        transition: 'none',
                      }}
                    >
                      <Link to={`/blog/${post.slug}`} className="block group w-full h-full">
                        {/* Card structure matching website color scheme - white/cream theme */}
                        <div 
                          className="relative rounded-[14.48px] border border-[var(--color-charcoal)]/10 overflow-hidden flex h-full shadow-brand"
                          style={{ 
                            background: 'white',
                            padding: '3.417px',
                          }}
                        >
                          {/* Left side - Image Container (matching Figma: 559.78px width) */}
                          <div 
                            className="relative flex-shrink-0 overflow-hidden rounded-[10.86px]" 
                            style={{ 
                              width: '559.78px', 
                              height: '100%',
                              background: 'var(--color-cream-dark)',
                            }}
                          >
                            <img 
                              src={getImageUrl(post)}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              style={{
                                opacity: isActive ? 1 : 0.7,
                                // Removed CSS transition to prevent conflicts with GSAP animations
                                transition: 'none',
                              }}
                              loading="lazy"
                            />
                          </div>

                          {/* Right side - Text Container (matching Figma: 288.39px width) */}
                          <div 
                            className="relative flex-shrink-0 flex flex-col" 
                            style={{ 
                              width: '288.39px', 
                              height: '100%', 
                              padding: '28.956px 43.434px 28.956px 34.747px', 
                              gap: '21.7px',
                              background: 'transparent',
                            }}
                          >
                            {/* Tags - Matching website color scheme */}
                            {tags.length > 0 && (
                              <div className="flex gap-[3.61px] items-start flex-shrink-0">
                                <span 
                                  className="border border-[var(--color-charcoal)]/20 rounded-[3.62px] px-[5.734px] py-[4.286px]"
                                  style={{ 
                                    background: 'var(--color-butter)',
                                  }}
                                >
                                  <span 
                                    className="font-mono uppercase tracking-[-0.463px]"
                                    style={{
                                      fontSize: '8.9px',
                                      lineHeight: '11.58px',
                                      color: 'var(--color-charcoal)',
                                    }}
                                  >
                                    {tags[0]}
                                  </span>
                                </span>
                                {tags.length > 1 && (
                                  <span 
                                    className="border border-[var(--color-charcoal)]/20 rounded-[3.62px] px-[5.734px] py-[3.61px] flex items-center gap-[3.61px]"
                                    style={{
                                      background: 'var(--color-cream-dark)',
                                    }}
                                  >
                                    <span 
                                      className="font-mono uppercase tracking-[-0.463px]"
                                      style={{
                                        fontSize: '11.6px',
                                        lineHeight: '11.58px',
                                        color: 'var(--color-charcoal)',
                                      }}
                                    >
                                      +
                                    </span>
                                    <span 
                                      className="font-mono uppercase tracking-[-0.463px]"
                                      style={{
                                        fontSize: '11.6px',
                                        lineHeight: '11.58px',
                                        color: 'var(--color-charcoal)',
                                      }}
                                    >
                                      {tags.length - 1}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Title - matching website typography */}
                            <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                              <h3 
                                className="font-heading leading-[27.07px] tracking-[-0.985px] line-clamp-4 group-hover:text-[var(--color-primary)] transition-colors duration-300"
                                style={{
                                  fontSize: '24px',
                                  color: 'var(--color-charcoal)',
                                }}
                              >
                                {post.title}
                              </h3>
                            </div>

                            {/* Meta Info at bottom - matching website style */}
                            <div className="flex flex-col gap-[0.81px] flex-shrink-0 mt-auto">
                              <div className="flex gap-[3.61px] items-center" style={{ opacity: 0.6 }}>
                                <span 
                                  className="font-mono"
                                  style={{
                                    fontSize: '12.3px',
                                    lineHeight: '21.72px',
                                    color: 'var(--color-charcoal)',
                                  }}
                                >
                                  {readingTime}
                                </span>
                                <span 
                                  className="font-mono"
                                  style={{
                                    fontSize: '13.9px',
                                    lineHeight: '21.72px',
                                    color: 'var(--color-charcoal)',
                                  }}
                                >
                                  min
                                </span>
                              </div>
                              <div 
                                className="font-mono"
                                style={{
                                  fontSize: '13.8px',
                                  lineHeight: '21.72px',
                                  color: 'var(--color-charcoal)',
                                }}
                              >
                                {formattedDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Navigation Controls - Aligned to left edge of centered card */}
          <div className="flex items-center mt-6" style={{ justifyContent: 'flex-start' }}>
            {/* Unified container overlay - subtle warm tone complementing white buttons */}
            <div
              className="flex gap-1.5 items-center"
              style={{
                // Align to left edge of centered card (855px wide)
                // Account for container max-width (1400px) and centering
                // On screens wider than 1400px: (1400px - 855px) / 2 = 272.5px
                // On smaller screens: (100% - 855px) / 2, but clamped to account for padding
                marginLeft: 'clamp(0.5rem, calc((100% - 855px) / 2), calc((1400px - 855px) / 2))',
                // Unified container: subtle warm cream background that complements white buttons
                // Using low opacity to maintain visibility on dark background while being subtle
                background: 'rgba(255, 237, 213, 0.12)', // Warm butter/cream with low opacity
                border: '1px solid rgba(255, 237, 213, 0.2)', // Subtle warm border
                borderRadius: '14px', // Slightly larger than button radius for visual harmony
                padding: '4px', // Small padding to create gap between container and buttons
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Previous Button - White background matching website's button style */}
              <button
                onClick={handlePreviousClick}
                className="flex items-center justify-center relative transition-all duration-200 hover:shadow-lg active:scale-95"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  // White background matching other buttons on the website
                  background: 'white',
                  // Subtle border matching website's white button style (charcoal with low opacity)
                  border: '1px solid rgba(26, 26, 26, 0.1)', // var(--color-charcoal)/10
                  cursor: 'pointer',
                  // Shadow matching website's white button style
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(245, 16, 66, 0.3)' // var(--color-primary) on hover
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 16, 66, 0.15)' // Brand color shadow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
                title="Go to previous slide"
                aria-label="Go to previous slide"
              >
                <div style={{ transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconArrowNarrowRight 
                    style={{
                      width: '16px',
                      height: '16px',
                      color: 'var(--color-primary)', // Brand color (#f51042) for arrows
                      strokeWidth: 2.5,
                    }}
                  />
                </div>
              </button>

              {/* Next Button - White background matching website's button style */}
              <button
                onClick={handleNextClick}
                className="flex items-center justify-center relative transition-all duration-200 hover:shadow-lg active:scale-95"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  // White background matching other buttons on the website
                  background: 'white',
                  // Subtle border matching website's white button style (charcoal with low opacity)
                  border: '1px solid rgba(26, 26, 26, 0.1)', // var(--color-charcoal)/10
                  cursor: 'pointer',
                  // Shadow matching website's white button style
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(245, 16, 66, 0.3)' // var(--color-primary) on hover
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 16, 66, 0.15)' // Brand color shadow
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.1)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
                title="Go to next slide"
                aria-label="Go to next slide"
              >
                <IconArrowNarrowRight 
                  style={{
                    width: '16px',
                    height: '16px',
                    color: 'var(--color-primary)', // Brand color (#f51042) for arrows
                    strokeWidth: 2.5,
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

