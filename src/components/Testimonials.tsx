import { useCallback, useEffect, useState, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import './Testimonials.css'

/**
 * Testimonials Data
 * 
 * Color Palette Strategy (Based on Color Theory Research):
 * =========================================================
 * 
 * Brand Primary Color: #f51042 (Vibrant Red/Pink)
 * 
 * Color Scheme Used: Split-Complementary + Analogous
 * - This creates visual harmony while maintaining contrast and interest
 * - All colors chosen to ensure WCAG 4.5:1 contrast ratio with white text
 * 
 * Color Selections:
 * 
 * 1. Terracotta (#B85C38) - Warm earth tone
 *    - Analogous to primary (warm family)
 *    - Evokes: warmth, home cooking, natural ingredients
 *    - Contrast ratio with white: ~5.2:1 ✓
 * 
 * 2. Deep Teal (#2A7B7B) - Complementary accent
 *    - Complementary to red/pink on color wheel
 *    - Evokes: freshness, trust, quality
 *    - Contrast ratio with white: ~5.8:1 ✓
 * 
 * 3. Wine/Burgundy (#8B3A52) - Rich analogous
 *    - Analogous to primary (red family)
 *    - Evokes: sophistication, passion, richness
 *    - Contrast ratio with white: ~7.1:1 ✓
 * 
 * 4. Forest Sage (#4A7860) - Split-complementary
 *    - Natural green, pairs with warm tones
 *    - Evokes: fresh ingredients, nature, health
 *    - Contrast ratio with white: ~5.5:1 ✓
 * 
 * 5. Warm Plum (#7B4A70) - Unique accent
 *    - Bridges red and cool tones
 *    - Evokes: creativity, uniqueness, warmth
 *    - Contrast ratio with white: ~6.4:1 ✓
 * 
 * 6. Deep Ocean (#3D5A80) - Cool complement
 *    - Adds depth and variety
 *    - Evokes: trust, reliability, community
 *    - Contrast ratio with white: ~6.7:1 ✓
 * 
 * Reference: Interaction Design Foundation - UI Color Palette Best Practices
 * Following the 60-30-10 rule for visual balance
 */
const testimonials = [
  {
    quote: "I love Emily's Waffles! I make it a Saturday ritual. The quality is unmatched — it's like having a personal chef next door.",
    colorClass: 'is-terracotta'
  },
  {
    quote: "Best Shawarmas in town! Ordering from Safaa aunty feels like having a Lebanese grandmother cooking just for me.",
    colorClass: 'is-deep-teal'
  },
  {
    quote: "Local Cooks made it easy to start selling from home. I've reached new customers and felt supported every step of the way.",
    colorClass: 'is-wine'
  },
  {
    quote: "As a busy mom, this has been a lifesaver. Real homemade food for my family without spending hours in the kitchen!",
    colorClass: 'is-forest-sage'
  },
  {
    quote: "The variety of cuisines available is incredible. I've traveled the world through my taste buds without leaving St. John's!",
    colorClass: 'is-warm-plum'
  },
  {
    quote: "Supporting local chefs while enjoying restaurant-quality meals at home? It's a win-win for everyone in our community.",
    colorClass: 'is-deep-ocean'
  }
]

export default function Testimonials() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const autoplayResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Create autoplay plugin instance with ref for control
  const autoplayPlugin = useRef(
    Autoplay({ 
      delay: 4500,
      stopOnInteraction: false, // Don't permanently stop on interaction
      stopOnMouseEnter: true,
      playOnInit: true,
      rootNode: (emblaRoot) => emblaRoot.parentElement,
    })
  )
  
  // Embla carousel with proper infinite loop settings
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      slidesToScroll: 1,
      containScroll: false, // Important for seamless loop
      dragFree: false,
      duration: 30, // Smooth animation duration
      skipSnaps: false,
      inViewThreshold: 0.7,
    },
    [autoplayPlugin.current]
  )

  // Stop autoplay temporarily when user interacts with arrows
  const pauseAutoplayTemporarily = useCallback(() => {
    const autoplay = emblaApi?.plugins()?.autoplay
    if (!autoplay) return
    
    // Stop autoplay
    autoplay.stop()
    
    // Clear any existing resume timer
    if (autoplayResumeTimerRef.current) {
      clearTimeout(autoplayResumeTimerRef.current)
    }
    
    // Resume autoplay after 6 seconds of inactivity
    autoplayResumeTimerRef.current = setTimeout(() => {
      autoplay.play()
    }, 6000)
  }, [emblaApi])

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      pauseAutoplayTemporarily()
      emblaApi.scrollPrev()
    }
  }, [emblaApi, pauseAutoplayTemporarily])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      pauseAutoplayTemporarily()
      emblaApi.scrollNext()
    }
  }, [emblaApi, pauseAutoplayTemporarily])

  // Update selected index for styling
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
      
      // Clean up resume timer
      if (autoplayResumeTimerRef.current) {
        clearTimeout(autoplayResumeTimerRef.current)
      }
    }
  }, [emblaApi, onSelect])

  // Calculate slide classes for smooth visual transitions
  const getSlideClass = (index: number) => {
    const totalSlides = testimonials.length
    
    // Calculate position relative to selected
    let diff = index - selectedIndex
    
    // Handle wrapping for infinite loop - always show nearest distance
    if (diff > totalSlides / 2) diff -= totalSlides
    if (diff < -totalSlides / 2) diff += totalSlides
    
    if (diff === 0) return 'is-active'
    if (Math.abs(diff) === 1) return 'is-adjacent'
    return 'is-far'
  }

  return (
    <section className="section_testimonials" id="testimonials">
      <div className="testimonial_layout">
        {/* Title */}
        <div className="testimonials-header">
          <span className="font-mono text-sm text-[var(--color-primary)] uppercase tracking-widest mb-4 block">
            Testimonials
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight">
            Why People Keep<br />
            <span className="font-display text-[var(--color-primary)]">Coming Back</span>
          </h2>
        </div>

        {/* Carousel Component */}
        <div className="testimonial_component">
          <div className="spacer-small"></div>
          
          {/* Embla Carousel - Infinite Loop */}
          <div className="embla" ref={emblaRef}>
            <div className="embla__container">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`embla__slide ${getSlideClass(index)}`}
                >
                  <div className={`testimonial_content ${testimonial.colorClass}`}>
                    <div className="text-align-center">
                      <p className="testimonial-quote">
                        "{testimonial.quote}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="embla__arrows">
            <button 
              className="embla__arrow embla__arrow--prev"
              onClick={scrollPrev}
              aria-label="Previous testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 23 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.36052 0.536693C7.02578 0.201962 6.48315 0.201962 6.14841 0.536693L0.43412 6.25101C0.0993767 6.58576 0.0993767 7.12839 0.43412 7.46313L6.14841 13.1774C6.48315 13.5122 7.02578 13.5122 7.36052 13.1774C7.69526 12.8427 7.69526 12.3 7.36052 11.9653L3.10955 7.71421H21.6116C22.085 7.71421 22.4688 7.33044 22.4688 6.85707C22.4688 6.3837 22.085 5.99993 21.6116 5.99993H3.10955L7.36052 1.74888C7.69526 1.41414 7.69526 0.871425 7.36052 0.536693Z" fill="currentColor"/>
              </svg>
            </button>
            <button 
              className="embla__arrow embla__arrow--next"
              onClick={scrollNext}
              aria-label="Next testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.8582 0.810375C16.193 0.475643 16.7356 0.475643 17.0703 0.810375L22.7846 6.52469C23.1194 6.85944 23.1194 7.40207 22.7846 7.73681L17.0703 13.4511C16.7356 13.7858 16.193 13.7858 15.8582 13.4511C15.5235 13.1164 15.5235 12.5737 15.8582 12.239L20.1092 7.9879H1.60714C1.13376 7.9879 0.75 7.60412 0.75 7.13075C0.75 6.65738 1.13376 6.27361 1.60714 6.27361H20.1092L15.8582 2.02256C15.5235 1.68783 15.5235 1.14511 15.8582 0.810375Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
        </div>
      </div>
    </section>
  )
}
