import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import Hero from './components/Hero'
import PillMarquee from './components/PillMarquee'
import About from './components/About'
import FeaturedChefs from './components/FeaturedChefs'
import HowItWorks from './components/HowItWorks'
import Testimonials from './components/Testimonials'
import AppPromo from './components/AppPromo'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'
import CanadaMap from './components/CanadaMap'
import SmoothScroll from './components/SmoothScroll'
import WaveDivider from './components/WaveDivider'
import Preloader from './components/Preloader'
import DiscountPopup from './components/DiscountPopup'
import ContactPage from './components/ContactPage'
import NewsletterSection from './components/NewsletterSection'
import BlogInsightsSection from './components/BlogInsightsSection'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import CreateBlogPostPage from './pages/CreateBlogPostPage'
import AdminLoginPage from './pages/AdminLoginPage'

gsap.registerPlugin(ScrollTrigger)

// Session storage key for preloader
const PRELOADER_SHOWN_KEY = 'localcooks_preloader_shown'

// Home Page Component
function HomePage() {
  const appRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { scrollTo } = useSmoothScroll()

  // Handle hash navigation - scroll to section when page loads with a hash
  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure page is fully rendered and smooth scroll is initialized
      const timer = setTimeout(() => {
        scrollTo(location.hash, {
          duration: 1.5,
          offset: -80,
        })
      }, 500) // Increased delay to ensure Lenis is ready
      return () => clearTimeout(timer)
    }
  }, [location.hash, scrollTo])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ========================================
      // SCROLL-TRIGGERED SECTION ANIMATIONS
      // ========================================
      
      // Normalize scroll for mobile devices (prevents address bar issues)
      // This works well with Lenis and helps handle mobile browser quirks
      ScrollTrigger.normalizeScroll(true)

      // Animate sections on scroll with various effects
      // Reduced animation distance on mobile for better performance
      const isMobile = window.innerWidth < 768
      gsap.utils.toArray<HTMLElement>('.animate-section').forEach((section) => {
        gsap.fromTo(section,
          { 
            opacity: 0, 
            y: isMobile ? 40 : 80,
          },
          {
            opacity: 1,
            y: 0,
            duration: isMobile ? 0.8 : 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: isMobile ? 'top 90%' : 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              // Disable on very small screens to prevent performance issues
              invalidateOnRefresh: true,
            }
          }
        )
      })

      // ========================================
      // MAGNETIC BUTTON EFFECT
      // ========================================

      const magneticButtons = document.querySelectorAll('.btn-primary, .nav-cta, .hero-cta')
      
      magneticButtons.forEach((btn) => {
        const button = btn as HTMLElement

        const handleMouseMove = (e: MouseEvent) => {
          const rect = button.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2
          
          gsap.to(button, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.4,
            ease: 'power2.out',
          })
        }

        const handleMouseLeave = () => {
          gsap.to(button, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: 'elastic.out(1, 0.3)',
          })
        }

        button.addEventListener('mousemove', handleMouseMove)
        button.addEventListener('mouseleave', handleMouseLeave)
      })

      // ========================================
      // PARALLAX EFFECTS (Disabled on mobile for performance)
      // ========================================

      // Only enable parallax on larger screens
      if (!isMobile) {
        gsap.utils.toArray<HTMLElement>('.parallax-bg').forEach((el) => {
          gsap.to(el, {
            y: -100,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            }
          })
        })
      }

      // ========================================
      // TEXT REVEAL ANIMATIONS
      // ========================================

      gsap.utils.toArray<HTMLElement>('.reveal-text').forEach((text) => {
        gsap.fromTo(text,
          { 
            opacity: 0,
            y: isMobile ? 30 : 50,
            clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'polygon(0 0%, 100% 0%, 100% 100%, 0 100%)',
            duration: isMobile ? 0.6 : 1,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: text,
              start: isMobile ? 'top 90%' : 'top 85%',
              toggleActions: 'play none none reverse',
            }
          }
        )
      })

      // ========================================
      // SMOOTH SCROLL PROGRESS
      // ========================================

      gsap.to('.scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        }
      })

      // ========================================
      // SECTION DIVIDER ANIMATIONS
      // ========================================

      gsap.utils.toArray<HTMLElement>('.section-divider').forEach((divider) => {
        gsap.fromTo(divider,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            duration: 1.5,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: divider,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            }
          }
        )
      })

    }, appRef)

    return () => {
      ctx.revert()
      // Clean up normalize scroll
      ScrollTrigger.normalizeScroll(false)
    }
  }, [])

  return (
    <SmoothScroll>
      <div ref={appRef} className="min-h-screen bg-[var(--color-cream)] overflow-x-hidden max-w-[100vw] w-full box-border">
        {/* Scroll Progress Bar */}
        <div className="scroll-progress fixed top-0 left-0 right-0 h-1 bg-[var(--color-primary)] z-[100] origin-left scale-x-0" />
        
        <Navbar />
        <Hero />
        {/* Pill Marquee - Like Done Drinks */}
        <PillMarquee />
        <div className="animate-section">
          <About />
        </div>
        {/* Wave: Primary (FeaturedChefs below) bleeds UP into cream (About above) */}
        <WaveDivider 
          direction="down" 
          waveColor="var(--color-primary)" 
          bgColor="var(--color-cream)"
        />
        <FeaturedChefs />
        {/* Wave: Primary (FeaturedChefs above) bleeds DOWN into cream (HowItWorks below) */}
        <WaveDivider 
          direction="up" 
          waveColor="var(--color-primary)" 
          bgColor="var(--color-cream)"
        />
        <div className="animate-section">
          <HowItWorks />
        </div>
        <div className="animate-section">
          <Testimonials />
        </div>
        {/* Canada Map - NOT wrapped in animate-section due to ScrollTrigger pin */}
        <CanadaMap />
        <div className="animate-section">
          <AppPromo />
        </div>
        <BlogInsightsSection />
        <NewsletterSection />
        <Footer />
      </div>
    </SmoothScroll>
  )
}

