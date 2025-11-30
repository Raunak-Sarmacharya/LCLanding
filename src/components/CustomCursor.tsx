import { useEffect, useRef, useCallback } from 'react'

/**
 * CustomCursor Component - Premium Edition v4 (On-Brand)
 * 
 * Award-winning techniques with WARM, ON-BRAND colors:
 * - Removed techy mix-blend-mode (created cold, off-brand cyan/black inversions)
 * - Uses harmonious brand colors: warm red + soft cream/butter
 * - Multi-point color sampling for robust edge detection
 * - Zone-based section detection using scroll position
 * - Smart hover detection to prevent blending
 * - Hardware-accelerated transforms (transform3d, will-change)
 * - Smooth spring-like animations with premium easing
 * - Elegant warm glows that match the food brand aesthetic
 * 
 * Color Philosophy (from luxury brand research):
 * - Light backgrounds: Warm primary red cursor (inviting, passionate)
 * - Dark backgrounds: Soft cream/butter cursor (warm, comforting)
 * - Consistent with LocalCooks brand: homemade, warm, premium feel
 */

// ============================================
// ON-BRAND COLOR PALETTE
// ============================================

// Primary brand red - warm, inviting, food-inspired
const PRIMARY_COLOR = '#f51042'
const PRIMARY_RGB = { r: 245, g: 16, b: 66 }
const PRIMARY_GLOW = 'rgba(245, 16, 66, 0.45)'
const PRIMARY_GLOW_STRONG = 'rgba(245, 16, 66, 0.55)'
const PRIMARY_GLOW_SUBTLE = 'rgba(245, 16, 66, 0.18)'

// Warm cream/butter - for use on dark backgrounds
// Using cream with a touch of warmth (not pure white which feels cold)
const CREAM_COLOR = '#FFFCFA'  // Warm white from brand
const CREAM_GLOW = 'rgba(255, 237, 213, 0.5)'  // Butter-tinted glow
const CREAM_GLOW_STRONG = 'rgba(255, 237, 213, 0.6)'
const CREAM_GLOW_SUBTLE = 'rgba(255, 249, 245, 0.25)'

// Default cream background color (used as fallback)
const CREAM_RGB = { r: 255, g: 249, b: 245 }

