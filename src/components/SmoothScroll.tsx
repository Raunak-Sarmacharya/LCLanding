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
    
    // On mobile with syncTouch: false, we need to listen to native scroll events
    // to keep ScrollTrigger in sync (Lenis still tracks native scroll, but we need to update ScrollTrigger)
    // Also, we need to ensure Lenis doesn't apply smoothing during active touch
    const isMobileDevice = window.innerWidth < 768
    let nativeScrollHandler: (() => void) | null = null
    let touchStartHandler: (() => void) | null = null
    let touchEndHandler: (() => void) | null = null
    
    if (isMobileDevice && lenis) {
      // Update ScrollTrigger when native scrolling happens
      nativeScrollHandler = () => {
        ScrollTrigger.update()
      }
      window.addEventListener('scroll', nativeScrollHandler, { passive: true })
      
      // CRITICAL FIX: Disable Lenis smoothing during active touch for perfect 1:1 finger tracking
      // When touch starts, ensure lerp is 1 (no smoothing)
      // When touch ends, lerp can resume (though it's already 1 on mobile)
      touchStartHandler = () => {
        // Force instant scroll tracking during active touch (no smoothing)
        if (lenis) {
          lenis.options.lerp = 1
        }
      }
      
      touchEndHandler = () => {
        // Keep lerp at 1 on mobile (native scrolling should never be smoothed)
        if (lenis) {
          lenis.options.lerp = 1
        }
      }
      
      // Listen to touch events to ensure no smoothing during active touch
      document.addEventListener('touchstart', touchStartHandler, { passive: true })
      document.addEventListener('touchend', touchEndHandler, { passive: true })
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
      if (nativeScrollHandler) {
        window.removeEventListener('scroll', nativeScrollHandler)
      }
      if (touchStartHandler) {
        document.removeEventListener('touchstart', touchStartHandler)
      }
      if (touchEndHandler) {
        document.removeEventListener('touchend', touchEndHandler)
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
        // CRITICAL: On mobile with syncTouch: false, set lerp to 1 (no smoothing) for perfect 1:1 finger tracking
        // This eliminates jitter by ensuring native scrolling is completely unmodified
        lerp: isMobile ? 1 : 0.08, // lerp: 1 = instant, no smoothing (perfect for native scrolling on mobile)
        // Duration for momentum scrolling after touch release
        duration: isMobile ? 1.2 : 1.5, // Slightly longer on mobile for smoother momentum
        smoothWheel: true,
        wheelMultiplier: isMobile ? 1.0 : 0.85,
        // Premium mobile scroll sensitivity - matches effortel.com configuration
        // Lenis default touchMultiplier is 1.0, which is what premium sites use for native scrolling
        // With syncTouch: false, native scrolling is used, so this value aligns with standard behavior
        touchMultiplier: isMobile ? 1.0 : 1.6, // 1.0 on mobile = Lenis default, matches effortel.com and other premium sites
        infinite: false,
        // CRITICAL FIX: Disable syncTouch on mobile to use native scrolling
        // This allows fast, natural scrolling like prettypatty.ch
        // Native scrolling is what makes top websites feel responsive on mobile
        syncTouch: isMobile ? false : true, // false on mobile = native scrolling (fast & natural), true on desktop = smooth scrolling
        // syncTouchLerp only applies when syncTouch is true (desktop only)
        syncTouchLerp: isMobile ? 0.075 : 0.05, // Only used on desktop when syncTouch is true
        // touchInertiaExponent only applies when syncTouch is true (desktop only)
        touchInertiaExponent: isMobile ? 1.5 : 1.7, // Only used on desktop when syncTouch is true
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