function App() {
  const location = useLocation()
  
  // Check if preloader has already been shown this session
  const hasSeenPreloader = sessionStorage.getItem(PRELOADER_SHOWN_KEY) === 'true'
  
  const [showPreloader, setShowPreloader] = useState(!hasSeenPreloader && location.pathname === '/')
  const [isContentReady, setIsContentReady] = useState(hasSeenPreloader || location.pathname !== '/')
  const [showQuickFade, setShowQuickFade] = useState(hasSeenPreloader && location.pathname === '/') // Quick fade for returning visitors

  // Handle preloader completion
  const handlePreloaderComplete = () => {
    sessionStorage.setItem(PRELOADER_SHOWN_KEY, 'true')
    setShowPreloader(false)
    setIsContentReady(true)
  }

  // Quick fade out for returning visitors
  useEffect(() => {
    if (hasSeenPreloader && showQuickFade) {
      // Small delay to ensure content is painted
      const timer = setTimeout(() => {
        setShowQuickFade(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasSeenPreloader, showQuickFade])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      {/* Custom Cursor - Always rendered at top level */}
      <CustomCursor />

      {/* Preloader - Only shown once per session on home page */}
      {showPreloader && (
        <Preloader 
          onComplete={handlePreloaderComplete}
          minimumDuration={3200}
        />
      )}

      {/* Discount Popup - Only shown once per session, after content is ready, on home page */}
      {isContentReady && location.pathname === '/' && <DiscountPopup />}

      {/* Quick fade overlay for returning visitors - prevents flash of unstyled content */}
      {showQuickFade && (
        <div 
          className="fixed inset-0 z-[9998] bg-[var(--color-cream)] pointer-events-none transition-opacity duration-300"
          style={{ opacity: showQuickFade ? 1 : 0 }}
        />
      )}

      {/* Main content */}
      {isContentReady && (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/new" element={<CreateBlogPostPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Routes>
      )}
    </>
  )
}

export default App
