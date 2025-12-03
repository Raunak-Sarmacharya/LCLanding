import { motion, useInView } from 'motion/react'
import { useRef, useState, useEffect } from 'react'
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
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const [current, setCurrent] = useState(0)
  const xRefs = useRef<{ [key: number]: number }>({})
  const yRefs = useRef<{ [key: number]: number }>({})

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
  
  const handlePreviousClick = () => {
    const previous = current - 1
    const newCurrent = previous < 0 ? publishedPosts.length - 1 : previous
    animateToSlide(newCurrent)
  }

  const handleNextClick = () => {
    const next = current + 1
    const newCurrent = next === publishedPosts.length ? 0 : next
    animateToSlide(newCurrent)
  }

  const handleSlideClick = (index: number) => {
    if (current !== index) {
      animateToSlide(index)
    }
  }

  // Smooth animation to slide using GSAP with combined 3D transforms
  const animateToSlide = (targetIndex: number) => {
    // Animate all cards smoothly with combined 3D transforms
    cardRefs.current.forEach((card, index) => {
      if (!card) return
      
      const offset = index - targetIndex
      const isActive = targetIndex === index
      
      // Calculate 3D transform values
      const translateX = offset * 850
      const translateZ = isActive ? 0 : -200 // Push inactive cards back
      const rotateY = isActive ? 0 : offset * 15 // Rotate on Y-axis for carousel effect
      const scale = isActive ? 1 : 0.85
      const opacity = isActive ? 1 : 0.3
      
      // Use GSAP's individual transform properties for proper animation
      gsap.to(card, {
        x: translateX,
        z: translateZ,
        rotationY: rotateY,
        scale: scale,
        opacity: opacity,
        zIndex: isActive ? 10 : Math.abs(offset),
        duration: 1.2,
        ease: 'power2.inOut', // Smoother easing
        overwrite: true,
        force3D: true, // Force GPU acceleration
        transformOrigin: 'center center',
      })
    })
    
    setCurrent(targetIndex)
  }

  // Initialize carousel positions on mount and when posts change
  useEffect(() => {
    if (publishedPosts.length === 0) return
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      cardRefs.current.forEach((card, index) => {
        if (!card) return
        
        const offset = index - current
        const isActive = current === index
        
        const translateX = offset * 850
        const translateZ = isActive ? 0 : -200
        const rotateY = isActive ? 0 : offset * 15
        const scale = isActive ? 1 : 0.85
        const opacity = isActive ? 1 : 0.3
        
        // Set initial position using GSAP's individual transform properties
        // Use immediate: true to set without animation
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
    }, 0)
    
    return () => clearTimeout(timer)
  }, [publishedPosts.length, current])

  // Mouse tracking for 3D effect on current card
  useEffect(() => {
    const animate = () => {
      publishedPosts.forEach((_, index) => {
        if (current === index) {
          const card = cardRefs.current[index]
          if (!card) return
          
          const x = xRefs.current[index] || 0
          const y = yRefs.current[index] || 0
          card.style.setProperty("--x", `${x}px`)
          card.style.setProperty("--y", `${y}px`)
        }
      })
      requestAnimationFrame(animate)
    }

    const frameId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [current, publishedPosts.length])

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
      <div className="relative max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 w-full box-border overflow-x-clip pt-8 sm:pt-10 md:pt-12 pb-20 sm:pb-24 md:pb-28" style={{ zIndex: 2 }}>
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
        <div className="relative overflow-hidden">
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
              {publishedPosts.map((post, index) => {
                const tags = extractTags(post.title, post.content)
                const readingTime = calculateReadingTime(post.content)
                const formattedDate = formatDate(post.created_at)

                const handleMouseMove = (event: React.MouseEvent) => {
                  const el = cardRefs.current[index]
                  if (!el || current !== index) return
                  const r = el.getBoundingClientRect()
                  xRefs.current[index] = event.clientX - (r.left + Math.floor(r.width / 2))
                  yRefs.current[index] = event.clientY - (r.top + Math.floor(r.height / 2))
                }

                const handleMouseLeave = () => {
                  xRefs.current[index] = 0
                  yRefs.current[index] = 0
                }

                const isActive = current === index

                return (
                  <li
                    key={post.id}
                    ref={(el) => { cardRefs.current[index] = el }}
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
                    onClick={() => handleSlideClick(index)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      className="relative w-full h-full"
                      style={{
                        transform: isActive
                          ? 'translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)'
                          : 'none',
                        transition: 'transform 0.15s ease-out',
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
                                transition: 'opacity 0.6s ease-in-out',
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

          {/* Navigation Controls - Matching website color scheme */}
          <div className="flex items-center justify-center mt-6">
            <div
              className="flex gap-[1.87px] items-start"
              style={{
                background: 'white',
                border: '1px solid var(--color-charcoal)/10',
                borderRadius: '10.86px',
                padding: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Previous Button */}
              <button
                onClick={handlePreviousClick}
                className="flex items-center justify-center relative hover:bg-[var(--color-butter)] transition-colors duration-200"
                style={{
                  width: '43.43px',
                  height: '43.43px',
                  borderRadius: '9.75px',
                  background: 'var(--color-cream-dark)',
                  cursor: 'pointer',
                }}
                title="Go to previous slide"
                aria-label="Go to previous slide"
              >
                <div style={{ transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconArrowNarrowRight 
                    style={{
                      width: '9.55px',
                      height: '11.018px',
                      color: 'var(--color-charcoal)',
                    }}
                  />
                </div>
              </button>

              {/* Next Button */}
              <button
                onClick={handleNextClick}
                className="flex items-center justify-center relative hover:bg-[var(--color-butter)] transition-colors duration-200"
                style={{
                  width: '43.43px',
                  height: '43.43px',
                  borderRadius: '9.75px',
                  background: 'var(--color-cream-dark)',
                  cursor: 'pointer',
                }}
                title="Go to next slide"
                aria-label="Go to next slide"
              >
                <IconArrowNarrowRight 
                  style={{
                    width: '9.55px',
                    height: '11.018px',
                    color: 'var(--color-charcoal)',
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

