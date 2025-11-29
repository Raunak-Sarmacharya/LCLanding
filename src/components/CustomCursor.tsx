import { useEffect, useRef } from 'react'

// Brand colors
const PRIMARY_COLOR = '#f51042'
const PRIMARY_LIGHT = 'rgba(245, 16, 66, 0.35)'
const PRIMARY_FILL = 'rgba(245, 16, 66, 0.08)'

// Premium cursor colors - white/cream for contrast on brand sections
const CURSOR_WHITE = '#FFFCFA'
const CURSOR_WHITE_LIGHT = 'rgba(255, 252, 250, 0.4)'
const CURSOR_WHITE_FILL = 'rgba(255, 252, 250, 0.12)'

/**
 * CustomCursor Component - Premium Edition v2
 * 
 * Enhanced with:
 * - Hardware-accelerated transforms to prevent pixelation
 * - Ultra-robust color detection using elementFromPoint with smart traversal
 * - Handles SVG elements, mixed-color elements, and complex layouts
 * - Advanced contrast calculation for optimal visibility
 * - Subtle glow effects for premium feel
 * - Smooth, award-winning animation techniques
 * 
 * Implementation based on best practices from:
 * - Award-winning websites (Awwwards, Orpetron)
 * - Motion.dev performance documentation
 * - Premium cursor animation techniques
 * - Inspired by neoleaf.bytetown.agency detection robustness
 */
