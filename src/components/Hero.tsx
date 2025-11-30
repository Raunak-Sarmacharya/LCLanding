import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TypewriterText from './TypewriterText'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const cakeRef = useRef<HTMLDivElement>(null)
  const noodlesRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create master timeline for orchestrated animations
      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' }
      })

      // Animate the hero background elements first
      tl.fromTo('.hero-orb',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.5, stagger: 0.2 },
        0
      )

      // Animate badge
      tl.fromTo('.hero-badge',
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 },
        0.3
      )

      // Animate title with split text effect
      if (titleRef.current) {
        const chars = titleRef.current.querySelectorAll('.char')
        tl.fromTo(chars,
          { opacity: 0, y: 100, rotateX: -90, transformOrigin: 'top' },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.2,
            stagger: 0.03,
            ease: 'power4.out',
          },
          0.4
        )
      }

      // Animate description
      tl.fromTo('.hero-description',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        0.8
      )

      // Animate CTA buttons with bounce
      tl.fromTo('.hero-cta',
        { opacity: 0, y: 30, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8,
          stagger: 0.15,
          ease: 'back.out(1.7)'
        },
        1
      )

      // Animate chef image
      tl.fromTo('.hero-image-container',
        { opacity: 0, scale: 0.8, x: 100 },
        { 
          opacity: 1, 
          scale: 1, 
          x: 0,
          duration: 1.2,
          ease: 'power3.out'
        },
        0.5
      )

      // Food items - fade in
      tl.fromTo('.hero-food-parallax',
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out'
        },
        1
      )

      // Animate scroll indicator
      tl.fromTo('.scroll-indicator',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8 },
        1.5
      )

      // Parallax effect on mouse move
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e
        const xPos = (clientX / window.innerWidth - 0.5) * 20
        const yPos = (clientY / window.innerHeight - 0.5) * 20

        gsap.to('.parallax-slow', {
          x: xPos,
          y: yPos,
          duration: 1,
          ease: 'power2.out'
        })

        gsap.to('.parallax-fast', {
          x: xPos * 2,
          y: yPos * 2,
          duration: 0.8,
          ease: 'power2.out'
        })

        // Subtle image parallax
        gsap.to('.hero-image-parallax', {
          x: xPos * 0.5,
          y: yPos * 0.5,
          duration: 1,
          ease: 'power2.out'
        })
      }

      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)

    }, heroRef)

    return () => ctx.revert()
  }, [])

  // Minimal parallax for hero food items - scroll DOWN = elements move UP/DOWN
  useEffect(() => {
    // Cake - top left - moves UP when scrolling down
    if (cakeRef.current) {
      gsap.fromTo(cakeRef.current,
        { yPercent: 15 },
        {
          yPercent: -25,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.3,
          }
        }
      )
    }

    // Noodles - top right - moves UP when scrolling down
    if (noodlesRef.current) {
      gsap.fromTo(noodlesRef.current,
        { yPercent: 20 },
        {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.3,
          }
        }
      )
    }

    // Wrap - bottom left - moves DOWN when scrolling down
    if (wrapRef.current) {
      gsap.fromTo(wrapRef.current,
        { yPercent: -10 },
        {
          yPercent: 35,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.3,
          }
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === document.getElementById('home')) {
          st.kill()
        }
      })
    }
  }, [])

  const splitText = (text: string) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="char inline-block"
        style={{ 
          display: char === ' ' ? 'inline' : 'inline-block',
          perspective: '1000px'
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12 grain"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Gradient Orbs with Animation */}
      <div className="hero-orb parallax-slow absolute top-1/4 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-coral)]/15 rounded-full blur-3xl" />
      <div className="hero-orb parallax-slow absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-[var(--color-butter)] to-[var(--color-gold)]/30 rounded-full blur-3xl" />
      <div className="hero-orb parallax-fast absolute top-1/3 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/8 rounded-full blur-3xl animate-[pulse-soft_8s_ease-in-out_infinite]" />

      {/* Main Content - Split Layout - properly contained */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 w-full box-border overflow-x-clip">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4 md:gap-6 lg:gap-10 items-center w-full max-w-full">
          {/* Left Side - Text Content */}
          <div className="text-left sm:text-left lg:pr-8 col-span-1 order-2 sm:order-1" style={{ transform: 'skewY(-1deg)' }}>
            {/* Badge - responsive sizing */}
            <div className="hero-badge mb-3 sm:mb-4 md:mb-6" style={{ transform: 'skewY(1deg)' }}>
              <span className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-white/80 backdrop-blur-sm px-2.5 sm:px-3 md:px-5 py-1.5 sm:py-1.5 md:py-2.5 rounded-full font-mono text-[9px] sm:text-[9px] md:text-sm text-[var(--color-charcoal)] shadow-md sm:shadow-lg border border-[var(--color-primary)]/10">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 bg-[var(--color-primary)]"></span>
                </span>
                Now serving in St. John's, Newfoundland
              </span>
            </div>

            {/* Main Title with Typewriter - responsive sizing */}
            <h1
              ref={titleRef}
              className="font-heading text-2xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-7xl text-[var(--color-charcoal)] leading-[0.95] mb-3 sm:mb-3 md:mb-6"
              style={{ perspective: '1000px', transform: 'skewY(1deg)' }}
            >
              <span className="block mb-1 sm:mb-2">{splitText('Your World of')}</span>
              <TypewriterText
                staticText="Local"
                words={['Cooks', 'Company', 'Community']}
                typingSpeed={120}
                deletingSpeed={80}
                pauseDuration={2500}
                staticClassName="font-display text-[var(--color-primary)] text-shadow-soft"
                dynamicClassName="font-display text-[var(--color-primary)]"
                className="block"
              />
            </h1>

            {/* Description - responsive sizing */}
            <p 
              className="hero-description font-body text-[10px] sm:text-xs md:text-base lg:text-lg xl:text-xl text-[var(--color-charcoal)]/80 max-w-xl mb-4 sm:mb-5 md:mb-8 lg:mb-10 leading-relaxed"
              style={{ transform: 'skewY(1deg)' }}
            >
              Discover authentic homemade meals from passionate local chefs.
              <span className="text-[var(--color-primary)] font-medium"> Fresh ingredients,</span> cultural diversity, and
              <span className="text-[var(--color-gold)] font-medium"> delivered to your door.</span>
            </p>

            {/* CTA Buttons - responsive sizing */}
            <div className="flex flex-row items-center gap-3 sm:gap-2 md:gap-4" style={{ transform: 'skewY(1deg)' }}>
              <a
                href="https://localcook.shop/app/index.php"
                className="hero-cta group bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2 md:py-3 lg:py-4 rounded-full font-body font-semibold text-[10px] sm:text-[10px] md:text-sm lg:text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-1.5 sm:gap-1.5 md:gap-2.5 shadow-lg shadow-[var(--color-primary)]/25"
              >
                Start Ordering
                <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="hero-cta group flex items-center justify-center gap-1.5 sm:gap-1.5 md:gap-2.5 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2 md:py-3 lg:py-4 rounded-full font-body font-medium text-[10px] sm:text-[10px] md:text-sm lg:text-base text-[var(--color-charcoal)] border border-[var(--color-charcoal)]/15 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-all duration-300 bg-white/70 backdrop-blur-sm hover:bg-white/90"
              >
                <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-[var(--color-charcoal-light)] group-hover:text-[var(--color-primary)] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                See How It Works
              </a>
            </div>

          </div>

          {/* Right Side - Chef Image */}
          <div ref={imageRef} className="relative flex justify-center sm:justify-center lg:justify-end col-span-1 order-1 sm:order-2">
            <div className="hero-image-container hero-image-parallax relative">
              {/* Decorative food images with minimal parallax - Hidden on mobile/tablet to prevent overlap */}
              {/* Cake (bigger) - top left - moves UP */}
              <div 
                ref={cakeRef}
                className="hero-food-parallax absolute -top-6 left-0 lg:-left-8 xl:-left-12 z-20 pointer-events-none select-none hidden lg:block"
                style={{ width: '100px', height: '100px' }}
              >
                <img 
                  src="/food-cake.png" 
                  alt="" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                  draggable={false}
                />
              </div>
              {/* Noodles (bigger) - top right - moves UP */}
              <div 
                ref={noodlesRef}
                className="hero-food-parallax absolute top-1/4 right-0 lg:-right-6 xl:-right-10 z-20 pointer-events-none select-none hidden lg:block"
                style={{ width: '122px', height: '122px' }}
              >
                <img 
                  src="/food-noodles.png" 
                  alt="" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                  draggable={false}
                />
              </div>
              {/* Wrap (bigger) - bottom left - moves DOWN */}
              <div 
                ref={wrapRef}
                className="hero-food-parallax absolute bottom-4 left-0 lg:-left-10 xl:-left-16 z-20 pointer-events-none select-none hidden lg:block"
                style={{ width: '115px', height: '115px' }}
              >
                <img 
                  src="/food-wrap.png" 
                  alt="" 
                  className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                  draggable={false}
                />
              </div>

              {/* Main Image Container - responsive sizing to preserve layout */}
              <div className="relative w-[200px] h-[260px] sm:w-[180px] sm:h-[240px] md:w-[280px] md:h-[380px] lg:w-[360px] lg:h-[480px] xl:w-[420px] xl:h-[540px] rounded-2xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-xl sm:shadow-xl md:shadow-2xl shadow-black/15">
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/20 via-transparent to-transparent z-[1]" />
                
                {/* Chef Image */}
                <img
                  src="/chef.png"
                  alt="Local chef cooking delicious homemade food"
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Decorative border glow */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] border-2 sm:border-3 md:border-4 border-white/20 pointer-events-none" />
              </div>

              {/* Background decorative shape */}
              <div className="absolute -z-10 top-3 sm:top-4 md:top-8 right-0 sm:-right-2 md:-right-4 w-[95%] sm:w-full h-full bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-coral)]/10 rounded-2xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] transform rotate-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on small screens */}
      <div className="scroll-indicator absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 sm:gap-2 hidden md:flex">
        <span className="font-mono text-[8px] sm:text-[10px] md:text-xs text-[var(--color-charcoal-light)] uppercase tracking-widest">
          Scroll to explore
        </span>
        <div className="w-4 h-7 sm:w-5 sm:h-8 md:w-6 md:h-10 border-2 border-[var(--color-charcoal-light)] rounded-full flex items-start justify-center p-0.5 sm:p-1">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--color-primary)] rounded-full"
          />
        </div>
      </div>
    </section>
  )
}
