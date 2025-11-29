import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { useRef, useState } from 'react'

// Clover-style button component inspired by les-arbres-fruitiers.fr "Pour les curieux" button
// When hovered: logo moves from left to right of text, and text becomes bold
function CloverButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false)
  const textWidth = 240 // Approximate width of text "Explore Local Cooks for Chefs"
  
  return (
    <motion.a
      href={href}
      className="clover-link-btn inline-flex items-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minWidth: `${textWidth + 120}px` }}
    >
      {/* Container with relative positioning */}
      <div className="relative flex items-center h-12" style={{ width: `${textWidth + 100}px` }}>
        {/* Logo container - animates from left to right */}
        <motion.div 
          className="absolute flex-shrink-0 z-10 flex items-center gap-2"
          animate={{ 
            x: isHovered ? textWidth + 16 : 0
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {/* LocalCooks Logo with elegant scale + glow effect */}
          <motion.div 
            className="w-12 h-12 relative"
            animate={{ 
              scale: isHovered ? 1.15 : 1,
              filter: isHovered ? 'drop-shadow(0 0 8px rgba(233, 68, 99, 0.5))' : 'drop-shadow(0 0 0px rgba(233, 68, 99, 0))'
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1] // Subtle spring/bounce
            }}
          >
            <img 
              src="/logo-lc.png" 
              alt="" 
              className="w-full h-full object-contain"
            />
          </motion.div>
          
          {/* Arrow appears to the RIGHT of the logo (not overlapping) */}
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
          className="absolute text-lg text-[var(--color-primary)] whitespace-nowrap font-body"
          animate={{ 
            x: isHovered ? 0 : 64,
            fontWeight: isHovered ? 700 : 400
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {children}
        </motion.span>
      </div>
    </motion.a>
  )
}

export default function FeaturedChefs() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Simplified parallax transforms - less aggressive to prevent glitchiness
  // Using smaller ranges and smoother transitions
  const y1 = useTransform(scrollYProgress, [0, 1], [60, -60])
  const y2 = useTransform(scrollYProgress, [0, 1], [30, -30])
  // Removed y3 transform for cards - this was causing the glitchy behavior
  const rotate = useTransform(scrollYProgress, [0, 1], [-3, 3])
  // Removed scale transform - it was causing layout thrashing

  return (
    <section
      id="chefs"
      ref={sectionRef}
      className="relative bg-[var(--color-primary)] overflow-hidden"
      style={{ borderBottom: 'none' }}
    >
      {/* Solid background - extends fully to bottom to avoid line with wave */}
      <div className="absolute inset-0 bg-[var(--color-primary)]" style={{ bottom: 0 }}>
        <motion.div
          style={{ y: y1 }}
          className="absolute top-[20%] -right-40 w-[800px] h-[800px] rounded-full bg-white/5 blur-[100px]"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full bg-[var(--color-primary-dark)]/30 blur-[80px]"
        />
      </div>

      {/* Main content */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Hero headline section - compact layout */}
        <div className="pt-12 sm:pt-16 pb-8 sm:pb-10 md:pt-20 md:pb-12">
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
                      for Chefs
                    </span>
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] sm:h-[2px] bg-gradient-to-r from-transparent via-white/50 via-white/70 via-white/50 to-transparent" 
                       style={{
                         backgroundSize: '100% 100%',
                         backgroundPosition: 'center'
                       }} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <span className="inline-block font-mono text-xs text-white/60 uppercase tracking-[0.3em]">
                  Two Sides — One Mission
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading text-[clamp(2rem,6vw,5.5rem)] sm:text-[clamp(2.5rem,7vw,5.5rem)] text-white leading-[0.85] tracking-tight"
              >
                Where <span className="font-display text-white/90">Flavor</span>
                <br />
                Meets <span className="font-display text-white/90">Freedom</span>
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
                Whether you're craving authentic home-cooked meals or ready to turn your kitchen into a business—we built this for you.
              </motion.p>
            </div>
          </div>
        </div>

        {/* Bento-style content grid - removed scale transform to prevent glitches */}
        <div className="pb-16 sm:pb-24 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            
            {/* Large feature card - For Chefs */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-2 lg:row-span-2 group will-change-transform"
            >
              <div className="relative h-full bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col justify-between">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-cream)] to-transparent opacity-50" />
                
                {/* Floating emoji decoration */}
                <motion.div
                  style={{ rotate }}
                  className="absolute top-8 right-8 md:top-12 md:right-12 text-8xl md:text-[10rem] opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                >
                  🍴
                </motion.div>

                <div className="relative">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 rounded-full mb-6">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                    <span className="font-mono text-xs text-[var(--color-primary)] uppercase tracking-wider">For Chefs</span>
                  </span>

                  <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6">
                  Your recipes deserve an audience.
                    <br />
                    <span className="text-[var(--color-primary)]">Turn your kitchen into your business.</span>
                  </h3>

                  <p className="font-body text-base sm:text-lg text-[var(--color-charcoal)]/70 leading-relaxed max-w-lg mb-4">
                    Your authentic recipes—whether it's Jiggs dinner, Filipino adobo, or Middle Eastern shawarma—are your competitive advantage. Monetize your culinary passion and turn it into sustainable income.
                  </p>
                  
                  <ul className="font-body text-sm sm:text-base text-[var(--color-charcoal)]/80 space-y-3 overflow-x-auto">
                    <li className="flex items-center gap-3 min-w-fit">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="whitespace-nowrap"><strong>Earn real income</strong> — Your skills, your kitchen, your business. No restaurant middleman.</span>
                    </li>
                    <li className="flex items-center gap-3 min-w-fit">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="whitespace-nowrap"><strong>Work your way</strong> — Set your schedule, control your menu, choose your pricing.</span>
                    </li>
                    <li className="flex items-center gap-3 min-w-fit">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="whitespace-nowrap"><strong>Own your customers</strong> — Direct relationships with people who value authentic food.</span>
                    </li>
                  </ul>
                </div>

                <div className="relative mt-6 flex flex-wrap gap-3">
                  {['Zero upfront costs', 'Weekly payouts', '$30-40+/hr potential'].map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-[var(--color-primary)]/10 rounded-full font-mono text-sm text-[var(--color-primary)] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Chef earnings card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group will-change-transform"
            >
              <div className="relative h-full bg-[var(--color-charcoal)] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 overflow-hidden min-h-[200px] sm:min-h-[240px]">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5" />
                
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-white/40 uppercase tracking-wider">Trial Phase</span>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-heading text-6xl md:text-7xl text-white">0%</span>
                      <span className="font-body text-white/60">fees</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-body text-sm text-white/50">
                      Keep 100% of your sales. We're building this for chefs, so we're waiving our cut.
                    </p>
                    <p className="font-mono text-[10px] text-white/30 mt-2">
                      *Standard payment processing fees apply (2.9% + 30¢ via Stripe)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Chef flexibility card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="group will-change-transform"
            >
              <div className="relative h-full bg-[var(--color-sage)] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 overflow-hidden min-h-[200px] sm:min-h-[240px]">
                <motion.div
                  style={{ rotate }}
                  className="absolute -bottom-4 -right-4 text-8xl opacity-30"
                >
                  🏠
                </motion.div>
                
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Your Space</span>
                    <h4 className="font-heading text-2xl text-white mt-3 leading-tight">
                      Cook at home or use our partnered commercial kitchens
                    </h4>
                  </div>
                  
                  <p className="font-body text-sm text-white/70 mt-4">
                  We help you navigate all required provincial licenses and food safety standards so you can start selling with confidence. Rent our partnered commercial kitchens when you need professional space. No commitments.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Community card - For Food Lovers */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group will-change-transform"
            >
              <div className="relative h-full bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 overflow-hidden min-h-[200px] sm:min-h-[240px] border border-white/20">
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-[var(--color-charcoal-light)] uppercase tracking-wider">For Food Lovers</span>
                      <h4 className="font-heading text-2xl text-[var(--color-charcoal)] mt-3 leading-tight">
                        Discover authentic meals from talented neighbors
                      </h4>
                    </div>
                    <span className="text-4xl">🍽️</span>
                  </div>
                  
                  <p className="font-body text-sm text-[var(--color-charcoal)]/60 mt-4">
                    Fresh, authentic food from talented home chefs. Know your chef, support local, taste the difference.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Chef schedule card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="group will-change-transform"
            >
              <div className="relative h-full bg-[var(--color-gold)] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 overflow-hidden min-h-[200px] sm:min-h-[240px]">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-[var(--color-charcoal)]/60 uppercase tracking-wider">For Chefs</span>
                      <h4 className="font-heading text-2xl text-[var(--color-charcoal)] mt-3 leading-tight">
                        Your Schedule.
                        <br />
                        Your Menu.
                        <br />
                        Your Rules.
                      </h4>
                    </div>
                    <span className="text-4xl">🔪</span>
                  </div>
                  
                  <p className="font-body text-sm text-[var(--color-charcoal)]/70 mt-4">
                    No minimums. No locked contracts. Cook when you want. Cook what you love. Earn what you deserve.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Full support card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="group will-change-transform"
            >
              <div className="relative h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 overflow-hidden min-h-[200px] sm:min-h-[240px]">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                  }} />
                </div>
                
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-xs text-white/60 uppercase tracking-wider">We Handle Logistics</span>
                    <h4 className="font-heading text-2xl text-white mt-3 leading-tight">
                      Delivery. Payments. Customer support.
                    </h4>
                  </div>
                  
                  <p className="font-body text-sm text-white/70 mt-4">
                    You focus on cooking. We handle the rest—full earnings transparency included.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="pb-16 sm:pb-24 md:pb-32 flex flex-col items-center relative z-10"
        >
          {/* Clover-style button like les-arbres-fruitiers.fr "Pour les curieux" */}
          <div className="bg-white rounded-full px-10 py-5 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CloverButton href="https://local-cooks-community.vercel.app/">
              Explore Local Cooks for Chefs
            </CloverButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
