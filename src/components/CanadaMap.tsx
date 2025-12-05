import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ViewBox configurations - Canada map coordinates
// Full view: zoomed out to show bottom borders (Alberta, Saskatchewan, Manitoba, Ontario, Quebec)
const FULL_CANADA_VIEW = { x: 40, y: 260, w: 750, h: 750 }

// Newfoundland zoomed view - centered on the island (not Labrador)
// The island is roughly at x: 730-790, y: 870-950
const NEWFOUNDLAND_VIEW = { x: 740, y: 900, w: 60, h: 80 }

// ============================================================================
// ST. JOHN'S MARKER POSITION - EDIT HERE TO ADJUST ON ALL SCREEN SIZES
// ============================================================================
// These are SVG coordinates for St. John's location on the Newfoundland map.
// Increase x to move RIGHT, decrease x to move LEFT
// Increase y to move DOWN, decrease y to move UP
// The marker should be at the eastern tip of the Avalon Peninsula (rightmost point)
const ST_JOHNS_COORDS = { x: 790, y: 958 }

// Helper function to calculate marker position accounting for SVG preserveAspectRatio
function calculateMarkerPosition(
  _svgElement: SVGSVGElement,
  containerElement: HTMLDivElement,
  viewBox: { x: number; y: number; w: number; h: number },
  targetCoords: { x: number; y: number }
): { x: number; y: number } {
  // Get the actual rendered dimensions of the container
  const containerRect = containerElement.getBoundingClientRect()
  
  // Calculate the aspect ratios
  const viewBoxAspect = viewBox.w / viewBox.h
  const containerAspect = containerRect.width / containerRect.height
  
  // Determine the actual rendered size and offset due to preserveAspectRatio="xMidYMid meet"
  let renderedWidth: number, renderedHeight: number
  let offsetX = 0, offsetY = 0
  
  if (containerAspect > viewBoxAspect) {
    // Container is wider than viewBox - SVG is height-constrained
    renderedHeight = containerRect.height
    renderedWidth = renderedHeight * viewBoxAspect
    offsetX = (containerRect.width - renderedWidth) / 2
  } else {
    // Container is taller than viewBox - SVG is width-constrained
    renderedWidth = containerRect.width
    renderedHeight = renderedWidth / viewBoxAspect
    offsetY = (containerRect.height - renderedHeight) / 2
  }
  
  // Calculate the position of the target within the viewBox (0-1 range)
  const normalizedX = (targetCoords.x - viewBox.x) / viewBox.w
  const normalizedY = (targetCoords.y - viewBox.y) / viewBox.h
  
  // Calculate the actual pixel position within the container
  const pixelX = offsetX + (normalizedX * renderedWidth)
  const pixelY = offsetY + (normalizedY * renderedHeight)
  
  // Convert to percentage of container
  const percentX = (pixelX / containerRect.width) * 100
  const percentY = (pixelY / containerRect.height) * 100
  
  return { x: percentX, y: percentY }
}