export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  
  // Position refs - initialized OFF-SCREEN to prevent center appearance
  const mouse = useRef({ x: -100, y: -100 })
  const outerPos = useRef({ x: -100, y: -100 })
  const innerPos = useRef({ x: -100, y: -100 })
  const outerScale = useRef(1)
  const innerScale = useRef(1)
  const targetOuterScale = useRef(1)
  const targetInnerScale = useRef(1)
  const isHovering = useRef(false)
  const shouldUseWhiteCursor = useRef(false)
  const rafId = useRef<number>(0)
  
  // Track if cursor has been activated by user interaction
  const hasMouseMoved = useRef(false)

  useEffect(() => {
    // Skip on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return
    }

    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    // Set initial position OFF-SCREEN (not center)
    // This prevents cursor from appearing during preloader when mouse isn't on screen
    mouse.current = { x: -100, y: -100 }
    outerPos.current = { x: -100, y: -100 }
    innerPos.current = { x: -100, y: -100 }

    /**
     * Convert RGB color string to RGB values
     */
    const parseRGB = (rgbString: string): { r: number; g: number; b: number } | null => {
      // Handle rgba() or rgb() format
      const match = rgbString.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
        }
      }
      return null
    }

    /**
     * Calculate relative luminance (WCAG formula)
     * Returns value between 0 (black) and 1 (white)
     */
    const getLuminance = (r: number, g: number, b: number): number => {
      const [rs, gs, bs] = [r, g, b].map(val => {
        val = val / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    /**
     * Get the actual background color of an element, traversing up the DOM tree
     * Handles transparent backgrounds, SVG elements, and complex layouts
     */
    const getActualBackgroundColor = (element: Element | null): { r: number; g: number; b: number } | null => {
      if (!element) return null

      let current: Element | null = element
      let depth = 0
      const maxDepth = 15 // Increased depth for better detection

      while (current && current !== document.body && depth < maxDepth) {
        // Skip cursor elements
        if (current === outer || current === inner) {
          current = current.parentElement
          depth++
          continue
        }

        const styles = window.getComputedStyle(current)
        const bgColor = styles.backgroundColor
        const bgImage = styles.backgroundImage

        // Parse RGB color
        const rgb = parseRGB(bgColor)
        if (rgb && (rgb.r !== 0 || rgb.g !== 0 || rgb.b !== 0 || bgColor.includes('255'))) {
          // Check if it's not fully transparent
          const alphaMatch = bgColor.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
          const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1
          
          if (alpha > 0.1) { // Only consider if alpha > 10%
            return rgb
          }
        }

        // Check for background images with brand color
        if (bgImage && bgImage !== 'none') {
          // Check if it's a gradient with brand color
          if (bgImage.includes('f51042') || 
              bgImage.includes('var(--color-primary)') ||
              bgImage.includes('245, 16, 66') ||
              bgImage.includes('rgb(245, 16, 66)')) {
            // Return brand color RGB
            return { r: 245, g: 16, b: 66 }
          }
        }

        // Check for brand color in CSS variables or classes
        const classList = Array.from(current.classList)
        const hasBrandClass = classList.some(cls => 
          cls.includes('bg-[var(--color-primary)]') ||
          cls.includes('bg-[var(--color-primary-dark)]') ||
          (cls.includes('bg-gradient') && classList.some(c => c.includes('primary'))) ||
          cls.includes('bg-primary')
        )

        if (hasBrandClass) {
          return { r: 245, g: 16, b: 66 }
        }

        // Check for specific sections (footer, pre-footer, FeaturedChefs section)
        const tagName = current.tagName.toLowerCase()
        const id = current.id || ''
        
        // Check if element itself has a white background (prioritize this)
        if (classList.some(c => c.includes('bg-white')) || 
            bgColor.includes('255, 255, 255') ||
            bgColor.includes('rgb(255, 255, 255)')) {
          const rgb = parseRGB(bgColor)
          if (rgb && rgb.r >= 250 && rgb.g >= 250 && rgb.b >= 250) {
            return rgb
          }
        }

        // Footer section
        if (id === 'contact' || tagName === 'footer' || 
            (current.closest && current.closest('footer'))) {
          // Check if it's the brand-colored part (newsletter section)
          const newsletterSection = current.closest?.('.bg-gradient-to-r')
          if (newsletterSection || 
              classList.some(c => c.includes('from-[var(--color-primary)]'))) {
            // But check if we're over a white element inside
            const whiteElement = current.closest?.('.bg-white')
            if (!whiteElement && !classList.some(c => c.includes('bg-white'))) {
              return { r: 245, g: 16, b: 66 }
            }
          }
        }

        // FeaturedChefs section (brand-colored)
        if (id === 'chefs' || 
            (current.closest && current.closest('#chefs'))) {
          // Check if we're over a white element (like the white card or CloverButton container)
          const whiteCard = current.closest?.('.bg-white')
          const whiteButton = current.closest?.('.bg-white.rounded-full')
          if (whiteCard || whiteButton || classList.some(c => c.includes('bg-white'))) {
            // We're over a white element, return white
            return { r: 255, g: 255, b: 255 }
          }
          // Check if parent section has brand color by checking computed style
          const section = current.closest?.('section')
          if (section) {
            const sectionStyles = window.getComputedStyle(section)
            const sectionBg = sectionStyles.backgroundColor
            const sectionRgb = parseRGB(sectionBg)
            if (sectionRgb && sectionRgb.r === 245 && sectionRgb.g === 16 && sectionRgb.b === 66) {
              return { r: 245, g: 16, b: 66 }
            }
          }
        }

        // AppPromo section (brand-colored)
        if (current.closest && current.closest('section.bg-gradient-to-b')) {
          const section = current.closest('section.bg-gradient-to-b')
          if (section && section.className.includes('from-[var(--color-primary)]')) {
            // Check if we're over a white element (like feature cards)
            const whiteElement = current.closest?.('.bg-white')
            if (whiteElement || classList.some(c => c.includes('bg-white'))) {
              const whiteRgb = parseRGB(bgColor)
              if (whiteRgb && whiteRgb.r >= 250) {
                return whiteRgb
              }
              return { r: 255, g: 255, b: 255 }
            }
            return { r: 245, g: 16, b: 66 }
          }
        }

        // Wave divider - check if it's the SVG path
        if (tagName === 'svg' || tagName === 'path' || current.closest?.('.wave-divider')) {
          // Wave divider uses brand color, but check parent for actual background
          const waveDivider = current.closest?.('.wave-divider')
          if (waveDivider) {
            const waveStyles = window.getComputedStyle(waveDivider)
            const waveBg = waveStyles.backgroundColor
            const waveRgb = parseRGB(waveBg)
            if (waveRgb) {
              return waveRgb
            }
            // Check if wave color is brand color
            if (waveStyles.color.includes('245, 16, 66') || 
                waveStyles.color.includes('var(--color-primary)')) {
              return { r: 245, g: 16, b: 66 }
            }
          }
        }

        current = current.parentElement
        depth++
      }

      // Default to white/cream background
      return { r: 255, g: 249, b: 245 }
    }

    /**
     * Determine if cursor should be white based on background color
     * Uses advanced contrast calculation for optimal visibility
     */
    const shouldUseWhite = (x: number, y: number): boolean => {
      const element = document.elementFromPoint(x, y)
      if (!element) return false

      const bgColor = getActualBackgroundColor(element)
      if (!bgColor) return false

      // Calculate luminance
      const luminance = getLuminance(bgColor.r, bgColor.g, bgColor.b)

      // If background is dark (luminance < 0.5), use white cursor
      // If background is light (luminance >= 0.5), use brand color cursor
      // But also check if it's specifically the brand color
      const isBrandColor = bgColor.r === 245 && bgColor.g === 16 && bgColor.b === 66
      
      if (isBrandColor) {
        // On brand color sections, always use white cursor for contrast
        return true
      }

      // For very light backgrounds, use brand color cursor
      if (luminance > 0.7) {
        return false
      }

      // For dark backgrounds, use white cursor
      if (luminance < 0.3) {
        return true
      }

      // For medium backgrounds, use brand color (more visible)
      return false
    }

    // Debounce function for color detection
    let colorCheckTimeout: number | null = null
    const debouncedColorCheck = (x: number, y: number) => {
      if (colorCheckTimeout !== null) {
        cancelAnimationFrame(colorCheckTimeout)
      }
      colorCheckTimeout = requestAnimationFrame(() => {
        const useWhite = shouldUseWhite(x, y)
        if (useWhite !== shouldUseWhiteCursor.current) {
          shouldUseWhiteCursor.current = useWhite
          updateCursorColors()
        }
      })
    }

    // Smooth animation loop with hardware acceleration
    const animate = () => {
      // Lerp positions - outer follows slower, inner follows faster
      // Using smaller values for smoother, more gradual following
      const outerLerp = 0.08  // Very smooth lag for outer
      const innerLerp = 0.25   // Faster but still smooth for inner
      const scaleLerp = 0.15   // Slightly faster for more responsive feel

      // Update outer position
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * outerLerp
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * outerLerp

      // Update inner position
      innerPos.current.x += (mouse.current.x - innerPos.current.x) * innerLerp
      innerPos.current.y += (mouse.current.y - innerPos.current.y) * innerLerp

      // Update scales smoothly
      outerScale.current += (targetOuterScale.current - outerScale.current) * scaleLerp
      innerScale.current += (targetInnerScale.current - innerScale.current) * scaleLerp

      // Check color and update cursor (debounced in mousemove, but also check here for smooth updates)
      debouncedColorCheck(mouse.current.x, mouse.current.y)

      // Apply positions using transform3d for hardware acceleration
      // This prevents pixelation and ensures smooth rendering
      outer.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) translate(-50%, -50%) scale3d(${outerScale.current}, ${outerScale.current}, 1)`
      inner.style.transform = `translate3d(${innerPos.current.x}px, ${innerPos.current.y}px, 0) translate(-50%, -50%) scale3d(${innerScale.current}, ${innerScale.current}, 1)`

      rafId.current = requestAnimationFrame(animate)
    }

    // Update cursor colors based on context
    const updateCursorColors = () => {
      if (!outer || !inner) return
      
      if (shouldUseWhiteCursor.current) {
        // White/cream cursor on brand sections and dark backgrounds for contrast
        outer.style.borderColor = CURSOR_WHITE_LIGHT
        outer.style.backgroundColor = isHovering.current ? CURSOR_WHITE_FILL : 'transparent'
        outer.style.filter = 'drop-shadow(0 0 8px rgba(255, 252, 250, 0.3))'
        inner.style.backgroundColor = CURSOR_WHITE
        inner.style.filter = 'drop-shadow(0 0 4px rgba(255, 252, 250, 0.5))'
      } else {
        // Brand color cursor on light sections
        outer.style.borderColor = PRIMARY_LIGHT
        outer.style.backgroundColor = isHovering.current ? PRIMARY_FILL : 'transparent'
        outer.style.filter = 'drop-shadow(0 0 8px rgba(245, 16, 66, 0.2))'
        inner.style.backgroundColor = PRIMARY_COLOR
        inner.style.filter = 'drop-shadow(0 0 4px rgba(245, 16, 66, 0.4))'
      }
    }

    // Initialize cursor colors
    updateCursorColors()

    // Start animation
    rafId.current = requestAnimationFrame(animate)

    // Mouse move - update target position AND show cursor on first move
    // This ensures cursor only appears when user actually interacts
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      
      // Show cursor on FIRST mouse movement only
      // This prevents the cursor from appearing at center during preloader
      if (!hasMouseMoved.current) {
        hasMouseMoved.current = true
        // Immediately snap to mouse position on first move to avoid animation from -100,-100
        outerPos.current = { x: e.clientX, y: e.clientY }
        innerPos.current = { x: e.clientX, y: e.clientY }
        // Now show the cursor
        outer.style.opacity = '1'
        inner.style.opacity = '1'
      }

      // Check color on mouse move (debounced)
      debouncedColorCheck(e.clientX, e.clientY)
    }

    // Mouse enter window - show cursors (only if mouse has moved before)
    const onMouseEnter = () => {
      if (hasMouseMoved.current) {
        outer.style.opacity = '1'
        inner.style.opacity = '1'
      }
    }

    // Mouse leave window - hide cursors
    const onMouseLeave = () => {
      outer.style.opacity = '0'
      inner.style.opacity = '0'
    }

    // Mouse down - compress with premium feel
    const onMouseDown = () => {
      targetOuterScale.current = isHovering.current ? 1.4 : 0.9
      targetInnerScale.current = 0.75
    }

    // Mouse up - expand back smoothly
    const onMouseUp = () => {
      targetOuterScale.current = isHovering.current ? 1.6 : 1
      targetInnerScale.current = isHovering.current ? 0.65 : 1
    }

    // Hover handlers with premium feel
    const onHoverEnter = () => {
      isHovering.current = true
      targetOuterScale.current = 1.6  // Slightly larger for more premium feel
      targetInnerScale.current = 0.65  // Slightly smaller inner for better contrast
      
      updateCursorColors()
    }

    const onHoverLeave = () => {
      isHovering.current = false
      targetOuterScale.current = 1
      targetInnerScale.current = 1
      
      updateCursorColors()
    }

    // Attach hover listeners to interactive elements
    const attachHoverListeners = () => {
      const selector = 'a, button, input, textarea, select, [role="button"], ' +
        '.card-hover, .btn-primary, .nav-link, .nav-cta, .hero-cta, ' +
        '.chef-card, .cuisine-card, .step-card, .feature-card, ' +
        '.stat-item, .feature-item, .testimonial-card, .floating-food'

      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        el.addEventListener('mouseenter', onHoverEnter)
        el.addEventListener('mouseleave', onHoverLeave)
      })
      return elements
    }

    let interactiveElements = attachHoverListeners()

    // Watch for DOM changes to reattach listeners
    const observer = new MutationObserver(() => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter)
        el.removeEventListener('mouseleave', onHoverLeave)
      })
      interactiveElements = attachHoverListeners()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Add global listeners
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)

    // NOTE: We intentionally DO NOT show cursors on a timeout
    // The cursor will only appear when the user actually moves their mouse
    // This prevents the cursor from appearing at screen center during the preloader
    // when the user's mouse pointer is not yet on the screen

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId.current)
      observer.disconnect()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter)
        el.removeEventListener('mouseleave', onHoverLeave)
      })
    }
  }, [])

  // Don't render on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null
  }

  return (
    <>
      {/* Outer circle - follows with smooth lag, premium styling */}
      <div
        ref={outerRef}
        style={{
          position: 'fixed',
          width: '48px',
          height: '48px',
          border: `2px solid ${PRIMARY_LIGHT}`,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%) scale3d(1, 1, 1)',
          filter: 'drop-shadow(0 0 8px rgba(245, 16, 66, 0.2))',
        }}
      />

      {/* Inner dot - follows more closely, premium styling */}
      <div
        ref={innerRef}
        style={{
          position: 'fixed',
          width: '10px',
          height: '10px',
          backgroundColor: PRIMARY_COLOR,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: 0,
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%) scale3d(1, 1, 1)',
          filter: 'drop-shadow(0 0 4px rgba(245, 16, 66, 0.4))',
        }}
      />

      {/* 
        NOTE: We intentionally DO NOT hide the native cursor.
        The custom cursor elements follow the native cursor with a smooth lag,
        creating a layered effect similar to neoleaf.bytetown.agency
      */}
    </>
  )
}
