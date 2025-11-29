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
    if (lenis) {
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
        // Pretty Patty-style smooth scroll settings
        // lerp: Linear interpolation factor (0-1)
        // Lower = more "laggy/elastic" feel, higher = more immediate
        // More responsive on mobile for better performance
        lerp: isMobile ? 0.12 : 0.075, // Faster on mobile
        duration: isMobile ? 1.2 : 1.6, // Shorter on mobile
        smoothWheel: true,
        wheelMultiplier: isMobile ? 1.0 : 0.9, // More responsive on mobile
        touchMultiplier: 1.8, // Better touch sensitivity
        infinite: false,
        // Enable smooth touch scrolling with momentum
        syncTouch: true,
        syncTouchLerp: isMobile ? 0.1 : 0.06, // Faster on mobile
        // Touch inertia for that premium feel
        touchInertiaExponent: 1.8,
        // Custom easing curve for smooth deceleration (like Pretty Patty)
        easing: (t: number) => {
          // Custom easing: starts fast, decelerates smoothly
          return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        },
      }}
    >
      <LenisProvider lenisRef={lenisRef}>
        {children}
      </LenisProvider>
    </ReactLenis>
  )
}
