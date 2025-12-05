import { motion, useInView } from 'motion/react'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBlogPosts } from '../hooks/useBlog'
import type { BlogPost } from '../lib/types'
import { IconArrowNarrowRight } from '@tabler/icons-react'
import gsap from 'gsap'
import { calculateReadingTime, getTags, formatDate } from '../lib/blogUtils'

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

export default function BlogInsightsSection() {
  const { posts, loading } = useBlogPosts()
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  // Always 5 cards: 2 left, 1 center, 2 right
  const cardRefs = useRef<(HTMLLIElement | null)[]>(new Array(5).fill(null))
  // Use once: true but with a more lenient margin to ensure it triggers even when GSAP wrapper is animating
  // The margin of -150px means it triggers earlier, giving time for wrapper animation to complete
  const isInView = useInView(sectionRef, { once: true, margin: '-150px', amount: 0.1 })
  // Separate header visibility check for more reliable triggering
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px', amount: 0.05 })
  // Use virtual index for infinite scroll (can go infinitely in either direction)
  const [virtualIndex, setVirtualIndex] = useState(0)
  const xRefs = useRef<{ [key: number]: number }>({})
  const yRefs = useRef<{ [key: number]: number }>({})
  const isInitialized = useRef(false)
  const animationTimelineRef = useRef<gsap.core.Timeline | null>(null)
  
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

  // Carousel navigation handlers with smooth GSAP animations
  // Infinite scroll: always go in the same direction, never loop back
  
  const handlePreviousClick = () => {
    // Decrement virtual index (infinite scroll - keeps going left)
    const newVirtualIndex = virtualIndex - 1
    console.log('[BlogInsights] Previous clicked, animating to:', newVirtualIndex)
    animateToVirtualIndex(newVirtualIndex)
  }

  const handleNextClick = () => {
    // Increment virtual index (infinite scroll - keeps going right)
    const newVirtualIndex = virtualIndex + 1
    console.log('[BlogInsights] Next clicked, animating to:', newVirtualIndex)
    animateToVirtualIndex(newVirtualIndex)
  }

  // handleSlideClick is now handled inline in the card onClick handler
  // Removed separate function as cards now use animateToVirtualIndex directly

  // Smooth animation to virtual index using GSAP Timeline
  // Effortel-style smooth carousel animation with premium easing
  const animateToVirtualIndex = (targetVirtualIndex: number) => {
    // Calculate direction of movement
    const direction = targetVirtualIndex > virtualIndex ? -1 : 1
    // Responsive slide distance based on screen size
    const isMobile = window.innerWidth < 640
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024
    // Increased slide distance on mobile to prevent overlapping taller cards
    const slideDistance = isMobile ? 360 : isTablet ? 550 : 750 // Responsive card width spacing
    
    // Kill any existing timeline to prevent conflicts
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill()
      animationTimelineRef.current = null
    }
    
    // Create a new timeline with premium easing for Effortel-like smoothness
    const tl = gsap.timeline({
      defaults: {
        force3D: true, // Force GPU acceleration for smooth 60fps
        transformOrigin: 'center center',
      },
      overwrite: true, // Kill any conflicting animations
    })
    
    // Store timeline reference for cleanup
    animationTimelineRef.current = tl
    
    console.log('[BlogInsights] Starting animation to virtual index:', targetVirtualIndex)
    console.log('[BlogInsights] Direction:', direction)
    
    // Phase 1: Update content immediately for faster transition
    setVirtualIndex(targetVirtualIndex)
    
    // Phase 2: Wait for DOM update, then animate cards sliding in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cardRefs.current.forEach((card, index) => {
          if (!card) return
          
          const offset = index - 2
          const isActive = offset === 0
          const targetX = offset * slideDistance
          
          // Set cards to opposite side immediately (ready to slide in)
          gsap.set(card, {
            x: targetX - (direction * slideDistance),
            z: isActive ? 0 : (isMobile ? -100 : -200),
            rotationY: isActive ? 0 : (isMobile ? offset * 8 : offset * 15),
            scale: isActive ? 1 : (isMobile ? 0.9 : 0.85),
            opacity: 0.1, // All cards start with same low opacity
            zIndex: isActive ? 10 : Math.abs(offset),
          })
          
          // Calculate stagger timing based on distance from center for more dynamic effect
          const distanceFromCenter = Math.abs(offset)
          const baseStagger = distanceFromCenter * 0.04 // Stagger based on distance for natural flow
          
          // Animate cards sliding into position - enhanced smooth, coordinated timing
          // Split transform and opacity for better control and smoother transitions
          tl.to(
            card,
            {
              x: targetX,
              z: isActive ? 0 : (isMobile ? -100 : -200),
              rotationY: isActive ? 0 : (isMobile ? offset * 8 : offset * 15),
              scale: isActive ? 1 : (isMobile ? 0.9 : 0.85),
              ease: 'power3.out', // Enhanced easing for smoother deceleration
              duration: isActive ? 0.9 : 0.75, // Slightly longer for active card, smoother feel
            },
            isActive ? 0 : baseStagger // Active card starts immediately, others stagger naturally
          )
          
          // Separate opacity animation for smoother fade-in effect
          tl.to(
            card,
            {
              opacity: isActive ? 1 : 0.3,
              ease: isActive ? 'power2.inOut' : 'power2.out', // Different easing for active vs inactive
              duration: isActive ? 0.7 : 0.6, // Active card fades in more smoothly
            },
            isActive ? 0.1 : baseStagger + 0.05 // Opacity starts slightly after transform for layered effect
          )
        })
      })
    })
    
    // Play the timeline
    tl.play()
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
          
          // Responsive spacing based on screen size - increased on mobile to prevent overlapping
          const isMobile = window.innerWidth < 640
          const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024
          const slideDistance = isMobile ? 360 : isTablet ? 550 : 750 // Increased from 320 to 360 for taller cards
          
          const translateX = offset * slideDistance
          const translateZ = isActive ? 0 : (isMobile ? -100 : -200)
          const rotateY = isActive ? 0 : (isMobile ? offset * 8 : offset * 15)
          const scale = isActive ? 1 : (isMobile ? 0.9 : 0.85)
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

  // Get image URL - use post image_url if available, otherwise generate placeholder
  const getImageUrl = (post: BlogPost) => {
    if (post.image_url && post.image_url.trim()) {
      return post.image_url
    }
    // Generate placeholder image if no image_url provided
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
        zIndex: 0,
        opacity: 1,
        visibility: 'visible'
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
      <div className="relative max-w-[1400px] mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-6 w-full box-border overflow-x-visible pt-6 xs:pt-8 sm:pt-10 md:pt-12 pb-16 xs:pb-20 sm:pb-24 md:pb-28" style={{ zIndex: 10, position: 'relative' }}>
        {/* Premium Section Header - Matching AppPromo and FeaturedChefs elegant style */}
        <div 
          ref={headerRef}
          className="pt-8 xs:pt-10 sm:pt-12 md:pt-16 lg:pt-20 pb-10 xs:pb-12 sm:pb-14 md:pb-16 lg:pb-12" 
          style={{ position: 'relative', zIndex: 10, visibility: 'visible', opacity: 1 }}
        >
          <div className="grid lg:grid-cols-12 gap-4 xs:gap-5 sm:gap-6 items-start lg:items-end">
            {/* Left side - Main headline */}
            <div className="lg:col-span-7 w-full" style={{ position: 'relative', zIndex: 10 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={(isInView || isHeaderInView) ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4 xs:mb-5 sm:mb-6 md:mb-8"
              >
                <div className="inline-block relative pb-1.5 xs:pb-2 sm:pb-2.5 md:pb-3">
                  <span className="font-display text-[clamp(1.25rem,5vw,1.75rem)] xs:text-[clamp(1.5rem,5vw,2rem)] sm:text-[clamp(1.75rem,4.5vw,2.5rem)] md:text-[clamp(2rem,4vw,2.75rem)] lg:text-[clamp(2.25rem,3.5vw,3rem)] text-white leading-tight tracking-tight">
                    Blog{' '}
                    <span className="font-heading text-[clamp(1.25rem,5vw,1.75rem)] xs:text-[clamp(1.5rem,5vw,2rem)] sm:text-[clamp(1.75rem,4.5vw,2.5rem)] md:text-[clamp(2rem,4vw,2.75rem)] lg:text-[clamp(2.25rem,3.5vw,3rem)] text-white/90">
                      Insights
                    </span>
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] xs:h-[1.5px] sm:h-[2px] bg-gradient-to-r from-transparent via-white/50 via-white/70 via-white/50 to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={(isInView || isHeaderInView) ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-3 xs:mb-4 sm:mb-5"
              >
                <span className="inline-block font-mono text-[10px] xs:text-xs text-white/60 uppercase tracking-[0.2em] xs:tracking-[0.3em]">
                  From Our Kitchen
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 60 }}
                animate={(isInView || isHeaderInView) ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading text-[clamp(1.75rem,8vw,2.5rem)] xs:text-[clamp(2rem,8vw,3rem)] sm:text-[clamp(2.5rem,7vw,4rem)] md:text-[clamp(3rem,6.5vw,4.5rem)] lg:text-[clamp(4rem,6vw,5.5rem)] text-white leading-[0.9] xs:leading-[0.88] sm:leading-[0.86] md:leading-[0.85] tracking-tight mb-6 xs:mb-7 sm:mb-8 md:mb-10 lg:mb-4"
                style={{ visibility: 'visible', wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                Food <span className="font-display text-[var(--color-butter)] italic">Stories</span>
                <br className="hidden xs:block" />
                <span className="font-display text-white/90 block xs:inline">From Local Chefs</span>
              </motion.h2>
            </div>

            {/* Right side - Subtext */}
            <div className="lg:col-span-5 lg:pb-2" style={{ position: 'relative', zIndex: 10 }}>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={(isInView || isHeaderInView) ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-body text-base sm:text-lg md:text-xl text-white/70 leading-relaxed max-w-md"
              >
                Discover authentic recipes, cooking tips, and stories from passionate local chefs in your community.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Carousel Container with 3D Perspective - Matching Figma Design */}
        <div className="relative overflow-visible mt-8 xs:mt-10 sm:mt-12 md:mt-14 lg:mt-10">
          <div 
            className="relative w-full flex items-center justify-center" 
            style={{ 
              perspective: '1500px', // Increased perspective for more dramatic effect
              perspectiveOrigin: 'center center',
              transformStyle: 'preserve-3d', 
              minHeight: 'clamp(400px, 95vw, 500px)', // Increased for taller cards on mobile
              paddingBottom: 'clamp(20px, 5vw, 40px)', // Extra space at bottom for taller cards
              paddingTop: 'clamp(10px, 2vw, 20px)', // Extra space at top to prevent overlap
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
                
                const tags = getTags(post)
                const readingTime = calculateReadingTime(post)
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
                        // Responsive spacing based on screen size
                        const isMobile = window.innerWidth < 640
                        const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024
                        const slideDistance = isMobile ? 360 : isTablet ? 550 : 750
                        
                        gsap.set(el, {
                          x: offset * slideDistance,
                          z: isActive ? 0 : (isMobile ? -100 : -200),
                          rotationY: isActive ? 0 : (isMobile ? offset * 8 : offset * 15),
                          scale: isActive ? 1 : (isMobile ? 0.9 : 0.85),
                          opacity: isActive ? 1 : 0.3,
                          zIndex: isActive ? 10 : Math.abs(offset),
                          transformOrigin: 'center center',
                          force3D: true,
                          immediateRender: true,
                        })
                      }
                    }}
                    className="absolute flex flex-col items-center justify-center cursor-pointer h-auto sm:h-[clamp(200px,42vw,363px)] min-h-[clamp(350px,90vw,450px)] sm:min-h-[clamp(200px,42vw,363px)]"
                    style={{
                      width: 'clamp(280px, 85vw, 855px)',
                      transformOrigin: 'center center',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform, opacity',
                      pointerEvents: 'auto',
                      // Prevent overlapping by ensuring proper spacing
                      marginBottom: '0',
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
                        {/* Card structure - Responsive: Mobile (image top) / Desktop (image left) */}
                        <div 
                          className="relative rounded-[10px] xs:rounded-[12px] sm:rounded-[14.48px] border border-[var(--color-charcoal)]/10 overflow-hidden flex flex-col md:flex-row h-full min-h-full shadow-brand"
                          style={{ 
                            background: 'white',
                            padding: 'clamp(3px, 0.5vw, 3.417px)',
                          }}
                        >
                          {/* Image Container - Full width on mobile (top), fixed width on desktop (left) */}
                          <div 
                            className="relative flex-shrink-0 overflow-hidden rounded-[8px] xs:rounded-[10px] sm:rounded-[10.86px] md:rounded-[10.86px] w-full h-[clamp(200px,50vw,280px)] md:h-full md:w-[clamp(250px,40%,450px)]" 
                            style={{ 
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

                          {/* Text Container - Full width on mobile (below image), remaining space on desktop (right) */}
                          <div 
                            className="relative flex-shrink-0 flex flex-col w-full md:w-auto md:flex-1 p-4 xs:p-5 sm:p-5 md:p-[clamp(16px,3.4vw,28.956px)] md:pr-[clamp(20px,5.1vw,43.434px)] md:pb-[clamp(16px,4.1vw,28.956px)] md:pl-[clamp(16px,4.1vw,34.747px)] min-h-0 md:min-h-full" 
                            style={{ 
                              gap: 'clamp(10px, 2vw, 21.7px)',
                              background: 'transparent',
                              overflow: 'visible',
                            }}
                          >
                            {/* Meta Info at top right - Date and Reading Time - Responsive positioning */}
                            <div className="absolute top-4 xs:top-5 md:top-[clamp(16px,3.4vw,28.956px)] right-4 xs:right-5 md:right-[clamp(20px,5.1vw,43.434px)] flex flex-col items-end gap-1 xs:gap-[clamp(2px, 0.1vw, 0.81px)] z-10">
                              <div className="flex gap-2 xs:gap-[clamp(2px, 0.4vw, 3.61px)] items-center" style={{ opacity: 0.6 }}>
                                <span 
                                  className="font-mono"
                                  style={{
                                    fontSize: 'clamp(10px, 1.4vw, 11.5px)',
                                    lineHeight: 'clamp(14px, 2vw, 18px)',
                                    color: 'var(--color-charcoal)',
                                  }}
                                >
                                  {readingTime}
                                </span>
                                <span 
                                  className="font-mono"
                                  style={{
                                    fontSize: 'clamp(10px, 1.4vw, 12px)',
                                    lineHeight: 'clamp(14px, 2vw, 18px)',
                                    color: 'var(--color-charcoal)',
                                  }}
                                >
                                  min
                                </span>
                              </div>
                              <div 
                                className="font-mono text-right"
                                style={{
                                  fontSize: 'clamp(10px, 1.5vw, 12px)',
                                  lineHeight: 'clamp(14px, 2vw, 18px)',
                                  color: 'var(--color-charcoal)',
                                  opacity: 0.6,
                                }}
                              >
                                {formattedDate}
                              </div>
                            </div>

                            {/* Tags - Matching website color scheme - Show ALL tags */}
                            {tags.length > 0 && (
                              <div className="flex gap-2 xs:gap-[clamp(2px, 0.4vw, 3.61px)] items-start flex-shrink-0 mb-1 xs:mb-0 flex-wrap">
                                {tags.map((tag, tagIndex) => (
                                  <span 
                                    key={tagIndex}
                                    className="border border-[var(--color-charcoal)]/20 rounded-md xs:rounded-[clamp(2px, 0.4vw, 3.62px)] px-2.5 xs:px-[clamp(4px, 0.7vw, 5.734px)] py-1.5 xs:py-[clamp(3px, 0.5vw, 4.286px)]"
                                    style={{ 
                                      background: tagIndex === 0 ? 'var(--color-butter)' : 'var(--color-cream-dark)',
                                    }}
                                  >
                                    <span 
                                      className="font-mono uppercase tracking-[-0.463px]"
                                      style={{
                                        fontSize: 'clamp(9px, 1.2vw, 8.9px)',
                                        lineHeight: 'clamp(12px, 1.6vw, 11.58px)',
                                        color: 'var(--color-charcoal)',
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Title - matching website typography */}
                            <div className="flex-1 flex flex-col justify-start sm:justify-center my-2 xs:my-0" style={{ minHeight: 'auto' }}>
                              <h3 
                                className="font-heading leading-tight sm:leading-[clamp(18px, 3.2vw, 27.07px)] tracking-[-0.5px] sm:tracking-[-0.985px] group-hover:text-[var(--color-primary)] transition-colors duration-300 break-words line-clamp-2 xs:line-clamp-3 sm:line-clamp-4"
                                style={{
                                  fontSize: 'clamp(18px, 4vw, 24px)',
                                  color: 'var(--color-charcoal)',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                }}
                              >
                                {post.title}
                              </h3>
                            </div>

                            {/* Short Description/Excerpt - Always show full excerpt */}
                            {post.excerpt && (
                              <div className="flex-shrink-0 mb-2 xs:mb-3 sm:mb-4">
                                <p
                                  className="font-body leading-relaxed"
                                  style={{
                                    fontSize: 'clamp(13px, 1.9vw, 15px)',
                                    lineHeight: 'clamp(20px, 2.8vw, 24px)',
                                    color: 'var(--color-charcoal)',
                                    opacity: 0.75,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                  }}
                                >
                                  {post.excerpt}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Navigation Controls - Aligned to left edge of centered card - Responsive */}
          <div className="flex items-center justify-center sm:justify-start mt-4 xs:mt-5 sm:mt-6 px-4 sm:px-0">
            {/* Unified container overlay - subtle warm tone complementing white buttons */}
            <div
              className="flex gap-2 xs:gap-2.5 sm:gap-1.5 items-center"
              style={{
                // Responsive alignment - center on mobile, align to card on larger screens
                marginLeft: '0',
                marginRight: '0',
                // Unified container: subtle warm cream background that complements white buttons
                // Using low opacity to maintain visibility on dark background while being subtle
                background: 'rgba(255, 237, 213, 0.12)', // Warm butter/cream with low opacity
                border: '1px solid rgba(255, 237, 213, 0.2)', // Subtle warm border
                borderRadius: 'clamp(12px, 1.8vw, 14px)', // Slightly larger than button radius for visual harmony
                padding: 'clamp(6px, 1.2vw, 4px)', // Better padding on mobile for touch targets
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              {/* Previous Button - White background matching website's button style */}
              <button
                onClick={handlePreviousClick}
                className="flex items-center justify-center relative transition-all duration-200 hover:shadow-lg active:scale-95"
                style={{
                  width: 'clamp(48px, 6.5vw, 52px)',
                  height: 'clamp(48px, 6.5vw, 52px)',
                  borderRadius: 'clamp(12px, 1.6vw, 12px)',
                  padding: '0',
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
                      width: 'clamp(14px, 1.9vw, 16px)',
                      height: 'clamp(14px, 1.9vw, 16px)',
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
                  width: 'clamp(48px, 6.5vw, 52px)',
                  height: 'clamp(48px, 6.5vw, 52px)',
                  borderRadius: 'clamp(12px, 1.6vw, 12px)',
                  padding: '0',
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
                    width: 'clamp(14px, 1.9vw, 16px)',
                    height: 'clamp(14px, 1.9vw, 16px)',
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

