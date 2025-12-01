import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useEffect } from 'react'

/**
 * AppPromo Section - Premium Edition v4
 * 
 * Redesigned to match the premium feel of FeaturedChefs section:
 * - Consistent typography: font-heading, font-display, font-mono, font-body
 * - Premium card styling with proper rounded corners and padding
 * - Stripe official brand color (#635BFF / Blurple) for Secure Checkout
 * - Clover-style Order Now button (same as DiscountPopup)
 * - Premium bento-style grid layout
 */

// Stripe official brand color
const STRIPE_BLURPLE = '#635BFF'

// Clover-style Order Now button component - matches DiscountPopup exactly
function OrderNowButton({ href }: { href: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const textWidth = 100 // Width for "Order Now" text
  
  return (
    <motion.a
      href={href}
      className="clover-link-btn inline-flex items-center cursor-pointer bg-white rounded-full shadow-xl hover:shadow-2xl transition-shadow duration-300 px-5 py-3.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minWidth: `${textWidth + 60}px` }}
    >
      <div className="relative flex items-center h-10" style={{ width: `${textWidth + 60}px` }}>
        {/* Delivery icon container - animates from left to right */}
        <motion.div 
          className="absolute flex-shrink-0 z-10 flex items-center gap-2"
          animate={{ 
            x: isHovered ? textWidth + 12 : 0
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {/* Delivery icon with elegant scale + glow effect */}
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="flex-shrink-0"
            animate={{ 
              scale: isHovered ? 1.15 : 1,
              filter: isHovered ? 'drop-shadow(0 0 10px rgba(245, 16, 66, 0.6))' : 'drop-shadow(0 0 0px rgba(245, 16, 66, 0))'
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1]
            }}
          >
            <path
              d="M16.4 17.6C16.4 19.4778 17.8775 21 19.7 21C21.5225 21 23 19.4778 23 17.6C23 15.7222 21.5225 14.2 19.7 14.2C17.8775 14.2 16.4 15.7222 16.4 17.6ZM16.4 17.6L10.9 17.5997M10.9 17.5997V15.7452C10.9 13.4136 10.9 12.249 10.2554 11.5245C9.6108 10.8 8.5746 10.8 6.5 10.8H5.84C5.4319 10.8 5.2273 10.8 5.0546 10.8148C4.01011 10.9072 3.02922 11.4154 2.28838 12.248C1.54754 13.0807 1.09536 14.1831 1.0132 15.357C1 15.5511 1 15.7823 1 16.2398C1 16.3547 1 16.4128 1.0033 16.4598C1.02373 16.7535 1.1368 17.0293 1.32214 17.2376C1.50747 17.4459 1.75289 17.573 2.0142 17.596C2.07942 17.5994 2.14471 17.6006 2.21 17.5997H10.9ZM4.3 7.39972H9.8M2.1 4H7.6M12 4H12.5421C13.7772 4 14.3942 4 14.8901 4.38122C15.387 4.76117 15.6631 5.44713 16.2145 6.81903L19.1867 14.2M18.3068 11.65L19.006 11.01C19.276 10.7626 19.4115 10.6402 19.5049 10.4783C19.5689 10.3689 19.6185 10.2475 19.6517 10.1187C19.7 9.92875 19.7 9.72093 19.7 9.30528C19.7 8.51733 19.7 8.12462 19.5645 7.8301C19.4735 7.6325 19.3417 7.46873 19.1826 7.3558C18.9464 7.1875 18.6282 7.1875 17.9947 7.1875H16.62M9.25 17.6C9.25 18.5017 8.90232 19.3665 8.28345 20.0042C7.66458 20.6418 6.82521 21 5.95 21C5.07479 21 4.23542 20.6418 3.61655 20.0042C2.99768 19.3665 2.65 18.5017 2.65 17.6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-[var(--color-primary)]"
            />
          </motion.svg>
          
          {/* Arrow appears to the RIGHT of the icon */}
          <motion.div 
            className="flex items-center justify-center"
            animate={{ 
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : -10
            }}
            transition={{ 
              duration: 0.3, 
              delay: isHovered ? 0.2 : 0,
              ease: [0.25, 0.1, 0.25, 1]
            }}
          >
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-md">
              <svg 
                className="w-4 h-4 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Text - animates from right to left, becomes bold */}
        <motion.span
          className="absolute text-base sm:text-lg text-[var(--color-primary)] whitespace-nowrap font-body"
          animate={{ 
            x: isHovered ? 0 : 48,
            fontWeight: isHovered ? 700 : 500
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          Order Now
        </motion.span>
      </div>
    </motion.a>
  )
}


export default function AppPromo() {
  const sectionRef = useRef(null)
  const mobileCardsRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile viewport for conditional rendering
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // Below sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const phoneY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2])
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [30, -30])
  const rotate = useTransform(scrollYProgress, [0, 1], [-3, 3])

  useEffect(() => {
    if (!isInView) return

    const ctx = gsap.context(() => {
      gsap.fromTo('.app-phone-mockup',
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
      )

      gsap.fromTo('.app-feature-card',
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12, delay: 0.3, ease: 'power3.out' }
      )

      gsap.fromTo('.app-floating-card',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.15, delay: 0.7, ease: 'back.out(1.2)' }
      )

      // Premium mobile card animations (like HowItWorks) - only on mobile
      if (isMobile && mobileCardsRef.current) {
        gsap.fromTo('.mobile-app-card',
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
            delay: 0.3,
            ease: 'power3.out',
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [isInView, isMobile])

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary-dark)] overflow-hidden"
    >
      {/* Premium Background - Matching FeaturedChefs style */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute top-[20%] -right-40 w-[800px] h-[800px] rounded-full bg-white/5 blur-[100px]"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--color-primary-dark)]/30 blur-[80px]"
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Main Content - properly contained */}
      <div className="relative max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 w-full box-border overflow-x-clip">
        {/* Header Section - Matching FeaturedChefs typography exactly */}
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-10 md:pt-24 md:pb-12">
          <div className="grid lg:grid-cols-12 gap-6 items-end">
            {/* Left side - Main headline */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 sm:mb-8"
              >
                <div className="inline-block relative pb-2 sm:pb-3">
                  <span className="font-display text-[clamp(1.5rem,4vw,2.5rem)] sm:text-[clamp(1.75rem,4.5vw,3rem)] text-white leading-tight tracking-tight">
                    Local Cooks{' '}
                    <span className="font-heading text-[clamp(1.5rem,4vw,2.5rem)] sm:text-[clamp(1.75rem,4.5vw,3rem)] text-white/90">
                      for Foodies
                    </span>
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] sm:h-[2px] bg-gradient-to-r from-transparent via-white/50 via-white/70 via-white/50 to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <span className="inline-block font-mono text-xs text-white/60 uppercase tracking-[0.3em]">
                  Fresh • Local • Authentic
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading text-[clamp(2rem,6vw,5.5rem)] sm:text-[clamp(2.5rem,7vw,5.5rem)] text-white leading-[0.85] tracking-tight"
              >
                Order <span className="font-display text-white/90">Anytime,</span>
                <br />
                <span className="font-display text-[var(--color-butter)] italic">Anywhere</span>
              </motion.h2>
            </div>

            {/* Right side - Subtext */}
            <div className="lg:col-span-5 lg:pb-2">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-body text-base sm:text-lg md:text-xl text-white/70 leading-relaxed max-w-md"
              >
                Fresh homemade meals from passionate local chefs, just a tap away. 
                Start exploring flavors from around the world.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Bento Grid Section - MOBILE: 2-column grid with phone, DESKTOP: Bento grid */}
        <div className="pb-16 sm:pb-24 md:pb-32 w-full max-w-full overflow-visible">
          <div className="grid grid-cols-12 gap-1 sm:gap-2 md:gap-4 lg:gap-6 w-full max-w-full overflow-visible">
            
            {/* MOBILE VIEW: 2-column grid layout (like HowItWorks) with phone mockup */}
            {isMobile && (
              <>
                {/* Left Column - Feature Cards in 2-column grid */}
                <div ref={mobileCardsRef} className="col-span-12 order-2">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    
                    {/* Browse Local Menus - Large Card (spans 2 columns) */}
                    <div className="mobile-app-card app-feature-card col-span-2 group will-change-transform">
                      <div className="relative h-full bg-white rounded-xl p-4 overflow-hidden min-h-[140px]">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-cream)] to-transparent opacity-50" />
                        <motion.div
                          style={{ rotate }}
                          className="absolute top-3 right-3 text-3xl opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                        >
                          🍽️
                        </motion.div>
                        
                        <div className="relative flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-lg">🔍</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary)]/10 rounded-full mb-2">
                              <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
                              <span className="font-mono text-[9px] text-[var(--color-primary)] uppercase tracking-wider">For Foodies</span>
                            </span>
                            <h4 className="font-heading text-base text-[var(--color-charcoal)] mb-1 leading-tight">
                              Browse Local Menus
                            </h4>
                            <p className="font-body text-xs text-[var(--color-charcoal)]/70 leading-relaxed">
                              Discover authentic cuisines from chefs in your neighborhood.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Tracking Card */}
                    <div className="mobile-app-card app-feature-card col-span-1 group will-change-transform" style={{ perspective: '1000px' }}>
                      <div className="relative h-full bg-[var(--color-charcoal)] rounded-xl p-3 overflow-hidden min-h-[110px]" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5" />
                        <motion.div
                          style={{ rotate }}
                          className="absolute -bottom-1 -right-1 text-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                        >
                          📍
                        </motion.div>
                        
                        <div className="relative h-full flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[8px] text-white/40 uppercase tracking-wider">Real-time</span>
                            <h4 className="font-heading text-sm text-white mt-0.5 leading-tight">
                              Live Tracking
                            </h4>
                          </div>
                          <p className="font-body text-[10px] text-white/50 mt-1 leading-relaxed">
                            Watch your order from kitchen to doorstep.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Secure Checkout - Stripe Card */}
                    <div className="mobile-app-card app-feature-card col-span-1 group will-change-transform" style={{ perspective: '1000px' }}>
                      <div 
                        className="relative h-full rounded-xl p-3 overflow-hidden min-h-[110px]"
                        style={{ backgroundColor: STRIPE_BLURPLE, transformStyle: 'preserve-3d', willChange: 'transform' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                        <motion.div
                          style={{ rotate }}
                          className="absolute -bottom-1 -right-1 text-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                        >
                          💳
                        </motion.div>
                        
                        <div className="relative h-full flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[8px] text-white/60 uppercase tracking-wider">Secure</span>
                            <h4 className="font-heading text-sm text-white mt-0.5 leading-tight">
                              Secure Checkout
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <img 
                              src="/Stripe_wordmark_-_slate.svg" 
                              alt="Stripe" 
                              className="h-3"
                              style={{ filter: 'brightness(0) invert(1)' }}
                            />
                            <p className="font-mono text-[10px] text-white/60 whitespace-nowrap">Powered by Stripe</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rate & Review Card */}
                    <div className="mobile-app-card app-feature-card col-span-1 group will-change-transform" style={{ perspective: '1000px' }}>
                      <div className="relative h-full bg-[var(--color-gold)] rounded-xl p-3 overflow-hidden min-h-[110px]" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
                        <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
                        <motion.div
                          style={{ rotate }}
                          className="absolute -bottom-1 -right-1 text-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                        >
                          ⭐
                        </motion.div>
                        
                        <div className="relative h-full flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[8px] text-[var(--color-charcoal)]/50 uppercase tracking-wider">Community</span>
                            <h4 className="font-heading text-sm text-[var(--color-charcoal)] mt-0.5 leading-tight">
                              Rate & Review
                            </h4>
                          </div>
                          <p className="font-body text-[10px] text-[var(--color-charcoal)]/60 mt-1 leading-relaxed">
                            Share your experience and help others.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Food Safety Card */}
                    <div className="mobile-app-card app-feature-card col-span-1 group will-change-transform" style={{ perspective: '1000px' }}>
                      <div className="relative h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 overflow-hidden min-h-[110px]" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
                        <motion.div
                          style={{ rotate }}
                          className="absolute -bottom-1 -right-1 text-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                        >
                          🛡️
                        </motion.div>
                        
                        <div className="relative h-full flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[8px] text-white/50 uppercase tracking-wider">Verified</span>
                            <h4 className="font-heading text-sm text-white mt-0.5 leading-tight">
                              Food Safety
                            </h4>
                          </div>
                          <p className="font-body text-[10px] text-white/50 mt-1 leading-relaxed">
                            All chefs are certified and follow strict standards.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CTA Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="col-span-2 flex flex-col items-center gap-2.5 pt-2"
                    >
                      <a 
                        href="https://localcook.shop/app/index.php"
                        className="bg-white text-[var(--color-primary)] px-5 py-2.5 rounded-full text-sm font-bold shadow-xl hover:shadow-2xl transition-shadow duration-300"
                      >
                        Order Now
                      </a>
                      
                      {/* Native Apps Coming Soon */}
                      <div className="flex items-center gap-2 text-white/50">
                        <div className="flex items-center gap-1">
                          {/* Apple Logo */}
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          {/* Android Logo */}
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.523 15.341c-.576 0-1.044-.467-1.044-1.043 0-.576.468-1.043 1.044-1.043.576 0 1.043.467 1.043 1.043 0 .576-.467 1.043-1.043 1.043m-11.046 0c-.576 0-1.043-.467-1.043-1.043 0-.576.467-1.043 1.043-1.043.576 0 1.044.467 1.044 1.043 0 .576-.468 1.043-1.044 1.043m11.405-6.02l1.997-3.46a.416.416 0 00-.152-.566.416.416 0 00-.566.152l-2.022 3.504C15.555 8.062 13.847 7.576 12 7.576c-1.847 0-3.555.486-5.139 1.375L4.839 5.447a.416.416 0 00-.566-.152.416.416 0 00-.152.566l1.997 3.46C2.688 11.197.343 14.795.343 18.946h23.314c0-4.15-2.345-7.749-5.775-9.625"/>
                          </svg>
                        </div>
                        <span className="font-mono text-[10px]">Native apps soon</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Right Column - Phone Mockup - Visible on mobile */}
                <div className="col-span-12 order-1 flex justify-center overflow-visible mb-4">
                  <motion.div
                    style={{ y: phoneY, rotateY: phoneRotate, perspective: 1000 }}
                    className="app-phone-mockup relative overflow-visible"
                  >
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-[var(--color-butter)]/15 rounded-[30px] blur-2xl scale-90 opacity-50" />
                    
                    {/* Phone Frame */}
                    <div className="relative">
                      <div className="relative w-[140px] bg-[#1a1a1a] rounded-[24px] p-[6px] shadow-xl shadow-black/40">
                        <div className="relative bg-[#0a0a0a] rounded-[20px] overflow-hidden">
                          {/* Dynamic Island */}
                          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20">
                            <div className="w-[50px] h-[16px] bg-black rounded-full flex items-center justify-center gap-1">
                              <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full" />
                              <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full ring-1 ring-[#333]" />
                            </div>
                          </div>
                          
                          {/* Screen */}
                          <div className="relative aspect-[390/844] overflow-hidden">
                            <img 
                              src="/sc_lcapp.png" 
                              alt="LocalCooks App" 
                              className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Floating Card - Order Status */}
                      <motion.div 
                        className="app-floating-card absolute -right-2 top-[12%]"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-white/95 backdrop-blur-xl rounded-lg px-2 py-1.5 shadow-lg shadow-black/15 border border-white/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-sage)]/80 rounded-lg flex items-center justify-center text-xs shadow-sm">
                              🚗
                            </div>
                            <div>
                              <p className="font-heading text-[9px] text-[var(--color-charcoal)] leading-tight">On the way!</p>
                              <p className="font-mono text-[7px] text-[var(--color-charcoal-light)]">ETA: 12 mins</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Floating Card - Support Local */}
                      <motion.div 
                        className="app-floating-card absolute -left-2 top-[28%]"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-white/95 backdrop-blur-xl rounded-lg px-2 py-1.5 shadow-lg shadow-black/15 border border-white/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-white text-xs">👨‍🍳</span>
                            </div>
                            <div>
                              <p className="font-heading text-[9px] text-[var(--color-charcoal)] leading-tight">Support</p>
                              <p className="font-heading text-[9px] text-[var(--color-primary)] leading-tight">Local Chefs</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Floating Card - Rating */}
                      <motion.div 
                        className="app-floating-card absolute -right-2 bottom-[18%]"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-gradient-to-br from-[var(--color-butter)] to-[var(--color-gold)]/90 backdrop-blur-xl rounded-lg px-2 py-1.5 shadow-lg shadow-[var(--color-gold)]/25 border border-[var(--color-gold)]/30">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 bg-white/40 rounded-lg flex items-center justify-center">
                              <span className="text-xs">⭐</span>
                            </div>
                            <div>
                              <p className="font-heading text-base text-[var(--color-charcoal)] leading-none">5.0</p>
                              <p className="font-mono text-[7px] text-[var(--color-charcoal)]/60">Rating</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
            
            {/* DESKTOP/TABLET VIEW: Original bento grid layout */}
            {!isMobile && (
            <>
            {/* Left Column - Feature Cards */}
            <div className="col-span-7 sm:col-span-6 order-2 lg:order-1">
              {/* Preserve 2-column grid layout on all screens */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                
                {/* Browse Local Menus - Large Card */}
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="app-feature-card col-span-2 group will-change-transform"
                >
                  <div className="relative h-full bg-white rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden min-h-[60px] sm:min-h-[100px] md:min-h-[140px] lg:min-h-[180px]">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-cream)] to-transparent opacity-50" />
                    <motion.div
                      style={{ rotate }}
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 text-2xl sm:text-4xl md:text-6xl lg:text-7xl opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                    >
                      🍽️
                    </motion.div>
                    
                    <div className="relative flex items-start gap-2 sm:gap-3 md:gap-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-sm sm:text-lg md:text-2xl lg:text-3xl">🔍</span>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 sm:gap-2 px-1.5 py-0.5 sm:px-3 sm:py-1 bg-[var(--color-primary)]/10 rounded-full mb-1 sm:mb-2 md:mb-3">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
                          <span className="font-mono text-[5px] sm:text-[8px] md:text-[10px] text-[var(--color-primary)] uppercase tracking-wider">For Foodies</span>
                        </span>
                        <h4 className="font-heading text-[10px] sm:text-sm md:text-xl lg:text-2xl text-[var(--color-charcoal)] mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                          Browse Local Menus
                        </h4>
                        <p className="font-body text-[5px] sm:text-[9px] md:text-xs lg:text-sm text-[var(--color-charcoal)]/70 leading-tight sm:leading-snug">
                          Discover authentic cuisines from chefs in your neighborhood.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Live Tracking Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="app-feature-card col-span-1 group will-change-transform"
                >
                  <div className="relative h-full bg-[var(--color-charcoal)] rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] p-2 sm:p-3 md:p-5 lg:p-6 overflow-hidden min-h-[55px] sm:min-h-[90px] md:min-h-[140px] lg:min-h-[180px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5" />
                    <motion.div
                      style={{ rotate }}
                      className="absolute -bottom-1 -right-1 text-xl sm:text-3xl md:text-4xl lg:text-5xl opacity-20 group-hover:opacity-30 transition-opacity"
                    >
                      📍
                    </motion.div>
                    
                    <div className="relative h-full flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[6px] sm:text-[8px] md:text-[10px] text-white/40 uppercase tracking-wider">Real-time</span>
                        <h4 className="font-heading text-[9px] sm:text-xs md:text-lg lg:text-2xl text-white mt-0.5 sm:mt-1 md:mt-2 leading-tight">
                          Live Tracking
                        </h4>
                      </div>
                      <p className="font-body text-[5px] sm:text-[8px] md:text-xs lg:text-sm text-white/50 mt-1 sm:mt-2 md:mt-3">
                        Watch your order from kitchen to doorstep.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Secure Checkout - Stripe Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="app-feature-card col-span-1 group will-change-transform"
                >
                  <div 
                    className="relative h-full rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] p-2 sm:p-3 md:p-5 lg:p-6 overflow-hidden min-h-[55px] sm:min-h-[90px] md:min-h-[140px] lg:min-h-[180px]"
                    style={{ backgroundColor: STRIPE_BLURPLE }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                    <motion.div
                      style={{ rotate }}
                      className="absolute -bottom-1 -right-1 text-xl sm:text-3xl md:text-4xl lg:text-5xl opacity-20 group-hover:opacity-30 transition-opacity"
                    >
                      💳
                    </motion.div>
                    
                    <div className="relative h-full flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[6px] sm:text-[8px] md:text-[10px] text-white/60 uppercase tracking-wider">Secure</span>
                        <h4 className="font-heading text-[9px] sm:text-xs md:text-lg lg:text-2xl text-white mt-0.5 sm:mt-1 md:mt-2 leading-tight">
                          Secure Checkout
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 mt-1 sm:mt-2 md:mt-3">
                        {/* Official Stripe Wordmark - inverted to white */}
                        <img 
                          src="/Stripe_wordmark_-_slate.svg" 
                          alt="Stripe" 
                          className="h-2 sm:h-3 md:h-5 lg:h-6"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                        <p className="font-mono text-[4px] sm:text-[7px] md:text-[10px] lg:text-xs text-white/60">Powered by Stripe</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Rate & Review Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="app-feature-card col-span-1 group will-change-transform"
                >
                  <div className="relative h-full bg-[var(--color-gold)] rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] p-2 sm:p-3 md:p-5 lg:p-6 overflow-hidden min-h-[55px] sm:min-h-[90px] md:min-h-[140px] lg:min-h-[180px]">
                    <div className="absolute -top-3 -right-3 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-white/20 rounded-full blur-2xl" />
                    <motion.div
                      style={{ rotate }}
                      className="absolute -bottom-1 -right-1 text-xl sm:text-3xl md:text-4xl lg:text-5xl opacity-20 group-hover:opacity-30 transition-opacity"
                    >
                      ⭐
                    </motion.div>
                    
                    <div className="relative h-full flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[6px] sm:text-[8px] md:text-[10px] text-[var(--color-charcoal)]/50 uppercase tracking-wider">Community</span>
                        <h4 className="font-heading text-[9px] sm:text-xs md:text-lg lg:text-2xl text-[var(--color-charcoal)] mt-0.5 sm:mt-1 md:mt-2 leading-tight">
                          Rate & Review
                        </h4>
                      </div>
                      <p className="font-body text-[5px] sm:text-[8px] md:text-xs lg:text-sm text-[var(--color-charcoal)]/60 mt-1 sm:mt-2 md:mt-3">
                        Share your experience and help others.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Food Safety Card */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="app-feature-card col-span-1 group will-change-transform"
                >
                  <div className="relative h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] p-2 sm:p-3 md:p-5 lg:p-6 overflow-hidden min-h-[55px] sm:min-h-[90px] md:min-h-[140px] lg:min-h-[180px]">
                    <motion.div
                      style={{ rotate }}
                      className="absolute -bottom-1 -right-1 text-xl sm:text-3xl md:text-4xl lg:text-5xl opacity-20 group-hover:opacity-30 transition-opacity"
                    >
                      🛡️
                    </motion.div>
                    
                    <div className="relative h-full flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[6px] sm:text-[8px] md:text-[10px] text-white/50 uppercase tracking-wider">Verified</span>
                        <h4 className="font-heading text-[9px] sm:text-xs md:text-lg lg:text-2xl text-white mt-0.5 sm:mt-1 md:mt-2 leading-tight">
                          Food Safety
                        </h4>
                      </div>
                      <p className="font-body text-[5px] sm:text-[8px] md:text-xs lg:text-sm text-white/50 mt-1 sm:mt-2 md:mt-3">
                        All chefs are certified and follow strict standards.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="col-span-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 pt-2 sm:pt-4"
                >
                  <div className="hidden sm:block">
                    <OrderNowButton href="https://localcook.shop/app/index.php" />
                  </div>
                  {/* Simpler button for tiny screens */}
                  <a 
                    href="https://localcook.shop/app/index.php"
                    className="sm:hidden bg-white text-[var(--color-primary)] px-3 py-1.5 rounded-full text-[10px] font-bold"
                  >
                    Order Now
                  </a>
                  
                  {/* Native Apps Coming Soon - visible on all screens */}
                  <div className="flex items-center gap-1.5 sm:gap-3 text-white/50">
                    <div className="flex items-center gap-0.5 sm:gap-2">
                      {/* Apple Logo */}
                      <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      {/* Android Logo */}
                      <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.523 15.341c-.576 0-1.044-.467-1.044-1.043 0-.576.468-1.043 1.044-1.043.576 0 1.043.467 1.043 1.043 0 .576-.467 1.043-1.043 1.043m-11.046 0c-.576 0-1.043-.467-1.043-1.043 0-.576.467-1.043 1.043-1.043.576 0 1.044.467 1.044 1.043 0 .576-.468 1.043-1.044 1.043m11.405-6.02l1.997-3.46a.416.416 0 00-.152-.566.416.416 0 00-.566.152l-2.022 3.504C15.555 8.062 13.847 7.576 12 7.576c-1.847 0-3.555.486-5.139 1.375L4.839 5.447a.416.416 0 00-.566-.152.416.416 0 00-.152.566l1.997 3.46C2.688 11.197.343 14.795.343 18.946h23.314c0-4.15-2.345-7.749-5.775-9.625"/>
                      </svg>
                    </div>
                    <span className="font-mono text-[6px] sm:text-xs">Native apps soon</span>
                  </div>
                </motion.div>
              </div>
            </div>
            </>
            )}

            {/* Right Column - Phone Mockup - Only show on desktop/tablet */}
            {!isMobile && (
            <div className="col-span-5 sm:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end overflow-visible pr-4 sm:pr-6 md:pr-8">
              <motion.div
                style={{ y: phoneY, rotateY: phoneRotate, perspective: 1000 }}
                className="app-phone-mockup relative overflow-visible"
              >
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-[var(--color-butter)]/15 rounded-[30px] sm:rounded-[40px] md:rounded-[50px] blur-2xl sm:blur-3xl scale-90 opacity-50" />
                
                {/* Phone Frame - scales proportionally */}
                <div className="relative">
                  <div className="relative w-[100px] sm:w-[160px] md:w-[220px] lg:w-[280px] xl:w-[300px] bg-[#1a1a1a] rounded-[20px] sm:rounded-[30px] md:rounded-[40px] lg:rounded-[48px] p-[4px] sm:p-[6px] md:p-[8px] lg:p-[10px] shadow-xl sm:shadow-2xl shadow-black/40">
                    <div className="relative bg-[#0a0a0a] rounded-[16px] sm:rounded-[24px] md:rounded-[32px] lg:rounded-[38px] overflow-hidden">
                      {/* Dynamic Island - scales down */}
                      <div className="absolute top-1 sm:top-1.5 md:top-2.5 left-1/2 -translate-x-1/2 z-20">
                        <div className="w-[40px] sm:w-[55px] md:w-[70px] lg:w-[80px] h-[13px] sm:h-[18px] md:h-[22px] lg:h-[26px] bg-black rounded-full flex items-center justify-center gap-1 md:gap-2">
                          <div className="w-1 sm:w-1.5 md:w-2 h-1 sm:h-1.5 md:h-2 bg-[#1a1a1a] rounded-full" />
                          <div className="w-1 sm:w-1.5 md:w-2 lg:w-2.5 h-1 sm:h-1.5 md:h-2 lg:h-2.5 bg-[#1a1a1a] rounded-full ring-1 ring-[#333]" />
                        </div>
                      </div>
                      
                      {/* Screen */}
                      <div className="relative aspect-[390/844] overflow-hidden">
                        <img 
                          src="/sc_lcapp.png" 
                          alt="LocalCooks App" 
                          className="w-full h-full object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Side buttons - hidden on very small screens */}
                    <div className="absolute -left-[1px] sm:-left-[2px] top-[45px] sm:top-[70px] md:top-[90px] w-[2px] sm:w-[3px] h-[14px] sm:h-[20px] md:h-[28px] bg-[#2a2a2a] rounded-l-sm hidden sm:block" />
                    <div className="absolute -left-[1px] sm:-left-[2px] top-[65px] sm:top-[100px] md:top-[130px] w-[2px] sm:w-[3px] h-[25px] sm:h-[35px] md:h-[50px] bg-[#2a2a2a] rounded-l-sm hidden sm:block" />
                    <div className="absolute -left-[1px] sm:-left-[2px] top-[95px] sm:top-[145px] md:top-[190px] w-[2px] sm:w-[3px] h-[25px] sm:h-[35px] md:h-[50px] bg-[#2a2a2a] rounded-l-sm hidden sm:block" />
                    <div className="absolute -right-[1px] sm:-right-[2px] top-[65px] sm:top-[100px] md:top-[130px] w-[2px] sm:w-[3px] h-[35px] sm:h-[50px] md:h-[70px] bg-[#2a2a2a] rounded-r-sm hidden sm:block" />
                  </div>

                  {/* Floating Card - Order Status - visible on all screens with responsive sizing */}
                  {/* Mobile: top-[18%] to avoid phone notch/dynamic island, sm+ uses normal positioning */}
                  <motion.div 
                    className="app-floating-card absolute -right-2 sm:-right-4 lg:-right-4 xl:-right-8 top-[14%] sm:top-[10%]"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-white/95 backdrop-blur-xl rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 lg:py-3 shadow-md sm:shadow-lg md:shadow-xl shadow-black/15 border border-white/50">
                      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                        <div className="w-4 sm:w-6 md:w-8 lg:w-10 h-4 sm:h-6 md:h-8 lg:h-10 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-sage)]/80 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center text-[8px] sm:text-sm md:text-base lg:text-lg shadow-sm">
                          🚗
                        </div>
                        <div>
                          <p className="font-heading text-[7px] sm:text-[10px] md:text-xs lg:text-sm text-[var(--color-charcoal)] leading-tight">On the way!</p>
                          <p className="font-mono text-[5px] sm:text-[8px] md:text-[10px] lg:text-xs text-[var(--color-charcoal-light)]">ETA: 12 mins</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Card - Support Local - visible on all screens with responsive sizing */}
                  <motion.div 
                    className="app-floating-card absolute -left-2 sm:-left-4 lg:-left-4 xl:-left-8 top-[34%] sm:top-[28%]"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-white/95 backdrop-blur-xl rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 lg:py-3 shadow-md sm:shadow-lg md:shadow-xl shadow-black/15 border border-white/50">
                      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                        <div className="w-4 sm:w-6 md:w-8 lg:w-10 h-4 sm:h-6 md:h-8 lg:h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-white text-[8px] sm:text-sm md:text-base lg:text-lg">👨‍🍳</span>
                        </div>
                        <div>
                          <p className="font-heading text-[7px] sm:text-[10px] md:text-xs lg:text-sm text-[var(--color-charcoal)] leading-tight">Support</p>
                          <p className="font-heading text-[7px] sm:text-[10px] md:text-xs lg:text-sm text-[var(--color-primary)] leading-tight">Local Chefs</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating Card - Rating - visible on all screens with responsive sizing */}
                  <motion.div 
                    className="app-floating-card absolute -right-2 sm:-right-4 lg:-right-2 xl:-right-6 bottom-[18%] sm:bottom-[20%]"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-gradient-to-br from-[var(--color-butter)] to-[var(--color-gold)]/90 backdrop-blur-xl rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-1.5 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 lg:py-3 shadow-md sm:shadow-lg md:shadow-xl shadow-[var(--color-gold)]/25 border border-[var(--color-gold)]/30">
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5">
                        <div className="w-4 sm:w-5 md:w-7 lg:w-9 h-4 sm:h-5 md:h-7 lg:h-9 bg-white/40 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center">
                          <span className="text-[8px] sm:text-sm md:text-base lg:text-lg">⭐</span>
                        </div>
                        <div>
                          <p className="font-heading text-sm sm:text-lg md:text-xl lg:text-2xl text-[var(--color-charcoal)] leading-none">5.0</p>
                          <p className="font-mono text-[5px] sm:text-[7px] md:text-[8px] lg:text-[10px] text-[var(--color-charcoal)]/60">Rating</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
