import { useRef, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EditBlogPostForm from '../components/Blog/EditBlogPostForm'
import BlogMetaTags from '../components/Blog/BlogMetaTags'
import { useAuth } from '../hooks/useAuth'

gsap.registerPlugin(ScrollTrigger)

function EditBlogPostPageContent() {
  const sectionRef = useRef<HTMLElement>(null)
  const { isAdmin, isLoading } = useAuth()

  // IMPORTANT: All hooks must be called before any conditional returns
  // This useEffect must be called unconditionally to follow Rules of Hooks
  useEffect(() => {
    // Wait for ref to be attached to DOM
    const sectionElement = sectionRef.current
    if (!sectionElement) return

    let ctx: gsap.Context | null = null

    // Use a small delay to ensure DOM is fully ready and avoid scope issues
    const timeoutId = setTimeout(() => {
      const currentSection = sectionRef.current
      if (!currentSection) return

      try {
        ctx = gsap.context(() => {
          // Animate sections on scroll
          const isMobile = window.innerWidth < 768
          // Use the section element as the scope
          const sections = gsap.utils.toArray<HTMLElement>('.animate-section', currentSection)
          
          sections.forEach((section) => {
            if (!section || !currentSection.contains(section)) return
            
            // Set initial visible state to ensure content is always visible
            gsap.set(section, { opacity: 1, y: 0 })
            
            gsap.fromTo(
              section,
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
                  start: isMobile ? 'top 95%' : 'top 90%',
                  end: 'bottom 20%',
                  toggleActions: 'play none none reverse',
                  invalidateOnRefresh: true,
                },
              }
            )
          })
        }, currentSection)
      } catch (error) {
        console.warn('GSAP animation setup error:', error)
      }
    }, 150)

    return () => {
      clearTimeout(timeoutId)
      if (ctx) {
        ctx.revert()
      }
    }
  }, [])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-body text-[var(--color-charcoal)]/60">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/blog" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] overflow-x-hidden max-w-[100vw] w-full box-border">
      <BlogMetaTags 
        title="Edit Blog Post - LocalCooks" 
        description="Edit your blog post and update it with new content."
      />
      <Navbar />
      
      <section ref={sectionRef} className="pt-32 pb-24 px-3 sm:px-4 md:px-6 overflow-x-clip">
        <div className="max-w-4xl mx-auto w-full box-border">
          {/* Back to Blog Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="mb-8"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-body text-[var(--color-charcoal)]/60 hover:text-[var(--color-primary)] transition-colors duration-300 group"
            >
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-16 animate-section"
            style={{ opacity: 1 }}
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-[var(--color-primary)] mb-6 uppercase tracking-tight">
              Edit Post
            </h1>
            <p className="font-body text-lg sm:text-xl text-[var(--color-charcoal)]/60 max-w-2xl mx-auto">
              Update your blog post with new content and details
            </p>
          </motion.div>

          {/* Form */}
          <div className="animate-section" style={{ opacity: 1 }}>
            <EditBlogPostForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function EditBlogPostPage() {
  return (
    <SmoothScroll>
      <EditBlogPostPageContent />
    </SmoothScroll>
  )
}

