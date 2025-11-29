import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useEffect } from 'react'

/**
 * AppPromo Section - Award-Winning Redesign v3
 * 
 * Improvements v3:
 * - Changed "Instant Access" to "Browse Local Menus" (no conflict with native apps)
 * - Stripe logo SVG for Secure Checkout
 * - Apple + Android logos for native apps coming soon
 * - Elegant glassmorphism floating cards (smaller, subtle, refined)
 */

export default function AppPromo() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const phoneY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const phoneRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2])
  const contentY = useTransform(scrollYProgress, [0, 1], [25, -25])

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
    }, sectionRef)

    return () => ctx.revert()
  }, [isInView])

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 lg:py-40 bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary-dark)] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-[350px] h-[350px] bg-[var(--color-coral)]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-center">
          
          {/* Left Column - Content */}
          <motion.div 
            style={{ y: contentY }}
            className="lg:col-span-6 order-2 lg:order-1"
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="font-heading text-[clamp(2rem,5vw,4rem)] sm:text-[clamp(2.5rem,5.5vw,4rem)] text-white leading-[0.95] tracking-tight mb-4 sm:mb-6"
            >
              Order Anytime,
              <br />
              <span className="font-display italic text-[var(--color-butter)]">Anywhere</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-body text-base sm:text-lg md:text-xl text-white/80 leading-relaxed mb-6 sm:mb-8 max-w-lg"
            >
              Fresh homemade meals from passionate local chefs, just a tap away. 
              Start exploring flavors from around the world.
            </motion.p>

            {/* Bento-Style Feature Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
              {/* Browse Local Menus - Changed from Instant Access */}
              <motion.div
                className="app-feature-card group col-span-2 relative bg-white rounded-xl sm:rounded-[1.5rem] p-4 sm:p-6 overflow-hidden"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-cream)] to-transparent opacity-50" />
                <div className="absolute -bottom-4 -right-4 text-7xl opacity-10 group-hover:opacity-20 transition-opacity">
                  🍽️
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-xl text-[var(--color-charcoal)] mb-1">Browse Local Menus</h4>
                    <p className="font-body text-sm text-[var(--color-charcoal)]/70">
                      Discover authentic cuisines from chefs in your neighborhood. Updated daily.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Live Tracking */}
              <motion.div
                className="app-feature-card group relative bg-[var(--color-charcoal)] rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 overflow-hidden"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5" />
                <div className="absolute -bottom-2 -right-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                  📍
                </div>
                <div className="relative">
                  <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-xl">📍</span>
                  </div>
                  <h4 className="font-body font-semibold text-white text-sm mb-1">Live Tracking</h4>
                  <p className="font-mono text-xs text-white/50">Kitchen to doorstep</p>
                </div>
              </motion.div>

              {/* Secure Checkout - With Stripe Logo */}
              <motion.div
                className="app-feature-card group relative bg-[var(--color-sage)] rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 overflow-hidden"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -bottom-2 -right-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                  💳
                </div>
                <div className="relative">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    {/* Stripe Logo SVG */}
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                    </svg>
                  </div>
                  <h4 className="font-body font-semibold text-white text-sm mb-1">Secure Checkout</h4>
                  <p className="font-mono text-xs text-white/60">Powered by Stripe</p>
                </div>
              </motion.div>

              {/* Rate & Review */}
              <motion.div
                className="app-feature-card group relative bg-[var(--color-gold)] rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 overflow-hidden"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -bottom-2 -right-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                  ⭐
                </div>
                <div className="relative">
                  <div className="w-11 h-11 bg-white/30 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-xl">⭐</span>
                  </div>
                  <h4 className="font-body font-semibold text-[var(--color-charcoal)] text-sm mb-1">Rate & Review</h4>
                  <p className="font-mono text-xs text-[var(--color-charcoal)]/60">Build community</p>
                </div>
              </motion.div>

              {/* Food Safety */}
              <motion.div
                className="app-feature-card group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-[1.5rem] p-4 sm:p-5 overflow-hidden"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute -bottom-2 -right-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                  ✓
                </div>
                <div className="relative">
                  <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <h4 className="font-body font-semibold text-white text-sm mb-1">Food Safety</h4>
                  <p className="font-mono text-xs text-white/50">Certified chefs</p>
                </div>
              </motion.div>
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-4"
            >
              <a
                href="https://localcook.shop/app/index.php"
                className="group inline-flex items-center justify-center gap-3 bg-white text-[var(--color-primary)] px-6 sm:px-10 py-4 sm:py-5 rounded-full font-body font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl"
              >
                <span>Order Now</span>
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              
              {/* Native Apps Coming Soon - Apple + Android Logos */}
              <div className="flex items-center gap-3 text-white/60">
                <div className="flex items-center gap-2">
                  {/* Apple Logo */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  {/* Android Logo */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.523 15.341c-.576 0-1.044-.467-1.044-1.043 0-.576.468-1.043 1.044-1.043.576 0 1.043.467 1.043 1.043 0 .576-.467 1.043-1.043 1.043m-11.046 0c-.576 0-1.043-.467-1.043-1.043 0-.576.467-1.043 1.043-1.043.576 0 1.044.467 1.044 1.043 0 .576-.468 1.043-1.044 1.043m11.405-6.02l1.997-3.46a.416.416 0 00-.152-.566.416.416 0 00-.566.152l-2.022 3.504C15.555 8.062 13.847 7.576 12 7.576c-1.847 0-3.555.486-5.139 1.375L4.839 5.447a.416.416 0 00-.566-.152.416.416 0 00-.152.566l1.997 3.46C2.688 11.197.343 14.795.343 18.946h23.314c0-4.15-2.345-7.749-5.775-9.625"/>
                  </svg>
                </div>
                <span className="font-mono text-xs">Native apps launching soon</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Phone Mockup */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end pr-0 md:pr-6 lg:pr-10">
            <motion.div
              style={{ y: phoneY, rotateY: phoneRotate, perspective: 1000 }}
              className="app-phone-mockup relative"
            >
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-[var(--color-butter)]/15 rounded-[50px] blur-3xl scale-90 opacity-50" />
              
              {/* Phone Frame - Smaller */}
              <div className="relative">
                <div className="relative w-[180px] sm:w-[220px] md:w-[240px] lg:w-[260px] bg-[#1a1a1a] rounded-[36px] sm:rounded-[42px] p-[7px] sm:p-[9px] shadow-2xl shadow-black/30">
                  <div className="relative bg-[#0a0a0a] rounded-[28px] sm:rounded-[34px] overflow-hidden">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                      <div className="w-[70px] h-[22px] bg-black rounded-full flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full" />
                        <div className="w-2 h-2 bg-[#1a1a1a] rounded-full ring-1 ring-[#333]" />
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
                  
                  {/* Side buttons */}
                  <div className="absolute -left-[2px] top-[80px] w-[2px] h-[24px] bg-[#2a2a2a] rounded-l-sm" />
                  <div className="absolute -left-[2px] top-[115px] w-[2px] h-[45px] bg-[#2a2a2a] rounded-l-sm" />
                  <div className="absolute -left-[2px] top-[170px] w-[2px] h-[45px] bg-[#2a2a2a] rounded-l-sm" />
                  <div className="absolute -right-[2px] top-[115px] w-[2px] h-[60px] bg-[#2a2a2a] rounded-r-sm" />
                </div>

                {/* Floating Card - Order Status (Glassmorphism, smaller, elegant) */}
                <motion.div 
                  className="app-floating-card absolute -right-2 sm:-right-3 md:-right-6 lg:-right-10 top-[8%] hidden sm:block"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white/95 backdrop-blur-xl rounded-xl px-3 py-2.5 shadow-lg shadow-black/10 border border-white/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-sage)]/80 rounded-lg flex items-center justify-center text-sm shadow-sm">
                        🚗
                      </div>
                      <div>
                        <p className="font-body text-xs text-[var(--color-charcoal)] font-semibold leading-tight">On the way!</p>
                        <p className="font-mono text-[10px] text-[var(--color-charcoal-light)]">ETA: 12 mins</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card - Support Local (Glassmorphism, smaller, elegant) */}
                <motion.div 
                  className="app-floating-card absolute -left-2 sm:-left-3 md:-left-6 lg:-left-10 top-[25%] hidden sm:block"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white/95 backdrop-blur-xl rounded-xl px-3 py-2.5 shadow-lg shadow-black/10 border border-white/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-coral)] rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm">👨‍🍳</span>
                      </div>
                      <div>
                        <p className="font-body text-xs text-[var(--color-charcoal)] font-semibold leading-tight">Support</p>
                        <p className="font-body text-xs text-[var(--color-primary)] font-semibold leading-tight">Local Chefs</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Card - Rating (Glassmorphism, gold accent, elegant) */}
                <motion.div 
                  className="app-floating-card absolute -right-2 sm:-right-5 md:-right-8 bottom-[22%] hidden sm:block"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-gradient-to-br from-[var(--color-butter)] to-[var(--color-gold)]/90 backdrop-blur-xl rounded-xl px-3 py-2.5 shadow-lg shadow-[var(--color-gold)]/20 border border-[var(--color-gold)]/30">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/40 rounded-lg flex items-center justify-center">
                        <span className="text-sm">⭐</span>
                      </div>
                      <div>
                        <p className="font-heading text-lg text-[var(--color-charcoal)] leading-none">5.0</p>
                        <p className="font-mono text-[10px] text-[var(--color-charcoal)]/70">Rating</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  )
}
