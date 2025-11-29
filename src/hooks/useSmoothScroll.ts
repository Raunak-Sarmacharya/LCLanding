import { useCallback } from 'react'
import { useLenis } from '../contexts/LenisContext'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Custom hook for smooth scrolling that handles anchor links
 * and properly manages the map section's ScrollTrigger
 */
export const useSmoothScroll = () => {
  const context = useLenis()
  const lenisRef = context?.lenisRef

  const scrollTo = useCallback((target: string | number, options?: {
    offset?: number
    duration?: number
    onComplete?: () => void
  }) => {
    const lenis = lenisRef?.current?.lenis
    if (!lenis) {
      // Fallback to native scroll if Lenis is not available
      if (typeof target === 'string') {
        const element = document.querySelector(target)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      return
    }

    // Default options
    const scrollOptions = {
      offset: -80, // Account for fixed navbar
      duration: 1.5,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // Ease out cubic
      ...options,
    }

    // If scrolling to a section, ensure ScrollTrigger updates properly
    if (typeof target === 'string') {
      const element = document.querySelector(target)
      if (!element) return

      // Check if target is the map section or after it
      const mapSection = document.querySelector('#location')
      let isMapOrAfter = false
      
      if (mapSection) {
        if (element === mapSection) {
          isMapOrAfter = true
        } else {
          // Check if element comes after map in DOM order
          const allElements = Array.from(document.querySelectorAll('section[id], div[id]'))
          const mapIndex = allElements.indexOf(mapSection as Element)
          const targetIndex = allElements.indexOf(element)
          isMapOrAfter = targetIndex >= mapIndex && targetIndex !== -1 && mapIndex !== -1
        }
      }

      // If scrolling to map or after, we need to handle the pinned ScrollTrigger
      if (isMapOrAfter && mapSection) {
        // Get the map's ScrollTrigger instance
        const mapScrollTrigger = ScrollTrigger.getAll().find(
          (st) => st.trigger === mapSection
        )

        // Scroll to the target
        lenis.scrollTo(target, {
          ...scrollOptions,
          onComplete: () => {
            // Small delay to ensure scroll position is settled
            setTimeout(() => {
              // Force ScrollTrigger refresh after scroll completes
              ScrollTrigger.refresh()
              if (mapScrollTrigger) {
                mapScrollTrigger.refresh()
              }
              options?.onComplete?.()
            }, 100)
          },
        })
      } else {
        // Normal scroll for sections before the map
        lenis.scrollTo(target, scrollOptions)
      }
    } else {
      // Scrolling to a number (pixels) - handle map if scrolling to top
      if (target === 0) {
        // When scrolling to top, refresh ScrollTrigger after completion
        lenis.scrollTo(target, {
          ...scrollOptions,
          onComplete: () => {
            setTimeout(() => {
              ScrollTrigger.refresh()
              options?.onComplete?.()
            }, 100)
          },
        })
      } else {
        lenis.scrollTo(target, scrollOptions)
      }
    }
  }, [lenisRef])

  const scrollToTop = useCallback((options?: {
    duration?: number
    onComplete?: () => void
  }) => {
    scrollTo(0, {
      duration: 1.2,
      ...options,
    })
  }, [scrollTo])

  return { scrollTo, scrollToTop }
}

