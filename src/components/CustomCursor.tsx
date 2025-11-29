import { useEffect, useRef } from 'react'

// Brand colors
const PRIMARY_COLOR = '#f51042'
const PRIMARY_LIGHT = 'rgba(245, 16, 66, 0.35)'
const PRIMARY_FILL = 'rgba(245, 16, 66, 0.08)'

/**
 * CustomCursor Component
 * 
 * Implementation based on best practices from:
 * - Medium: "Cool Custom Cursors With React + Framer Motion" by Levon Arakelyan
 * - Motion.dev documentation
 * 
 * Key fix for preloader visibility issue:
 * - Initial position is set OFF-SCREEN (-100, -100) instead of center
 * - Cursor only becomes visible on FIRST mouse movement
 * - This prevents the cursor from appearing in the center during preloader
 *   when the user's mouse is not yet on the screen
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
    // Reference: Medium article recommends { x: -100, y: -100 } for initial state
    mouse.current = { x: -100, y: -100 }
    outerPos.current = { x: -100, y: -100 }
    innerPos.current = { x: -100, y: -100 }

    // Apply initial positions using left/top (NOT transform for position)
    outer.style.left = `${outerPos.current.x}px`
    outer.style.top = `${outerPos.current.y}px`
    inner.style.left = `${innerPos.current.x}px`
    inner.style.top = `${innerPos.current.y}px`

    // Smooth animation loop
    const animate = () => {
      // Lerp positions - outer follows slower, inner follows faster
      // Using smaller values for smoother, more gradual following
      const outerLerp = 0.08  // Very smooth lag for outer
      const innerLerp = 0.25   // Faster but still smooth for inner
      const scaleLerp = 0.12   // Smooth scale transitions

      // Update outer position
      outerPos.current.x += (mouse.current.x - outerPos.current.x) * outerLerp
      outerPos.current.y += (mouse.current.y - outerPos.current.y) * outerLerp

      // Update inner position
      innerPos.current.x += (mouse.current.x - innerPos.current.x) * innerLerp
      innerPos.current.y += (mouse.current.y - innerPos.current.y) * innerLerp

      // Update scales smoothly
      outerScale.current += (targetOuterScale.current - outerScale.current) * scaleLerp
      innerScale.current += (targetInnerScale.current - innerScale.current) * scaleLerp

      // Apply positions using left/top (keeps scale separate)
      outer.style.left = `${outerPos.current.x}px`
      outer.style.top = `${outerPos.current.y}px`
      inner.style.left = `${innerPos.current.x}px`
      inner.style.top = `${innerPos.current.y}px`

      // Apply scale via transform (separate from position)
      outer.style.transform = `translate(-50%, -50%) scale(${outerScale.current})`
      inner.style.transform = `translate(-50%, -50%) scale(${innerScale.current})`

      rafId.current = requestAnimationFrame(animate)
    }

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
        outer.style.left = `${e.clientX}px`
        outer.style.top = `${e.clientY}px`
        inner.style.left = `${e.clientX}px`
        inner.style.top = `${e.clientY}px`
        // Now show the cursor
        outer.style.opacity = '1'
        inner.style.opacity = '1'
      }
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

    // Mouse down - compress
    const onMouseDown = () => {
      targetOuterScale.current = isHovering.current ? 1.3 : 0.85
      targetInnerScale.current = 0.7
    }

    // Mouse up - expand back
    const onMouseUp = () => {
      targetOuterScale.current = isHovering.current ? 1.5 : 1
      targetInnerScale.current = isHovering.current ? 0.7 : 1
    }

    // Hover handlers
    const onHoverEnter = () => {
      isHovering.current = true
      targetOuterScale.current = 1.5
      targetInnerScale.current = 0.7
      
      // Add fill color
      outer.style.backgroundColor = PRIMARY_FILL
      outer.style.borderColor = PRIMARY_LIGHT
    }

    const onHoverLeave = () => {
      isHovering.current = false
      targetOuterScale.current = 1
      targetInnerScale.current = 1
      
      // Remove fill color
      outer.style.backgroundColor = 'transparent'
      outer.style.borderColor = PRIMARY_LIGHT
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
      {/* Outer circle - follows with smooth lag */}
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
          transition: 'opacity 0.3s ease, background-color 0.2s ease, border-color 0.2s ease',
          willChange: 'left, top, transform',
        }}
      />

      {/* Inner dot - follows more closely */}
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
          transition: 'opacity 0.3s ease',
          willChange: 'left, top, transform',
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
