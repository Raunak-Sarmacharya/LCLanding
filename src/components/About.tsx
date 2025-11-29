import { motion, useInView } from 'motion/react'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Empowering Local Chefs',
    description: 'We bridge the gap between your neighborhood and the world, connecting you with chefs who bring their unique, home-cooked flavors directly to your table.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'A World of Flavors',
    description: 'Explore an extensive selection of authentic dishes, each crafted by passionate local chefs, offering you a culinary journey through diverse cultures and traditions.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Supporting Community Growth',
    description: 'Every order through Local Cooks helps uplift local chefs, enriching your community\'s food scene while fostering cultural diversity and economic empowerment.',
  },
]

export default function About() {
  const ref = useRef(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const biryaniRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView || !cardsRef.current) return

    const ctx = gsap.context(() => {
      // Animate feature cards with stagger
      gsap.fromTo('.feature-card',
        { 
          opacity: 0, 
          x: 60,
          rotateY: -10
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        }
      )
    }, cardsRef)

    return () => ctx.revert()
  }, [isInView])

  // 3D Parallax scroll effect for biryani image (like Done Drinks)
  // When scrolling DOWN, the biryani moves UP
  useEffect(() => {
    if (!biryaniRef.current) return

    const ctx = gsap.context(() => {
      // Parallax: scroll DOWN = biryani moves UP (opposite direction)
      // Start: yPercent positive (below), End: yPercent negative (above)
      gsap.fromTo(biryaniRef.current, 
        { yPercent: 50 }, // Start below its position
        {
          yPercent: -80, // End above its position (moves UP as you scroll DOWN)
          ease: 'none',
          scrollTrigger: {
            trigger: '#about',
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
    <section id="about" className="py-24 md:py-32 relative overflow-hidden">
      {/* Floating Food Decoration - Biryani with 3D Parallax (like Done Drinks) */}
      {/* Bigger size (280px) and z-50 to stay on top of pill marquee - Hidden on mobile/tablet */}
      <div 
        ref={biryaniRef}
        className="parallax-food absolute top-[5%] right-[3%] pointer-events-none select-none z-50 hidden xl:block"
        style={{ 
          width: '280px',
          height: '280px',
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        <img 
          src="/food-biryani.png" 
          alt="" 
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.25))' }}
          draggable={false}
        />
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-primary)]/5 to-transparent rounded-l-[100px] -z-10" />
      <div className="parallax-bg absolute bottom-20 left-10 w-64 h-64 bg-[var(--color-butter)] rounded-full blur-3xl opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div ref={ref}>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="font-mono text-sm text-[var(--color-primary)] uppercase tracking-widest mb-4 block"
            >
              About Us
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6"
            >
              Why Are We{' '}
              <span className="font-display text-[var(--color-primary)]">Unique?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-base sm:text-lg text-[var(--color-charcoal-light)] leading-relaxed mb-6 sm:mb-8"
            >
              <span className="font-display text-[var(--color-primary)] text-xl">Local Cooks</span> was born from a simple belief: everyone deserves access to authentic, 
              homemade meals that tell a story. We're not just a delivery platform – we're a 
              bridge connecting passionate home chefs with food lovers in their community.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              {[
                { icon: '✓', text: 'Independent Local Chefs' },
                { icon: '✓', text: 'Food Safety Certified' },
                { icon: '✓', text: 'Secure Payments' },
                { icon: '✓', text: 'Real-time Tracking' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-[var(--color-primary)]/10">
                  <span className="text-[var(--color-primary)] font-bold">{item.icon}</span>
                  <span className="font-mono text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Feature Cards */}
          <div ref={cardsRef} className="space-y-6 stagger-children">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card stagger-item card-hover bg-white rounded-3xl p-8 shadow-lg shadow-black/5 border border-[var(--color-cream-dark)] group"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-coral)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-[var(--color-charcoal)] mb-2 group-hover:text-[var(--color-primary)] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[var(--color-charcoal-light)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
