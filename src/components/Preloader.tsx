import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import gsap from 'gsap'

interface PreloaderProps {
  onComplete: () => void
  minimumDuration?: number
}

export default function Preloader({ onComplete, minimumDuration = 3200 }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'revealing' | 'complete'>('loading')
  const containerRef = useRef<HTMLDivElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)

  // Food items positioned in a perfect circle around the logo
  const foodItems = [
    { src: '/food-cake.png', angle: 0 },
    { src: '/food-noodles.png', angle: 72 },
    { src: '/food-wrap.png', angle: 144 },
    { src: '/food-biryani.png', angle: 216 },
    { src: '/food-shrimp.png', angle: 288 },
  ]

  // Orbit radius - large enough to prevent ANY overlap
  const orbitRadius = 140

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const linearProgress = Math.min(elapsed / minimumDuration, 1)
      // Smooth easing
      const easedProgress = 1 - Math.pow(1 - linearProgress, 2.5)
      setProgress(Math.round(easedProgress * 100))
      
      if (linearProgress >= 1) {
        clearInterval(interval)
        // Start reveal phase
        setTimeout(() => setPhase('revealing'), 200)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [minimumDuration])

  // Handle reveal animation
  useEffect(() => {
    if (phase !== 'revealing' || !revealRef.current) return

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('complete')
        onComplete()
      }
    })

    // Logo scales up and fades
    tl.to('.logo-wrapper', {
      scale: 15,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.in',
    }, 0)

    // Food items fly outward
    tl.to('.orbit-food-item', {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in',
    }, 0)

    // Brand name and other elements fade
    tl.to('.fade-element', {
      opacity: 0,
      y: -30,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in',
    }, 0)

    // Circular reveal wipe from center
    tl.to('.preloader-bg', {
      clipPath: 'circle(0% at 50% 45%)',
      duration: 0.7,
      ease: 'power2.inOut',
    }, 0.3)

    return () => {
      tl.kill()
    }
  }, [phase, onComplete])

  // Initial animations
  useEffect(() => {
    if (!containerRef.current || phase !== 'loading') return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Background orbs
      tl.fromTo('.bg-orb',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, stagger: 0.15 },
        0
      )

      // Logo entrance
      tl.fromTo('.logo-wrapper',
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
        0.2
      )

      // Food items spin in one by one
      tl.fromTo('.orbit-food-item',
        { scale: 0, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(2)',
        },
        0.4
      )

      // Brand name slide up
      tl.fromTo('.brand-name',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        0.7
      )

      // Tagline
      tl.fromTo('.tagline',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        1.0
      )

      // Progress bar
      tl.fromTo('.progress-area',
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.4 },
        0.9
      )

      // Bottom text
      tl.fromTo('.bottom-text',
        { opacity: 0 },
        { opacity: 0.4, duration: 0.5 },
        1.2
      )

      // Continuous smooth orbit rotation
      gsap.to('.orbit-ring', {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: 'none',
      })

      // Counter-rotate each food item to keep upright
      gsap.to('.orbit-food-inner', {
        rotation: -360,
        duration: 30,
        repeat: -1,
        ease: 'none',
      })

      // Gentle pulse on logo
      gsap.to('.logo-pulse', {
        scale: 1.06,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

    }, containerRef)

    return () => ctx.revert()
  }, [phase])

  if (phase === 'complete') return null

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999]">
      {/* Main background with clip-path for reveal */}
      <div 
        ref={revealRef}
        className="preloader-bg absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, var(--color-cream) 0%, var(--color-cream-dark) 50%, #FFE8DD 100%)',
          clipPath: 'circle(150% at 50% 45%)',
        }}
      >
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bg-orb absolute top-[10%] left-[5%] w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-[var(--color-primary)]/12 to-transparent rounded-full blur-[100px]" />
          <div className="bg-orb absolute bottom-[10%] right-[5%] w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-gradient-to-br from-[var(--color-gold)]/15 to-transparent rounded-full blur-[100px]" />
          
          {/* Subtle dot pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-charcoal) 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center">
          
          {/* Logo with orbiting food items */}
          <div className="relative mb-10" style={{ width: '340px', height: '340px' }}>
            
            {/* Orbiting ring container */}
            <div 
              className="orbit-ring absolute inset-0"
              style={{ 
                width: '340px', 
                height: '340px',
              }}
            >
              {foodItems.map((food, index) => {
                const angleRad = (food.angle * Math.PI) / 180
                const x = Math.cos(angleRad) * orbitRadius
                const y = Math.sin(angleRad) * orbitRadius
                
                return (
                  <div
                    key={food.src}
                    className="orbit-food-item absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div className="orbit-food-inner w-[52px] h-[52px] md:w-[62px] md:h-[62px]">
                      <img 
                        src={food.src} 
                        alt="" 
                        className="w-full h-full object-contain"
                        style={{ 
                          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18))',
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Center logo */}
            <div className="logo-wrapper absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="logo-pulse relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
                {/* Glow effect */}
                <div className="absolute inset-[-20px] bg-gradient-radial from-[var(--color-primary)]/15 to-transparent rounded-full blur-2xl" />
                
                {/* White circle */}
                <div className="absolute inset-0 bg-white rounded-full shadow-2xl" style={{ boxShadow: '0 20px 60px -10px rgba(245, 16, 66, 0.25)' }} />
                
                {/* Logo */}
                <img 
                  src="/logo-lc.png" 
                  alt="LocalCooks" 
                  className="relative z-10 w-20 h-20 md:w-24 md:h-24 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Brand name - with extra bottom padding for the L */}
          <div className="brand-name fade-element mb-2 pb-2">
            <h1 
              className="font-display text-[3.2rem] md:text-[4.5rem] text-[var(--color-primary)] leading-none"
              style={{ 
                paddingBottom: '8px', // Extra space for descenders
                marginBottom: '0',
              }}
            >
              LocalCooks
            </h1>
          </div>

          {/* Tagline */}
          <p className="tagline fade-element font-mono text-[10px] md:text-[11px] text-[var(--color-charcoal-light)] uppercase tracking-[0.4em] mb-12">
            Homemade with Love
          </p>

          {/* Progress bar */}
          <div className="progress-area fade-element w-52 md:w-64">
            {/* Track */}
            <div className="relative h-[2px] bg-[var(--color-charcoal)]/8 rounded-full overflow-hidden">
              {/* Fill */}
              <motion.div 
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-coral), var(--color-primary))',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 0 15px var(--color-primary)',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>
            
            {/* Progress text */}
            <div className="mt-4 flex justify-between items-center">
              <span className="font-mono text-[9px] md:text-[10px] text-[var(--color-charcoal-light)]/60 tracking-widest uppercase">
                Loading experience
              </span>
              <span className="font-mono text-sm md:text-base font-bold text-[var(--color-primary)] tabular-nums">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="bottom-text absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center">
          <p className="font-body text-[9px] md:text-[10px] text-[var(--color-charcoal-light)] tracking-[0.2em]">
            Local Cooks • Local Company • Local Community
          </p>
        </div>
      </div>
    </div>
  )
}