export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  
  // Position refs - initialized OFF-SCREEN
  const mouse = useRef({ x: -100, y: -100 })
  const outerPos = useRef({ x: -100, y: -100 })
  const innerPos = useRef({ x: -100, y: -100 })
  
  // Scale refs
  const outerScale = useRef(1)
  const innerScale = useRef(1)
  const targetOuterScale = useRef(1)
  const targetInnerScale = useRef(1)
  
  // State refs
  const isHovering = useRef(false)
  const shouldUseWarmCursor = useRef(false) // true = cream cursor on dark bg, false = red on light bg
  const rafId = useRef<number>(0)
  const hasMouseMoved = useRef(false)
  const lastColorCheck = useRef(0)
  const colorCheckThrottle = 16 // ~60fps color checking

  // Cache for section boundaries (updated on scroll/resize)
  const sectionBoundsCache = useRef<Map<string, DOMRect>>(new Map())
  const lastScrollY = useRef(0)

  /**
   * Parse RGB color string to RGB values
   */
  const parseRGB = useCallback((rgbString: string): { r: number; g: number; b: number } | null => {
    const match = rgbString.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      }
    }
    return null
  }, [])

  /**
   * Calculate relative luminance (WCAG formula)
   */
  const getLuminance = useCallback((r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(val => {
      val = val / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }, [])

  /**
   * Check if color is close to brand red
   */
  const isBrandColor = useCallback((r: number, g: number, b: number): boolean => {
    const tolerance = 50
    return (
      Math.abs(r - PRIMARY_RGB.r) < tolerance &&
      Math.abs(g - PRIMARY_RGB.g) < tolerance &&
      Math.abs(b - PRIMARY_RGB.b) < tolerance
    )
  }, [])

  /**
   * Check if color is light (cream/white)
   */
  const isLightColor = useCallback((r: number, g: number, b: number): boolean => {
    return r > 220 && g > 220 && b > 200
  }, [])

  /**
   * Get color at a specific point with better detection
   */
  const getColorAtPoint = useCallback((x: number, y: number, outer: HTMLDivElement | null, inner: HTMLDivElement | null): { r: number; g: number; b: number } | null => {
    // Temporarily hide cursor elements
    if (outer) outer.style.visibility = 'hidden'
    if (inner) inner.style.visibility = 'hidden'
    
    const element = document.elementFromPoint(x, y)
    
    // Restore visibility
    if (outer) outer.style.visibility = 'visible'
    if (inner) inner.style.visibility = 'visible'
    
    if (!element) return null

    // Traverse up to find actual background
    let current: Element | null = element
    let depth = 0
    const maxDepth = 20

    while (current && current !== document.body && depth < maxDepth) {
      const styles = window.getComputedStyle(current)
      const bgColor = styles.backgroundColor
      const bgImage = styles.backgroundImage

      // Check for background image with brand color
      if (bgImage && bgImage !== 'none') {
        if (bgImage.includes('f51042') || 
            bgImage.includes('245, 16, 66') ||
            bgImage.includes('var(--color-primary)')) {
          return PRIMARY_RGB
        }
      }

      // Parse background color
      const rgb = parseRGB(bgColor)
      if (rgb) {
        // Check alpha
        const alphaMatch = bgColor.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1

        if (alpha > 0.1) {
          // Not fully transparent
          if (rgb.r !== 0 || rgb.g !== 0 || rgb.b !== 0 || bgColor.includes('255')) {
            return rgb
          }
        }
      }

      // Check for brand color classes
      const classList = Array.from(current.classList)
      const hasBrandBg = classList.some(cls => 
        cls.includes('bg-[var(--color-primary)]') ||
        cls.includes('from-[var(--color-primary)]') ||
        cls.includes('bg-gradient') && current?.className.includes('primary')
      )

      if (hasBrandBg) {
        return PRIMARY_RGB
      }

      current = current.parentElement
      depth++
    }

    return CREAM_RGB // Default fallback
  }, [parseRGB])

  /**
   * Multi-point color sampling - samples 5 points around cursor center
   */
  const getColorWithMultiSampling = useCallback((centerX: number, centerY: number, radius: number = 20): boolean => {
    const outer = outerRef.current
    const inner = innerRef.current

    // Sample 5 points: center + 4 cardinal directions
    const samplePoints = [
      { x: centerX, y: centerY }, // center
      { x: centerX, y: centerY - radius }, // top
      { x: centerX, y: centerY + radius }, // bottom
      { x: centerX - radius, y: centerY }, // left
      { x: centerX + radius, y: centerY }, // right
    ]

    let darkCount = 0
    let lightCount = 0

    for (const point of samplePoints) {
      const color = getColorAtPoint(point.x, point.y, outer, inner)
      if (color) {
        if (isBrandColor(color.r, color.g, color.b)) {
          darkCount++
        } else if (isLightColor(color.r, color.g, color.b)) {
          lightCount++
        } else {
          // Check luminance for other colors
          const luminance = getLuminance(color.r, color.g, color.b)
          if (luminance < 0.4) {
            darkCount++
          } else {
            lightCount++
          }
        }
      }
    }

    // Use majority voting - if more dark samples, use warm cream cursor
    return darkCount > lightCount
  }, [getColorAtPoint, isBrandColor, isLightColor, getLuminance])

  /**
   * Update section boundaries cache
   */
  const updateSectionBounds = useCallback(() => {
    const newCache = new Map<string, DOMRect>()
    
    // Find chefs section
    const chefsSection = document.getElementById('chefs')
    if (chefsSection) {
      newCache.set('chefs', chefsSection.getBoundingClientRect())
    }

    // Find wave dividers
    const waveDividers = document.querySelectorAll('.wave-divider')
    waveDividers.forEach((wave, index) => {
      newCache.set(`wave-${index}`, wave.getBoundingClientRect())
    })

    // Find app promo section
    const appPromo = document.querySelector('section.bg-gradient-to-b')
    if (appPromo) {
      newCache.set('app-promo', appPromo.getBoundingClientRect())
    }

    // Find footer brand bar
    const footerBar = document.querySelector('footer .bg-\\[var\\(--color-primary\\)\\]')
    if (footerBar) {
      newCache.set('footer-bar', footerBar.getBoundingClientRect())
    }

    sectionBoundsCache.current = newCache
  }, [])

  /**
   * Fast zone-based color check using cached section bounds
   */
  const checkZoneBasedColor = useCallback((x: number, y: number): boolean | null => {
    const cache = sectionBoundsCache.current
    
    // Check chefs section
    const chefsBounds = cache.get('chefs')
    if (chefsBounds && 
        y >= chefsBounds.top && 
        y <= chefsBounds.bottom &&
        x >= chefsBounds.left &&
        x <= chefsBounds.right) {
      
      // Inside chefs section - but check for white cards
      const element = document.elementFromPoint(x, y)
      if (element) {
        const whiteCard = element.closest('.bg-white')
        if (whiteCard) {
          return false // Light background, use brand red cursor
        }
      }
      return true // Dark/brand background, use warm cream cursor
    }

    // Check app promo section
    const appPromoBounds = cache.get('app-promo')
    if (appPromoBounds &&
        y >= appPromoBounds.top &&
        y <= appPromoBounds.bottom) {
      
      // Check for white cards inside
      const element = document.elementFromPoint(x, y)
      if (element) {
        const whiteElement = element.closest('.bg-white')
        if (whiteElement) {
          return false
        }
      }
      return true
    }

    // Check footer bar
    const footerBarBounds = cache.get('footer-bar')
    if (footerBarBounds &&
        y >= footerBarBounds.top &&
        y <= footerBarBounds.bottom) {
      return true
    }

    // Check wave dividers (tricky areas)
    for (const [key, bounds] of cache.entries()) {
      if (key.startsWith('wave-')) {
        if (y >= bounds.top && y <= bounds.bottom) {
          // We're in a wave divider area - check data attribute for direction
          const element = document.elementFromPoint(x, y)
          if (element) {
            const waveDivider = element.closest('.wave-divider')
            if (waveDivider) {
              const zone = waveDivider.getAttribute('data-cursor-zone')
              if (zone === 'transition-to-dark') {
                // Top part of wave going into dark section
                const waveRect = waveDivider.getBoundingClientRect()
                const relativeY = (y - waveRect.top) / waveRect.height
                return relativeY > 0.4
              } else if (zone === 'transition-to-light') {
                // Bottom part of wave going into light section
                const waveRect = waveDivider.getBoundingClientRect()
                const relativeY = (y - waveRect.top) / waveRect.height
                return relativeY < 0.6
              }
            }
          }
          return null // Fall back to multi-point sampling
        }
      }
    }

    return null // Use multi-point sampling for unknown areas
  }, [])

  /**
   * Main color detection with all techniques combined
   */
  const shouldUseWarm = useCallback((x: number, y: number): boolean => {
    // First try fast zone-based detection
    const zoneResult = checkZoneBasedColor(x, y)
    if (zoneResult !== null) {
      return zoneResult
    }

    // Fall back to multi-point sampling for edge cases
    return getColorWithMultiSampling(x, y, 24)
  }, [checkZoneBasedColor, getColorWithMultiSampling])

  useEffect(() => {
    // Skip on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return
    }

    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    // Initialize positions OFF-SCREEN
    mouse.current = { x: -100, y: -100 }
    outerPos.current = { x: -100, y: -100 }
    innerPos.current = { x: -100, y: -100 }

    // Initial section bounds cache
    updateSectionBounds()

    /**
     * Update cursor colors based on background - WARM ON-BRAND COLORS
     */
    const updateCursorColors = () => {
      if (!inner || !outer) return
      
      if (shouldUseWarmCursor.current) {
        // WARM CREAM cursor on dark/brand backgrounds
        // Creates cozy, inviting feel matching food brand
        inner.style.backgroundColor = CREAM_COLOR
        inner.style.boxShadow = isHovering.current 
          ? `0 0 16px ${CREAM_GLOW_STRONG}` 
          : `0 0 10px ${CREAM_GLOW}`
        outer.style.borderColor = CREAM_GLOW
        outer.style.boxShadow = isHovering.current 
          ? `0 0 24px ${CREAM_GLOW_SUBTLE}, inset 0 0 12px rgba(255, 237, 213, 0.08)` 
          : `0 0 14px ${CREAM_GLOW_SUBTLE}`
      } else {
        // WARM RED cursor on light backgrounds
        // Brand primary color - warm, passionate, food-inspired
        inner.style.backgroundColor = PRIMARY_COLOR
        inner.style.boxShadow = isHovering.current 
          ? `0 0 16px ${PRIMARY_GLOW_STRONG}` 
          : `0 0 10px ${PRIMARY_GLOW}`
        outer.style.borderColor = PRIMARY_GLOW
        outer.style.boxShadow = isHovering.current 
          ? `0 0 24px ${PRIMARY_GLOW_SUBTLE}, inset 0 0 12px rgba(245, 16, 66, 0.06)` 
          : `0 0 14px ${PRIMARY_GLOW_SUBTLE}`
      }
    }

    // Initialize colors
    updateCursorColors()

    /**
     * Smooth animation loop with hardware acceleration
     */
    const animate = () => {
      // Premium spring-like easing - different speeds create elegant trailing effect
      const outerLerp = 0.09  // Smooth lag for outer circle
      const innerLerp = 0.24   // Faster for inner dot - responsive feel
      const scaleLerp = 0.13   // Smooth scale transitions

      // Update positions with lerp
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * outerLerp
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * outerLerp

      innerPos.current.x += (mouse.current.x - innerPos.current.x) * innerLerp
      innerPos.current.y += (mouse.current.y - innerPos.current.y) * innerLerp

      // Update scales smoothly
      outerScale.current += (targetOuterScale.current - outerScale.current) * scaleLerp
      innerScale.current += (targetInnerScale.current - innerScale.current) * scaleLerp

      // Apply transforms with hardware acceleration
      outer.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0) translate(-50%, -50%) scale3d(${outerScale.current}, ${outerScale.current}, 1)`
      inner.style.transform = `translate3d(${innerPos.current.x}px, ${innerPos.current.y}px, 0) translate(-50%, -50%) scale3d(${innerScale.current}, ${innerScale.current}, 1)`

      rafId.current = requestAnimationFrame(animate)
    }

    // Start animation loop
    rafId.current = requestAnimationFrame(animate)

    /**
     * Throttled color check
     */
    const checkColor = (x: number, y: number, force: boolean = false) => {
      const now = performance.now()
      if (!force && now - lastColorCheck.current < colorCheckThrottle) return

      lastColorCheck.current = now
      
      const useWarm = shouldUseWarm(x, y)
      if (useWarm !== shouldUseWarmCursor.current) {
        shouldUseWarmCursor.current = useWarm
        updateCursorColors()
      }
    }

    /**
     * Mouse move handler
     */
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      // Show cursor on first movement
      if (!hasMouseMoved.current) {
        hasMouseMoved.current = true
        // Snap to position immediately
        outerPos.current = { x: e.clientX, y: e.clientY }
        innerPos.current = { x: e.clientX, y: e.clientY }
        // Show elements
        outer.style.opacity = '1'
        inner.style.opacity = '1'
      }

      // Check color
      checkColor(e.clientX, e.clientY)
    }

    /**
     * Scroll handler - update section bounds and recheck color
     */
    const onScroll = () => {
      // Debounce section bounds update
      if (Math.abs(window.scrollY - lastScrollY.current) > 50) {
        lastScrollY.current = window.scrollY
        updateSectionBounds()
      }
      // Force color check on scroll
      checkColor(mouse.current.x, mouse.current.y, true)
    }

    /**
     * Window visibility handlers
     */
    const onMouseEnter = () => {
      if (hasMouseMoved.current) {
        outer.style.opacity = '1'
        inner.style.opacity = '1'
      }
    }

    const onMouseLeave = () => {
      outer.style.opacity = '0'
      inner.style.opacity = '0'
    }

    /**
     * Mouse button handlers
     */
    const onMouseDown = () => {
      targetOuterScale.current = isHovering.current ? 1.35 : 0.88
      targetInnerScale.current = 0.7
    }

    const onMouseUp = () => {
      targetOuterScale.current = isHovering.current ? 1.5 : 1
      targetInnerScale.current = isHovering.current ? 0.6 : 1
    }

    /**
     * Hover handlers with premium feel
     */
    const onHoverEnter = (e: Event) => {
      isHovering.current = true
      targetOuterScale.current = 1.5
      targetInnerScale.current = 0.6

      // Smart background detection for hovered element
      const target = e.target as HTMLElement
      if (target) {
        const styles = window.getComputedStyle(target)
        const bgColor = styles.backgroundColor
        const rgb = parseRGB(bgColor)
        
        // Check the element's own background
        if (rgb && isBrandColor(rgb.r, rgb.g, rgb.b)) {
          // Hovering over brand-colored element (e.g., primary button)
          shouldUseWarmCursor.current = true
        } else if (rgb && isLightColor(rgb.r, rgb.g, rgb.b)) {
          // Hovering over light element - check parent context
          const darkParent = target.closest('#chefs, [class*="bg-gradient-to-b"], [class*="from-\\[var\\(--color-primary\\)\\]"]')
          if (darkParent && !target.closest('.bg-white')) {
            shouldUseWarmCursor.current = false
          } else if (target.closest('.bg-white') && darkParent) {
            shouldUseWarmCursor.current = false
          }
        } else {
          // Check for text color as a hint
          const textColor = styles.color
          const textRgb = parseRGB(textColor)
          if (textRgb && isLightColor(textRgb.r, textRgb.g, textRgb.b)) {
            const inDarkSection = target.closest('#chefs, .bg-\\[var\\(--color-primary\\)\\], [class*="bg-gradient"]')
            if (inDarkSection) {
              shouldUseWarmCursor.current = true
            }
          }
        }

        // Special case: buttons with specific classes
        if (target.classList.contains('btn-primary') || 
            target.closest('.btn-primary') ||
            target.classList.contains('hero-cta') ||
            target.closest('.hero-cta')) {
          const btn = target.classList.contains('btn-primary') || target.classList.contains('hero-cta')
            ? target 
            : target.closest('.btn-primary, .hero-cta') as HTMLElement
          if (btn) {
            const btnStyles = window.getComputedStyle(btn)
            const btnBg = btnStyles.backgroundColor
            const btnRgb = parseRGB(btnBg)
            if (btnRgb && isBrandColor(btnRgb.r, btnRgb.g, btnRgb.b)) {
              shouldUseWarmCursor.current = true
            } else if (btnRgb && isLightColor(btnRgb.r, btnRgb.g, btnRgb.b)) {
              shouldUseWarmCursor.current = false
            }
          }
        }
      }

      updateCursorColors()
    }

    const onHoverLeave = () => {
      isHovering.current = false
      targetOuterScale.current = 1
      targetInnerScale.current = 1
      
      // Re-check color based on current position
      checkColor(mouse.current.x, mouse.current.y, true)
      updateCursorColors()
    }

    /**
     * Attach hover listeners to interactive elements
     */
    const attachHoverListeners = () => {
      const selector = 'a, button, input, textarea, select, [role="button"], ' +
        '.card-hover, .btn-primary, .nav-link, .nav-cta, .hero-cta, ' +
        '.chef-card, .cuisine-card, .step-card, .feature-card, ' +
        '.stat-item, .feature-item, .testimonial-card, .floating-food, ' +
        '.clover-btn, .clover-link-btn, .app-feature-card, .app-floating-card'

      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        el.addEventListener('mouseenter', onHoverEnter)
        el.addEventListener('mouseleave', onHoverLeave)
      })
      return elements
    }

    let interactiveElements = attachHoverListeners()

    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter)
        el.removeEventListener('mouseleave', onHoverLeave)
      })
      interactiveElements = attachHoverListeners()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Add event listeners
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateSectionBounds)

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId.current)
      observer.disconnect()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateSectionBounds)
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onHoverEnter)
        el.removeEventListener('mouseleave', onHoverLeave)
      })
    }
  }, [shouldUseWarm, updateSectionBounds, parseRGB, isBrandColor, isLightColor])

  // Don't render on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null
  }

  return (
    <>
      {/* Outer circle - follows with smooth lag, warm premium styling */}
      <div
        ref={outerRef}
        style={{
          position: 'fixed',
          width: '48px',
          height: '48px',
          border: `2px solid ${PRIMARY_GLOW}`,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: 0,
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%) scale3d(1, 1, 1)',
          boxShadow: `0 0 14px ${PRIMARY_GLOW_SUBTLE}`,
        }}
      />

      {/* Inner dot - follows more closely, warm premium styling */}
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
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%) scale3d(1, 1, 1)',
          boxShadow: `0 0 10px ${PRIMARY_GLOW}`,
        }}
      />
    </>
  )
}
