import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { useRef, useState } from 'react'

/**
 * Newsletter Section - Premium Split-Section Design
 * 
 * Positioned to overlap between the AppPromo (brand color) section
 * and the Footer (white) section, creating a sophisticated bridging effect.
 * 
 * Design Features:
 * - Premium glassmorphism card floating between sections
 * - Elegant typography matching brand standards
 * - Animated input with clover-style button
 * - Subtle parallax and scroll-triggered animations
 */

export default function NewsletterSection() {
  const sectionRef = useRef(null)
  const cardRef = useRef(null)
  const isInView = useInView(cardRef, { once: true, margin: '-100px' })
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Subtle parallax for the card
  const cardY = useTransform(scrollYProgress, [0, 1], [40, -40])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isSubmitting) return

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSuccess(true)
    setEmail('')
    
    // Reset success state after 4 seconds
    setTimeout(() => setIsSuccess(false), 4000)
  }

  return (
    <section 
      ref={sectionRef}
      className="relative z-20"
      style={{ 
        marginTop: 0,
        paddingTop: 0,
        borderTop: 'none',
        outline: 'none'
      }}
    >
      {/* Top half background - matches BlogInsightsSection's primary-dark, extends upward to overlap seamlessly */}
      <div 
        className="absolute left-0 right-0" 
        style={{ 
          top: '-21px', // Slight overlap to prevent any gap
          height: 'calc(50% + 21px)',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          zIndex: 0,
          margin: 0,
          padding: 0,
          backgroundColor: 'var(--color-primary-dark)',
          background: 'var(--color-primary-dark)',
          transform: 'translateZ(0)', // Force GPU rendering
          backfaceVisibility: 'hidden',
          willChange: 'auto' // Prevent separation on scroll
        }}
      />
      
      {/* Bottom half background - matches Footer's white */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" style={{ zIndex: 0 }} />

      {/* Content Container - properly contained */}
      <div className="relative max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 w-full box-border overflow-x-clip">
        <motion.div
          ref={cardRef}
          style={{ y: cardY }}
          className="py-12 sm:py-16 md:py-20"
        >
          {/* Main Card - Premium Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/15 border border-white/50"
          >
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-coral)]/5 to-transparent rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-gradient-to-tr from-[var(--color-butter)]/20 to-transparent rounded-full blur-3xl" />
              
              {/* Subtle dot pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-charcoal) 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Floating food emojis - subtle decorations */}
              <motion.div
                className="absolute top-8 right-12 text-5xl sm:text-6xl opacity-10 select-none"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 3, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ✉️
              </motion.div>
              <motion.div
                className="absolute bottom-12 left-12 text-4xl sm:text-5xl opacity-10 select-none"
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
                🍴
              </motion.div>
            </div>

            {/* Content Grid */}
            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-10 md:p-14 lg:p-16">
              
              {/* Left Column - Copy */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-4"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 rounded-full">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                    <span className="font-mono text-[10px] text-[var(--color-primary)] uppercase tracking-[0.2em]">
                      Stay Updated
                    </span>
                  </span>
                </motion.div>

                {/* Headline - Each line always on single line */}
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="font-heading text-[var(--color-charcoal)] leading-[1.1] tracking-tight mb-4"
                >
                  <span 
                    className="block whitespace-nowrap"
                    style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}
                  >
                    Get <span className="font-display text-[var(--color-primary)]">Fresh</span> Updates
                  </span>
                  <span 
                    className="block whitespace-nowrap text-[var(--color-charcoal)]/70"
                    style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)' }}
                  >
                    Straight to Your Inbox
                  </span>
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="font-body text-base sm:text-lg text-[var(--color-charcoal)]/60 leading-relaxed mb-6"
                >
                  Be the first to know about new chefs, exclusive deals, and authentic recipes from your neighborhood.
                </motion.p>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2 text-[var(--color-charcoal)]/50">
                    <svg className="w-4 h-4 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-mono text-xs">No spam, ever</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-charcoal)]/50">
                    <svg className="w-4 h-4 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-mono text-xs">Unsubscribe anytime</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-7 flex items-center">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full"
                >
                  {/* Form Card */}
                  <div className="relative bg-[var(--color-cream)]/50 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-10 border border-[var(--color-charcoal)]/5">
                    {/* Success State */}
                    {isSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="w-16 h-16 mx-auto mb-4 bg-[var(--color-sage)]/20 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-8 h-8 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                        <h3 className="font-heading text-2xl text-[var(--color-charcoal)] mb-2">
                          You're In!
                        </h3>
                        <p className="font-body text-[var(--color-charcoal)]/60">
                          Thanks for subscribing. Check your inbox for a welcome surprise! 🎉
                        </p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="relative">
                          <label 
                            htmlFor="newsletter-email" 
                            className="block font-mono text-[10px] text-[var(--color-charcoal)]/50 uppercase tracking-[0.2em] mb-3"
                          >
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              id="newsletter-email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                              className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/15 focus:border-[var(--color-primary)] px-0 py-3 font-body text-lg text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/30 outline-none transition-colors duration-300"
                            />
                            {/* Animated underline */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-primary)]"
                              initial={{ width: '0%' }}
                              whileFocus={{ width: '100%' }}
                              animate={{ width: email ? '100%' : '0%' }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        {/* Submit Button - Clover Style */}
                        <div className="pt-2">
                          <motion.button
                            type="submit"
                            disabled={isSubmitting || !email}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="clover-btn group relative w-full sm:w-auto inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-charcoal)]/20 rounded-full px-6 sm:px-8 py-4 transition-all duration-300 disabled:cursor-not-allowed"
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            style={{ minWidth: '220px' }}
                          >
                            {/* Button Content Container - sized to fit text + icon + arrow */}
                            <div className="relative flex items-center h-6" style={{ width: '180px' }}>
                              {isSubmitting ? (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex items-center gap-3 w-full justify-center"
                                >
                                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  <span className="font-body font-semibold text-white">Subscribing...</span>
                                </motion.div>
                              ) : (
                                <>
                                  {/* Icon - animates from left to right */}
                                  <motion.div 
                                    className="absolute flex-shrink-0 z-10 flex items-center gap-2"
                                    animate={{ 
                                      x: isHovered ? 128 : 0
                                    }}
                                    transition={{ 
                                      duration: 0.6,
                                      ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                  >
                                    <motion.svg
                                      className="w-5 h-5 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      animate={{ 
                                        scale: isHovered ? 1.15 : 1,
                                        filter: isHovered ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' : 'drop-shadow(0 0 0px rgba(255, 255, 255, 0))'
                                      }}
                                      transition={{ 
                                        duration: 0.4,
                                        ease: [0.34, 1.56, 0.64, 1]
                                      }}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </motion.svg>
                                    
                                    {/* Arrow appears on hover */}
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
                                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                        <svg 
                                          className="w-3 h-3 text-[var(--color-primary)]" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                  
                                  {/* Text - animates from right to left, becomes bold on hover */}
                                  <motion.span
                                    className="absolute font-body text-white whitespace-nowrap"
                                    animate={{ 
                                      x: isHovered ? 0 : 30,
                                      fontWeight: isHovered ? 700 : 400
                                    }}
                                    transition={{ 
                                      duration: 0.6,
                                      ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                  >
                                    Subscribe Now
                                  </motion.span>
                                </>
                              )}
                            </div>
                          </motion.button>
                        </div>

                        {/* Privacy note */}
                        <p className="font-mono text-[10px] text-[var(--color-charcoal)]/40 pt-2">
                          By subscribing, you agree to our{' '}
                          <a href="#privacy" className="text-[var(--color-primary)] hover:underline">Privacy Policy</a>
                          {' '}and consent to receive updates.
                        </p>
                      </form>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

