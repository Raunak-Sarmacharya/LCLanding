import { ReactLenis } from 'lenis/react'
import type { LenisRef } from 'lenis/react'
import { useEffect, useRef, useCallback, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LenisProvider } from '../contexts/LenisContext'

gsap.registerPlugin(ScrollTrigger)

interface SmoothScrollProps {
  children: React.ReactNode
}

// Threshold for auto-snapping to top (in pixels)
const SNAP_TO_TOP_THRESHOLD = 100

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<LenisRef | null>(null)
  const isSnappingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  // Handle auto-snap to top when near the top (like Pretty Patty)
  const handleScrollEnd = useCallback(() => {
    const lenis = lenisRef.current?.lenis
    if (!lenis || isSnappingRef.current) return

    const currentScroll = lenis.scroll
    
    // If we're close to the top but not at the top, snap to top
    if (currentScroll > 0 && currentScroll < SNAP_TO_TOP_THRESHOLD) {
      isSnappingRef.current = true
      lenis.scrollTo(0, {
        duration: 0.8,
        easing: (t: number) => 1 - Math.pow(1 - t, 4), // Ease out quart
        onComplete: () => {
          isSnappingRef.current = false
        }
      })
    }
  }, [])

  useEffect(() => {
    // Sync Lenis scroll with ScrollTrigger
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }

    // Update ScrollTrigger on Lenis scroll events
    const lenis = lenisRef.current?.lenis
    
    // Refresh ScrollTrigger on resize for responsive behavior
    const handleResize = () => {
      ScrollTrigger.refresh()
    }
    
    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 150)
    }
    
    if (lenis) {
      // Critical: Update ScrollTrigger on every scroll for smooth sync
      lenis.on('scroll', ScrollTrigger.update)
      
      // Handle scroll end detection for snap-to-top
      lenis.on('scroll', () => {
        // Clear previous timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        // Set new timeout - fires when scrolling stops
        scrollTimeoutRef.current = window.setTimeout(handleScrollEnd, 150)
      })
    }
    
    // Add resize listener for ScrollTrigger refresh
    window.addEventListener('resize', debouncedResize)

    // Add Lenis raf to GSAP ticker for synchronized animations
    gsap.ticker.add(update)

    // Disable lag smoothing for immediate responsiveness
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(update)
      if (lenis) {
        lenis.off('scroll', ScrollTrigger.update)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(resizeTimeout)
      // Refresh ScrollTrigger on cleanup to ensure proper state
      ScrollTrigger.refresh()
    }
  }, [handleScrollEnd])

  // Detect mobile on mount
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <ReactLenis 
      root 
      ref={lenisRef}
      options={{ 
        autoRaf: false,
        // Optimized smooth scroll settings for Lenis + ScrollTrigger integration
        // Mobile-optimized for natural, smooth touch feel like prettypatty.ch
        // Higher lerp during active touch for responsive, natural finger-following (no lag)
        lerp: isMobile ? 0.15 : 0.08, // Higher on mobile for responsive active touch (finger follows immediately)
        // Shorter duration for more responsive feel during active touch
        duration: isMobile ? 0.8 : 1.5, // Shorter on mobile for more responsive active touch
        smoothWheel: true,
        wheelMultiplier: isMobile ? 1.0 : 0.85,
        // Higher touchMultiplier for more responsive touch input during active touch
        touchMultiplier: isMobile ? 1.8 : 1.6, // Higher on mobile for more responsive active touch
        infinite: false,
        // Enable smooth touch scrolling with momentum
        syncTouch: true,
        // Higher syncTouchLerp during active touch for more responsive feel, lower during inertia
        syncTouchLerp: isMobile ? 0.1 : 0.05, // Higher on mobile for more responsive active touch
        // Higher touchInertiaExponent for stronger momentum that continues longer after release
        touchInertiaExponent: isMobile ? 1.8 : 1.7, // Higher on mobile for stronger momentum continuation
        // Custom easing curve for smooth deceleration (optimized)
        easing: (t: number) => {
          // Optimized easing: smooth acceleration and deceleration
          return t === 1 ? 1 : 1 - Math.pow(2, -8 * t)
        },
        // Allow overscroll for more natural mobile feel
        overscroll: isMobile ? true : false,
      }}
    >
      <LenisProvider lenisRef={lenisRef}>
        {children}
      </LenisProvider>
    </ReactLenis>
  )
}
