import { useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useInView } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useBlogPost } from '../hooks/useBlog'
import BlogPostView from '../components/Blog/BlogPostView'
import BlogMetaTags from '../components/Blog/BlogMetaTags'

gsap.registerPlugin(ScrollTrigger)

function BlogPostPageContent() {
  const { slug } = useParams<{ slug: string }>()
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const { post, loading, error } = useBlogPost(slug || '')

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

  // Handle 404 - redirect after a moment if post not found
  useEffect(() => {
    if (!loading && !error && !post && slug) {
      // Post not found, could redirect or show 404
      // For now, we'll let the component handle the display
    }
  }, [loading, error, post, slug])

  return (
    <div className="min-h-screen bg-[var(--color-cream)] max-w-[100vw] w-full box-border">
      <BlogMetaTags 
        title={post ? `${post.title} - LocalCooks Blog` : 'Blog Post - LocalCooks'}
        description={post?.excerpt || 'Read our latest blog post from LocalCooks'}
      />
      <Navbar />
      
      <section ref={sectionRef} className="pt-24 sm:pt-32 pb-24">
        <div className="w-full box-border">
          {/* Back to Blog Link */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
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
          </div>

          {/* Loading State */}
          {loading && (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-body text-[var(--color-charcoal)]/60">Loading post...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-20">
                <p className="font-body text-[var(--color-primary)] mb-4">
                  Error loading blog post. Please try again later.
                </p>
                <p className="font-body text-sm text-[var(--color-charcoal)]/60 mb-6">
                  {error.message}
                </p>
                <Link
                  to="/blog"
                  className="inline-block font-body text-[var(--color-primary)] hover:underline"
                >
                  Return to Blog
                </Link>
              </div>
            </div>
          )}

          {/* 404 State */}
          {!loading && !error && !post && (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-20">
                <h1 className="font-display text-6xl text-[var(--color-primary)] mb-4">404</h1>
                <p className="font-body text-lg text-[var(--color-charcoal)]/60 mb-6">
                  Post not found
                </p>
                <Link
                  to="/blog"
                  className="inline-block font-body text-[var(--color-primary)] hover:underline"
                >
                  Return to Blog
                </Link>
              </div>
            </div>
          )}

          {/* Post Content */}
          {!loading && !error && post && (
            <div className="animate-section">
              <BlogPostView post={post} />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function BlogPostPage() {
  return (
    <SmoothScroll>
      <BlogPostPageContent />
    </SmoothScroll>
  )
}

