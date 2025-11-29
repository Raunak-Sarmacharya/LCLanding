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

// St. John's approximate coordinates in SVG space (eastern tip of Newfoundland island)
const ST_JOHNS_COORDS = { x: 778.5, y: 957 }

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

      // Create main timeline with ScrollTrigger and STRONG SNAP to phases
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=350%', // Even longer scroll distance for stronger snap zones
          scrub: 0.5, // Lower scrub = more responsive to snap
          pin: containerRef.current,
          anticipatePin: 1,
          snap: {
            snapTo: 'labels', // Snap to timeline labels for distinct phases
            duration: { min: 0.5, max: 1.2 }, // Longer snap duration = stronger pull
            delay: 0.05, // Quick snap engagement
            ease: 'power3.inOut', // Strong easing for decisive snap
            inertia: false, // DISABLE inertia = much harder to "ram through"
            directional: false, // Snap regardless of scroll direction
          },
        }
      })

      // ========================================
      // PHASE 1: Canada Overview
      // ========================================
      tl.addLabel('canada')

      // Phase 1: Animate the viewBox zoom (0 to 0.6 of timeline)
      tl.to(viewBoxRef.current, {
        x: NEWFOUNDLAND_VIEW.x,
        y: NEWFOUNDLAND_VIEW.y,
        w: NEWFOUNDLAND_VIEW.w,
        h: NEWFOUNDLAND_VIEW.h,
        duration: 0.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (!svg) return
          
          const vb = viewBoxRef.current
          svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`)
          
          // Calculate zoom progress (0 to 1)
          const zoomProgress = (FULL_CANADA_VIEW.w - vb.w) / (FULL_CANADA_VIEW.w - NEWFOUNDLAND_VIEW.w)

          // Update marker position based on current viewBox
          if (markerRef.current) {
            const markerX = ((ST_JOHNS_COORDS.x - vb.x) / vb.w) * 100
            const markerY = ((ST_JOHNS_COORDS.y - vb.y) / vb.h) * 100
            markerRef.current.style.left = `${markerX}%`
            markerRef.current.style.top = `${markerY}%`
          }

          // ========================================
          // STROKE & OPACITY LOGIC - Keep vivid through Phase 1
          // ========================================
          
          // PHASE 1 (0-40% zoom): Keep map fully vivid - no changes
          if (zoomProgress <= 0.4) {
            // Keep everything at initial vivid state
            allPaths.forEach(path => {
              path.setAttribute('opacity', '1')
              path.setAttribute('stroke-width', '1.5')
            })
          }
          // PHASE 2 (40-70% zoom): Start fading other provinces slightly
          else if (zoomProgress <= 0.7) {
            const fadeProgress = (zoomProgress - 0.4) / 0.3 // 0 to 1 from 40% to 70%
            allPaths.forEach(path => {
              if (path.id !== 'CA-NL') {
                // Gradually reduce opacity and stroke for other provinces
                const opacity = 1 - (fadeProgress * 0.3) // Goes from 1 to 0.7
                const stroke = 1.5 - (fadeProgress * 0.5) // Goes from 1.5 to 1.0
                path.setAttribute('opacity', `${opacity}`)
                path.setAttribute('stroke-width', `${stroke}`)
              } else {
                // Keep Newfoundland vivid
                path.setAttribute('opacity', '1')
                path.setAttribute('stroke-width', '1.5')
              }
            })
          }
          // PHASE 3 (70-100% zoom): Fully mute other provinces, Newfoundland stays vivid
          else {
            const muteProgress = (zoomProgress - 0.7) / 0.3 // 0 to 1 from 70% to 100%
            allPaths.forEach(path => {
              if (path.id !== 'CA-NL') {
                // Fade out other provinces more aggressively
                const opacity = 0.7 - (muteProgress * 0.4) // Goes from 0.7 to 0.3
                const stroke = 1.0 - (muteProgress * 0.6) // Goes from 1.0 to 0.4
                path.setAttribute('opacity', `${Math.max(0.3, opacity)}`)
                path.setAttribute('stroke-width', `${Math.max(0.3, stroke)}`)
              }
            })
            // Keep Newfoundland prominent and even slightly bolder
            if (nfPath) {
              nfPath.setAttribute('opacity', '1')
              nfPath.setAttribute('stroke-width', `${0.5 + muteProgress * 0.3}`) // Gets bolder: 1.5 to 1.8
            }
          }
        }
      }, 0)

      // ========================================
      // TRANSITION TO PHASE 2: Currently Serving
      // ========================================
      
      // Phase 1 text fades out
      tl.to(text1Ref.current, {
        autoAlpha: 0,
        y: -30,
        duration: 0.1,
        ease: 'power2.in'
      }, 0.15)

      // Hide scroll hint
      tl.to(scrollHintRef.current, {
        autoAlpha: 0,
        duration: 0.1,
      }, 0.15)

      // Add label for Phase 2 snap point
      tl.addLabel('serving', 0.33)

      // Phase 2 text fades in
      tl.to(text2Ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.1,
        ease: 'power2.out'
      }, 0.28)

      // ========================================
      // TRANSITION TO PHASE 3: Live in St. John's
      // ========================================

      // Phase 2 text fades out
      tl.to(text2Ref.current, {
        autoAlpha: 0,
        y: -30,
        duration: 0.08,
        ease: 'power2.in'
      }, 0.55)

      // Add label for Phase 3 snap point - ALL elements appear here together
      tl.addLabel('stjohns', 0.66)

      // Phase 3 text fades in - AT the stjohns label
      tl.to(text3Ref.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.08,
        ease: 'power2.out'
      }, 'stjohns')

      // Show marker with pop effect - AT the stjohns label (simultaneous)
      tl.to(markerRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.1,
        ease: 'back.out(2)'
      }, 'stjohns')

      // Show location label - AT the stjohns label (simultaneous)
      tl.to(labelRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.1,
        ease: 'power2.out'
      }, 'stjohns')

      // Show stats bar - AT the stjohns label (simultaneous)
      tl.to(statsRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.1,
        ease: 'power2.out'
      }, 'stjohns')

      // Add final label for end state (just past stjohns for natural exit)
      tl.addLabel('end', 0.95)

      // Hold at the end briefly
      tl.to({}, { duration: 0.05 }, 0.95)

    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [isReady])

  return (
    <section 
      ref={sectionRef}
      id="location"
      className="relative bg-[var(--color-cream)]"
      style={{ minHeight: '350vh' }}
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
        <div className="absolute top-16 sm:top-20 md:top-24 left-0 right-0 text-center z-10 px-4">
          {/* Phase 1: Full Canada view */}
          <div ref={text1Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs text-[#f51042] uppercase tracking-[0.3em] mb-3">
              Where We Are
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)]">
              Live in <span className="font-display text-[#f51042]">Canada</span>
            </h2>
            <p className="font-heading text-lg sm:text-xl md:text-2xl text-[var(--color-charcoal)]/60 mt-2 sm:mt-3 whitespace-nowrap">
              One community at a time
            </p>
          </div>

          {/* Phase 2: Transitioning zoom */}
          <div ref={text2Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs text-[#f51042] uppercase tracking-[0.3em] mb-3">
              Right Now
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)]">
              Currently Serving
            </h2>
            <p className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#f51042] mt-2 whitespace-nowrap">
              St. John's, Newfoundland
            </p>
          </div>

          {/* Phase 3: Final zoomed state */}
          <div ref={text3Ref} className="absolute inset-x-0 top-0">
            <p className="font-mono text-xs text-[#f51042] uppercase tracking-[0.3em] mb-3">
              Live Today
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)]">
              Live in <span className="font-display text-[#f51042]">St. John's</span>
            </h2>
            <p className="font-heading text-lg sm:text-xl md:text-2xl text-[var(--color-charcoal)]/60 mt-2 sm:mt-3 whitespace-nowrap">
              Growing what's next for local food
            </p>
          </div>
        </div>

        {/* Map container - adjusted margin to account for header padding */}
        <div className="relative w-full max-w-5xl h-[40vh] sm:h-[50vh] md:h-[60vh] mx-auto px-4 mt-16 sm:mt-20 md:mt-24">
          {/* SVG container */}
          <div 
            ref={svgContainerRef}
            className="w-full h-full flex items-center justify-center"
            style={{ minHeight: '350px' }}
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

        {/* Location label card */}
        <div 
          ref={labelRef}
          className="absolute z-30 hidden sm:block"
          style={{ right: '5%', top: '30%' }}
        >
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl px-4 sm:px-6 py-4 sm:py-5 border border-gray-100/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#f51042] rounded-full animate-pulse" />
              <span className="font-mono text-[11px] text-[#f51042] uppercase tracking-wider font-medium">Live Now</span>
            </div>
            <div className="font-display text-2xl sm:text-3xl text-[#f51042] mb-0.5">St. John's</div>
            <div className="text-xs sm:text-sm text-gray-500 font-medium">Newfoundland & Labrador</div>
          </div>
        </div>

        {/* Stats bar */}
        <div 
          ref={statsRef}
          className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex gap-4 sm:gap-6 md:gap-10 bg-white/95 backdrop-blur-md rounded-full px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 shadow-2xl border border-gray-100/50">
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl text-[#f51042]">1</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider mt-1">City</div>
            </div>
            <div className="w-px bg-gray-200/80" />
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl text-[#f51042]">15+</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider mt-1">Local Chefs</div>
            </div>
            <div className="w-px bg-gray-200/80" />
            <div className="text-center">
              <div className="font-display text-2xl sm:text-3xl text-[#f51042]">150+</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider mt-1">Happy Orders</div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div 
          ref={scrollHintRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
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