export default function CanadaMap() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  
  // Text state refs for phase 1, 2, 3
  const text1Ref = useRef<HTMLDivElement>(null)
  const text2Ref = useRef<HTMLDivElement>(null)
  const text3Ref = useRef<HTMLDivElement>(null)
  
  const [isReady, setIsReady] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewBoxRef = useRef({ ...FULL_CANADA_VIEW })

  // Load SVG first
  useEffect(() => {
    const loadSVG = async () => {
      if (!svgContainerRef.current) return
      
      try {
        const response = await fetch('/canada.svg')
        const svgText = await response.text()
        
        svgContainerRef.current.innerHTML = svgText
        
        const svg = svgContainerRef.current.querySelector('svg')
        if (!svg) return

        svgRef.current = svg

        // Configure SVG for display
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.display = 'block'
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
        
        // Set initial viewBox to show all of Canada
        svg.setAttribute('viewBox', `${FULL_CANADA_VIEW.x} ${FULL_CANADA_VIEW.y} ${FULL_CANADA_VIEW.w} ${FULL_CANADA_VIEW.h}`)
        
        // Style all province paths - keep them uniformly muted initially
        svg.querySelectorAll('path').forEach(path => {
          path.setAttribute('fill', 'none')
          path.setAttribute('stroke', '#f51042')
          path.setAttribute('stroke-width', '1.5')
          path.setAttribute('opacity', '1.5')
        })

        // Highlight ONLY the Newfoundland island path (CA-NL includes both island and Labrador)
        // We'll highlight it slightly more than others
        const nfPath = svg.querySelector('#CA-NL') as SVGPathElement
        if (nfPath) {
          nfPath.setAttribute('opacity', '0.8')
        }

        // Mark as ready after SVG is loaded
        setIsReady(true)
      } catch (err) {
        console.error('Failed to load SVG:', err)
      }
    }

    loadSVG()
  }, [])

  // Initialize GSAP after SVG is loaded
  useEffect(() => {
    if (!isReady || !sectionRef.current || !containerRef.current || !svgRef.current) return

    const svg = svgRef.current
    
    // Reset viewBox state
    viewBoxRef.current = { ...FULL_CANADA_VIEW }
    svg.setAttribute('viewBox', `${FULL_CANADA_VIEW.x} ${FULL_CANADA_VIEW.y} ${FULL_CANADA_VIEW.w} ${FULL_CANADA_VIEW.h}`)

    // Get all province paths and Newfoundland path for muting animation
    const allPaths = svg.querySelectorAll('path')
    const nfPath = svg.querySelector('#CA-NL') as SVGPathElement

    // Create GSAP context
    const ctx = gsap.context(() => {
      // Set initial states for UI elements
      gsap.set(markerRef.current, { autoAlpha: 0, scale: 0 })
      gsap.set(labelRef.current, { autoAlpha: 0, y: 20 })
      gsap.set(statsRef.current, { autoAlpha: 0, y: 30 })
      
      // Set initial states for text phases
      gsap.set(text1Ref.current, { autoAlpha: 1 })
      gsap.set(text2Ref.current, { autoAlpha: 0, y: 20 })
      gsap.set(text3Ref.current, { autoAlpha: 0, y: 20 })

      // Define EVENLY DISTRIBUTED snap points for balanced phase transitions
      // Phase 1: 0 (Canada overview)
      // Phase 2: 0.5 (Currently Serving - mid zoom) - CENTERED for equal scroll distance both ways
      // Phase 3: 1.0 (St. John's fully zoomed)
      // This ensures: 0→0.5 = 50% scroll, 0.5→1 = 50% scroll (SYMMETRIC!)
      const snapPoints = [0, 0.5, 1]

      // Create main timeline with ScrollTrigger and balanced snap behavior
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=300%', // Optimized scroll distance for 3 phases
          scrub: 0.8, // Slightly higher scrub for smoother animation
          pin: containerRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true, // Recalculate on resize for responsive behavior
          snap: {
            snapTo: snapPoints, // Evenly distributed for balanced transitions
            duration: { min: 0.3, max: 0.8 }, // Smooth snap animation
            delay: 0.15, // Increased delay to prevent jitter during direction changes
            ease: 'power3.out', // Smoother easing for premium feel
            directional: true, // Snap in scroll direction
          },
        }
      })

      // ========================================
      // PHASE 1: Canada Overview (progress 0)
      // ========================================
      tl.addLabel('canada', 0)

      // Zoom animation spans from 0 to 0.85 (completing just before phase 3 UI fully appears)
      tl.to(viewBoxRef.current, {
        x: NEWFOUNDLAND_VIEW.x,
        y: NEWFOUNDLAND_VIEW.y,
        w: NEWFOUNDLAND_VIEW.w,
        h: NEWFOUNDLAND_VIEW.h,
        duration: 0.85,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (!svg || !svgContainerRef.current) return
          
          const vb = viewBoxRef.current
          svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`)
          
          // Calculate zoom progress (0 to 1)
          const zoomProgress = (FULL_CANADA_VIEW.w - vb.w) / (FULL_CANADA_VIEW.w - NEWFOUNDLAND_VIEW.w)

          // Update marker position using accurate calculation that accounts for aspect ratio
          if (markerRef.current && svgContainerRef.current) {
            const position = calculateMarkerPosition(
              svg,
              svgContainerRef.current,
              vb,
              ST_JOHNS_COORDS
            )
            markerRef.current.style.left = `${position.x}%`
            markerRef.current.style.top = `${position.y}%`
          }

          // ========================================
          // STROKE & OPACITY LOGIC - Progressive reveal
          // ========================================
          
          // PHASE 1 (0-40% zoom): Keep map fully vivid - no changes
          if (zoomProgress <= 0.4) {
            allPaths.forEach(path => {
              path.setAttribute('opacity', '1')
              path.setAttribute('stroke-width', '1.5')
            })
          }
          // PHASE 2 (40-70% zoom): Start fading other provinces slightly
          else if (zoomProgress <= 0.7) {
            const fadeProgress = (zoomProgress - 0.4) / 0.3
            allPaths.forEach(path => {
              if (path.id !== 'CA-NL') {
                const opacity = 1 - (fadeProgress * 0.3)
                const stroke = 1.5 - (fadeProgress * 0.5)
                path.setAttribute('opacity', `${opacity}`)
                path.setAttribute('stroke-width', `${stroke}`)
              } else {
                path.setAttribute('opacity', '1')
                path.setAttribute('stroke-width', '1.5')
              }
            })
          }
          // PHASE 3 (70-100% zoom): Mute other provinces, Newfoundland stays vivid
          else {
            const muteProgress = (zoomProgress - 0.7) / 0.3
            allPaths.forEach(path => {
              if (path.id !== 'CA-NL') {
                const opacity = 0.7 - (muteProgress * 0.4)
                const stroke = 1.0 - (muteProgress * 0.6)
                path.setAttribute('opacity', `${Math.max(0.3, opacity)}`)
                path.setAttribute('stroke-width', `${Math.max(0.3, stroke)}`)
              }
            })
            if (nfPath) {
              nfPath.setAttribute('opacity', '1')
              nfPath.setAttribute('stroke-width', `${0.5 + muteProgress * 0.3}`)
            }
          }
        }
      }, 0)

      // ========================================
      // TRANSITION TO PHASE 2: Currently Serving (snap point at 0.5)
      // ========================================
      
      // Phase 1 text fades out before phase 2 snap point
      tl.to(text1Ref.current, {
        autoAlpha: 0,
        y: -30,
        duration: 0.1,
        ease: 'power2.in'
      }, 0.30)

      // Hide scroll hint early
      tl.to(scrollHintRef.current, {
        autoAlpha: 0,
        duration: 0.1,
      }, 0.30)

      // Add label for Phase 2 snap point (CENTERED at 0.5 for symmetry)
      tl.addLabel('serving', 0.5)

      // Phase 2 text fades in just before snap point for seamless transition
      tl.to(text2Ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.12,
        ease: 'power2.out'
      }, 0.42)

      // Show scroll hint again in Phase 2 - appears with Phase 2 text
      tl.to(scrollHintRef.current, {
        autoAlpha: 1,
        duration: 0.12,
        ease: 'power2.out'
      }, 0.42)

      // ========================================
      // TRANSITION TO PHASE 3: Live in St. John's (snap point at 1.0)
      // ========================================
      // IMPORTANT: Timing mirrors Phase 1→2 transition for consistent feel
      // Phase 1→2: fade out at 0.30 (ends ~0.40), fade in at 0.42 (gap: 0.02)
      // Phase 2→3: fade out at 0.64 (ends ~0.74), fade in at 0.76 (gap: 0.02)

      // Phase 2 text fades out - earlier for breathing room
      tl.to(text2Ref.current, {
        autoAlpha: 0,
        y: -30,
        duration: 0.1,
        ease: 'power2.in'
      }, 0.64)

      // Hide scroll hint when Phase 2 ends - before Phase 3 appears
      tl.to(scrollHintRef.current, {
        autoAlpha: 0,
        duration: 0.1,
        ease: 'power2.in'
      }, 0.64)

      // Phase 3 text fades in - after breathing room gap
      tl.to(text3Ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.12,
        ease: 'power2.out'
      }, 0.76)

      // Show marker with pop effect - staggered after text
      tl.to(markerRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.12,
        ease: 'back.out(2)'
      }, 0.80)

      // Show location label - staggered
      tl.to(labelRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.1,
        ease: 'power2.out'
      }, 0.84)

      // Show stats bar - finishes by 0.96 so it's fully visible at snap to 1.0
      tl.to(statsRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.1,
        ease: 'power2.out'
      }, 0.88)

      // Add final label at exactly 1.0 for the snap point
      tl.addLabel('end', 1.0)

      // Ensure timeline reaches exactly 1.0 with a brief hold
      tl.to({}, { duration: 0.02 }, 0.98)

    }, sectionRef)

    // Handle window resize to refresh ScrollTrigger and recalculate marker position
    const handleResize = () => {
      ScrollTrigger.refresh()
      
      // Recalculate marker position on resize for responsive accuracy
      if (svg && svgContainerRef.current && markerRef.current) {
        const position = calculateMarkerPosition(
          svg,
          svgContainerRef.current,
          viewBoxRef.current,
          ST_JOHNS_COORDS
        )
        markerRef.current.style.left = `${position.x}%`
        markerRef.current.style.top = `${position.y}%`
      }
    }

    // Debounced resize for performance
    let resizeTimeout: ReturnType<typeof setTimeout>
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize)

    return () => {
      ctx.revert()
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [isReady])

  return (
    <section 
      ref={sectionRef}
      id="location"
      className="relative bg-[var(--color-cream)]"
      style={{ minHeight: '300vh' }}
    >
      <div 
        ref={containerRef}
        className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Subtle dot pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#f51042 0.8px, transparent 0.8px)',
            backgroundSize: '28px 28px'
          }}
        />

        {/* Dynamic Section Headers - Three phases with proper padding from nav */}
        {/* Mobile: more clearance from navbar (top-32), sm+ uses standard spacing */}
        <div className="absolute top-32 sm:top-20 md:top-20 lg:top-20 xl:top-24 left-0 right-0 text-center z-10 px-2 sm:px-4 max-w-full overflow-x-clip box-border">
          {/* Phase 1: Full Canada view */}
          <div ref={text1Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs sm:text-[10px] md:text-xs text-[#f51042] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2 md:mb-3">
              Where We Are
            </p>
            <h2 className="font-heading text-4xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-[var(--color-charcoal)]">
              Live in <span className="font-display text-[#f51042]">Canada</span>
            </h2>
            <p className="font-heading text-base sm:text-sm md:text-lg lg:text-xl xl:text-2xl text-[var(--color-charcoal)]/60 mt-1 sm:mt-2 md:mt-3">
              One community at a time
            </p>
          </div>

          {/* Phase 2: Transitioning zoom */}
          <div ref={text2Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs sm:text-[10px] md:text-xs text-[#f51042] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2 md:mb-3">
              Right Now
            </p>
            <h2 className="font-heading text-4xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-[var(--color-charcoal)]">
              Currently Serving
            </h2>
            <p className="font-display text-xl sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl text-[#f51042] mt-1 sm:mt-2">
              St. John's, Newfoundland
            </p>
          </div>

          {/* Phase 3: Final zoomed state */}
          <div ref={text3Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs sm:text-[10px] md:text-xs text-[#f51042] uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2 md:mb-3">
              Live Today
            </p>
            <h2 className="font-heading text-4xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-[var(--color-charcoal)]">
              Live in <span className="font-display text-[#f51042]">St. John's</span>
            </h2>
            <p className="font-heading text-base sm:text-sm md:text-lg lg:text-xl xl:text-2xl text-[var(--color-charcoal)]/60 mt-1 sm:mt-2 md:mt-3">
              Growing what's next for local food
            </p>
          </div>
        </div>

        {/* Map container - balanced spacing: tight on mobile, proper clearance on larger screens */}
        {/* Mobile: minimal margin for compact layout (map closer to title), Laptop/Desktop: more clearance for header */}
        <div className="relative w-full max-w-5xl h-[38vh] sm:h-[42vh] md:h-[45vh] lg:h-[48vh] xl:h-[50vh] mx-auto px-4 mt-2 sm:mt-20 md:mt-28 lg:mt-36 xl:mt-40">
          {/* SVG container */}
          <div 
            ref={svgContainerRef}
            className="w-full h-full flex items-center justify-center"
            style={{ minHeight: '280px' }}
          />
          
          {/* Location marker - positioned dynamically via JS */}
          <div 
            ref={markerRef}
            className="absolute z-20 pointer-events-none"
            style={{ 
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%'
            }}
          >
            <div className="relative">
              {/* Outer pulse */}
              <div 
                className="absolute -inset-5 rounded-full border-2 border-[#f51042]"
                style={{ animation: 'marker-pulse 2s ease-out infinite' }}
              />
              {/* Middle pulse */}
              <div 
                className="absolute -inset-3 rounded-full border border-[#f51042] opacity-70"
                style={{ animation: 'marker-pulse 2s ease-out infinite 0.4s' }}
              />
              {/* Center dot */}
              <div className="w-5 h-5 bg-[#f51042] rounded-full border-[3px] border-white shadow-xl relative z-10" />
            </div>
          </div>
        </div>

        {/* Location label card - visible on all screens including mobile */}
        <div 
          ref={labelRef}
          className="absolute z-30 right-2 sm:right-2 md:right-4 lg:right-[5%] top-[32%] sm:top-[28%] md:top-[30%] lg:top-[32%]"
        >
          <div className="bg-white rounded-xl sm:rounded-xl md:rounded-2xl shadow-lg sm:shadow-xl md:shadow-2xl px-3 sm:px-3 md:px-4 lg:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 border border-gray-100/50">
            <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
              <span className="w-2 h-2 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-[#f51042] rounded-full animate-pulse" />
              <span className="font-mono text-[8px] sm:text-[8px] md:text-[10px] lg:text-[11px] text-[#f51042] uppercase tracking-wider font-medium">Live Now</span>
            </div>
            <div className="font-display text-base sm:text-lg md:text-2xl lg:text-3xl text-[#f51042] mb-0.5">St. John's</div>
            <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-500 font-medium leading-tight">Newfoundland & Labrador</div>
          </div>
        </div>

        {/* Stats bar - positioned closer to map on mobile (bottom-32), proper spacing on larger screens */}
        <div 
          ref={statsRef}
          className="absolute bottom-32 sm:bottom-4 md:bottom-10 lg:bottom-16 xl:bottom-16 left-1/2 -translate-x-1/2 z-20 w-auto box-border"
          style={{ 
            maxWidth: 'calc(100% - 1rem)'
          }}
        >
          <div className="flex justify-center gap-4 sm:gap-3 md:gap-5 lg:gap-8 xl:gap-10 bg-white/95 backdrop-blur-md rounded-full px-5 sm:px-3 md:px-5 lg:px-8 xl:px-10 py-2.5 sm:py-2 md:py-3 lg:py-4 xl:py-5 shadow-lg sm:shadow-xl md:shadow-2xl border border-gray-100/50 mx-auto">
            <div className="text-center">
              <div className="font-display text-xl sm:text-lg md:text-2xl lg:text-3xl text-[#f51042]">1</div>
              <div className="font-mono text-[8px] sm:text-[7px] md:text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">City</div>
            </div>
            <div className="w-px bg-gray-200/80" />
            <div className="text-center">
              <div className="font-display text-xl sm:text-lg md:text-2xl lg:text-3xl text-[#f51042]">15+</div>
              <div className="font-mono text-[8px] sm:text-[7px] md:text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 whitespace-nowrap">Local Chefs</div>
            </div>
            <div className="w-px bg-gray-200/80" />
            <div className="text-center">
              <div className="font-display text-xl sm:text-lg md:text-2xl lg:text-3xl text-[#f51042]">150+</div>
              <div className="font-mono text-[8px] sm:text-[7px] md:text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-wider mt-0.5 whitespace-nowrap">Happy Orders</div>
            </div>
          </div>
        </div>

        {/* Scroll hint - positioned higher on mobile for visibility, below where stats bar will appear */}
        <div 
          ref={scrollHintRef}
          className="absolute bottom-24 sm:bottom-8 md:bottom-6 lg:bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center text-gray-400">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Scroll to explore</span>
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes marker-pulse {
          0% { 
            transform: scale(1); 
            opacity: 0.9; 
          }
          100% { 
            transform: scale(2.8); 
            opacity: 0; 
          }
        }
      `}</style>
    </section>
  )
}
