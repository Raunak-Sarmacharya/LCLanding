import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useBlogPosts } from '../hooks/useBlog'
import BlogList from '../components/Blog/BlogList'
import BlogMetaTags from '../components/Blog/BlogMetaTags'

gsap.registerPlugin(ScrollTrigger)

function BlogPageContent() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const { posts, loading, error } = useBlogPosts()

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate sections on scroll
      const isMobile = window.innerWidth < 768
      gsap.utils.toArray<HTMLElement>('.animate-section').forEach((section) => {
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
              start: isMobile ? 'top 90%' : 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true,
            },
          }
        )
      })
    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-cream)] overflow-x-hidden max-w-[100vw] w-full box-border">
      <BlogMetaTags
        title="Blog - LocalCooks"
        description="Discover stories, recipes, and insights from our community of home chefs."
      />
      <Navbar />

      <section ref={sectionRef} className="pt-32 pb-24 px-3 sm:px-4 md:px-6 overflow-x-clip">
        <div className="max-w-7xl mx-auto w-full box-border">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-16 animate-section"
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[var(--color-primary)] mb-6 uppercase tracking-tight">
              Our Blog
            </h1>
            <p className="font-body text-lg sm:text-xl text-[var(--color-charcoal)]/60 max-w-2xl mx-auto mb-8">
              Stories, recipes, and insights from our community of talented home chefs
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link
                to="/blog/new"
                className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 rounded-full font-body font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-[var(--color-primary)]/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Write a Post
              </Link>
            </motion.div>
          </motion.div>

          {/* Blog Content */}
          <div className="animate-section">
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-body text-[var(--color-charcoal)]/60">Loading posts...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <p className="font-body text-[var(--color-primary)] mb-2">
                    {error.message.includes('cached')
                      ? '⚠️ Showing Cached Posts'
                      : '❌ Error Loading Posts'}
                  </p>
                  <p className="font-body text-sm text-[var(--color-charcoal)]/60 mb-6">
                    {error.message}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 rounded-full font-body font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-20">
                <p className="font-body text-lg text-[var(--color-charcoal)]/60">
                  No blogs yet
                </p>
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <BlogList posts={posts} />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function BlogPage() {
  return (
    <SmoothScroll>
      <BlogPageContent />
    </SmoothScroll>
  )
}

