import { motion, useInView } from 'motion/react'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import OrderNowButton from './ui/OrderNowButton'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: 'Browse Local Menus',
    description: 'Explore a diverse range of homemade dishes from talented chefs in your neighborhood. Filter by cuisine, dietary preferences, or mood.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Place Your Order',
    description: 'Select your favorite dishes, customize them to your taste, and checkout securely with Stripe. No hidden fees, transparent pricing.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Track in Real-Time',
    description: 'Watch your meal being prepared and track delivery in real-time. Get notified at every step from kitchen to doorstep.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Enjoy & Review',
    description: 'Savor authentic homemade flavors and share your experience. Your reviews help chefs grow and others discover great meals.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
]

// OrderNowButton is now imported from './ui/OrderNowButton'

export default function HowItWorks() {
  const ref = useRef(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const shrimpRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [copied, setCopied] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    if (!isInView || !stepsRef.current) return

    const ctx = gsap.context(() => {
      // Animate step cards with stagger
      gsap.fromTo('.step-card',
        { 
          opacity: 0, 
          y: 60,
          rotateX: -15
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        }
      )

      // Animate connecting line
      gsap.fromTo('.connecting-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 1.5, ease: 'power2.out', delay: 0.5 }
      )
    }, stepsRef)

    return () => ctx.revert()
  }, [isInView])

  // 3D Parallax scroll effect for shrimp image (like Done Drinks)
  // When scrolling DOWN, the shrimp moves UP (same as biryani)
  useEffect(() => {
    if (!shrimpRef.current) return

    const ctx = gsap.context(() => {
      // Parallax: scroll DOWN = shrimp moves UP (opposite direction)
      // Start: yPercent positive (below), End: yPercent negative (above)
      gsap.fromTo(shrimpRef.current, 
        { yPercent: 50 }, // Start below its position
        {
          yPercent: -70, // End above its position (moves UP as you scroll DOWN)
          ease: 'none',
          scrollTrigger: {
            trigger: '#how-it-works',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          }
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden">
      {/* Floating Food Decoration - Shrimp with 3D Parallax (like Done Drinks) */}
      {/* HIDDEN on laptop and below (< 1536px) to prevent overlap with content */}
      {/* Only visible on 2xl+ screens (1536px+) where there's enough space */}
      <div 
        ref={shrimpRef}
        className="parallax-food absolute bottom-[15%] left-[3%] pointer-events-none select-none z-10 hidden 2xl:block"
        style={{ 
          width: 'clamp(160px, 14vw, 260px)',
          height: 'clamp(160px, 14vw, 260px)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <img 
          src="/food-shrimp.png" 
          alt="" 
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
          draggable={false}
        />
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)] via-[var(--color-butter)]/30 to-[var(--color-cream)]" />
      <div className="parallax-bg absolute top-1/4 right-0 w-80 h-80 bg-[var(--color-primary)]/5 rounded-full blur-3xl" />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative w-full box-border">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="font-mono text-sm text-[var(--color-primary)] uppercase tracking-widest mb-4 block"
          >
            How It Works
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6"
          >
            From Kitchen to{' '}
            <span className="font-display text-[var(--color-primary)]">Your Table</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-sm sm:text-sm md:text-base lg:text-lg text-[var(--color-charcoal-light)] max-w-4xl mx-auto px-4 sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis leading-relaxed"
          >
            Getting delicious homemade food has never been easier. Four simple steps to culinary happiness.
          </motion.p>
        </div>

        {/* Steps - MOBILE: 2x2 grid for readability, DESKTOP: 4-column layout */}
        {/* overflow-visible to allow step number badges to extend beyond cards without being clipped */}
        <div ref={stepsRef} className="relative w-full max-w-full overflow-visible pr-2 sm:pr-3 md:pr-4 lg:pr-6">
          {/* Connection line - show on larger screens */}
          <div className="connecting-line hidden md:block absolute top-1/2 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-[var(--color-primary)]/20 via-[var(--color-primary)]/40 to-[var(--color-primary)]/20 origin-left" />

          {/* MOBILE: 2-column grid for readability, SM+: 4 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 md:gap-4 lg:gap-6 w-full max-w-full">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="step-card relative group"
                style={{ perspective: '1000px' }}
                onMouseEnter={() => {
                  // Only enable 3D tilt on non-touch devices
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setHoveredCard(index)
                  }
                }}
                onMouseLeave={() => {
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setHoveredCard(null)
                    const cardInner = document.querySelectorAll('.card-inner')[index] as HTMLElement
                    if (cardInner) {
                      gsap.to(cardInner, {
                        rotateX: 0,
                        rotateY: 0,
                        duration: 0.5,
                        ease: 'power2.out',
                      })
                    }
                  }
                }}
                onMouseMove={(e) => {
                  // Only enable 3D tilt on non-touch devices
                  if (hoveredCard === index && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    const card = e.currentTarget
                    const rect = card.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    const centerX = rect.width / 2
                    const centerY = rect.height / 2
                    const rotateX = (y - centerY) / 25 // Slightly reduced for more subtle effect
                    const rotateY = (centerX - x) / 25
                    
                    const cardInner = card.querySelector('.card-inner') as HTMLElement
                    if (cardInner) {
                      gsap.to(cardInner, {
                        rotateX: rotateX,
                        rotateY: rotateY,
                        duration: 0.3,
                        ease: 'power2.out',
                      })
                    }
                  }
                }}
              >
                <motion.div 
                  className="card-inner bg-white rounded-xl sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-3 md:p-5 lg:p-8 shadow-lg sm:shadow-lg shadow-black/5 border border-[var(--color-cream-dark)]/50 relative z-10 h-full min-h-[140px] sm:min-h-[140px] md:min-h-[200px] lg:min-h-[280px]"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                  }}
                  whileHover={{
                    y: -4,
                    scale: 1.01,
                    transition: { 
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/0 to-[var(--color-primary)]/0 group-hover:from-[var(--color-primary)]/3 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                  
                  {/* Elegant border glow on hover - hidden on small screens */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-transparent group-hover:border-[var(--color-primary)]/20 transition-all duration-500 pointer-events-none hidden sm:block" />
                  
                  {/* Step number - responsive sizing - MOBILE: larger for readability */}
                  <div className="absolute -top-2 -right-2 sm:-top-2 sm:-right-2 md:-top-3 md:-right-3 lg:-top-4 lg:-right-4 w-7 h-7 sm:w-7 sm:h-7 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center font-mono text-[10px] sm:text-[10px] md:text-xs lg:text-sm text-white font-bold shadow-lg sm:shadow-lg shadow-[var(--color-primary)]/30 z-20 group-hover:scale-105 transition-all duration-300">
                    {step.number}
                  </div>

                  {/* Icon - responsive sizing - MOBILE: larger for visual impact */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-coral)]/10 rounded-xl sm:rounded-xl md:rounded-2xl flex items-center justify-center text-[var(--color-primary)] mb-2 sm:mb-2 md:mb-4 lg:mb-6 group-hover:scale-105 transition-all duration-500 relative z-10 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-6 sm:[&_svg]:h-6 md:[&_svg]:w-8 md:[&_svg]:h-8 lg:[&_svg]:w-10 lg:[&_svg]:h-10">
                    {step.icon}
                    {/* Subtle glow on icon hover */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-xl md:rounded-2xl bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/10 transition-all duration-500 blur-xl hidden sm:block" />
                  </div>

                  {/* Content - MOBILE: larger text for readability */}
                  <div className="relative z-10">
                    <h3 className="font-heading text-sm sm:text-xs md:text-base lg:text-xl text-[var(--color-charcoal)] mb-1 sm:mb-1 md:mb-2 lg:mb-3 group-hover:text-[var(--color-primary)] transition-colors duration-300 leading-tight">
                      {step.title}
                    </h3>
                    <p className="font-body text-[10px] sm:text-[9px] md:text-xs lg:text-base text-[var(--color-charcoal-light)] leading-relaxed sm:leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Subtle shadow enhancement on hover - hidden on small screens */}
                  <div 
                    className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none hidden sm:block"
                    style={{
                      boxShadow: '0 20px 60px -15px rgba(245, 16, 66, 0.15)',
                    }}
                  />
                </motion.div>

                {/* Arrow connector - show on larger screens only */}
                {index < steps.length - 1 && (
                  <div className="hidden xl:flex absolute top-1/2 -right-2 md:-right-3 lg:-right-4 transform -translate-y-1/2 z-20">
                    <div className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center shadow-md md:shadow-lg">
                      <svg className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA - properly contained */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-8 sm:mt-12 md:mt-16 w-full max-w-full px-4 sm:px-2"
        >
          <div className="inline-block w-[calc(100%-1rem)] sm:w-full max-w-2xl bg-[var(--color-primary)] rounded-2xl sm:rounded-3xl p-5 sm:p-5 md:p-7 shadow-xl shadow-[var(--color-primary)]/20 relative overflow-hidden box-border mx-auto">
            {/* Emoji background decorations - similar to "Your Space" card */}
            <motion.div
              className="absolute -top-8 -right-8 text-7xl sm:text-8xl md:text-9xl opacity-20 select-none pointer-events-none"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎫
            </motion.div>
            
            {/* Food emojis scattered in background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-1/4 left-8 text-5xl sm:text-6xl opacity-15 select-none"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 3, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0
                }}
              >
                🥤
              </motion.div>
              <motion.div
                className="absolute top-1/2 right-12 text-4xl sm:text-5xl opacity-15 select-none"
                animate={{ 
                  y: [0, 8, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                🥗
              </motion.div>
              <motion.div
                className="absolute bottom-1/4 left-12 text-5xl sm:text-6xl opacity-15 select-none"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                🍔
              </motion.div>
              <motion.div
                className="absolute bottom-1/3 right-8 text-4xl sm:text-5xl opacity-15 select-none"
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -3, 0]
                }}
                transition={{ 
                  duration: 7.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              >
                🍗
              </motion.div>
              <motion.div
                className="absolute top-1/3 left-1/4 text-4xl sm:text-5xl opacity-15 select-none"
                animate={{ 
                  y: [0, -6, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8
                }}
              >
                🍟
              </motion.div>
              <motion.div
                className="absolute bottom-1/4 right-1/4 text-4xl sm:text-5xl opacity-15 select-none"
                animate={{ 
                  y: [0, 8, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2
                }}
              >
                🥓
              </motion.div>
            </div>
            
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10">
              {/* Heading - One line, similar typography to "Where Flavor Meets Freedom" */}
              <h3 className="font-heading text-xl sm:text-[clamp(1.5rem,4.5vw,2.75rem)] md:text-[clamp(1.75rem,5vw,3rem)] text-white leading-[1] tracking-tight mb-4 sm:mb-5 pb-1 sm:pb-2.5">
                Ready to{' '}
                <span className="font-display text-white/90">Taste</span>
                {' '}The{' '}
                <span className="font-display text-white/90">Difference?</span>
              </h3>
              
              {/* Discount text and copy button - MOBILE: single line fit */}
              <div className="mb-4 sm:mb-5">
                <p className="font-body text-[13px] sm:text-base text-white/90 mb-3 sm:mb-3 whitespace-nowrap">
                  Use <span className="font-bold text-white">STJOHNS30</span> to get <span className="font-bold text-white text-base sm:text-xl">30% off</span> your first order
                </p>
                <motion.button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText('STJOHNS30')
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    } catch (err) {
                      console.error('Failed to copy:', err)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-body text-xs sm:text-sm text-white">
                    {copied ? 'Copied!' : 'Click to copy'}
                  </span>
                  {copied ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </motion.button>
              </div>
              
              {/* Order Now Button - Clover style effect */}
              <OrderNowButton href="https://localcook.shop/app/index.php" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
