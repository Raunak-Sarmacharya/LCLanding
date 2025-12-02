import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CreateBlogPostForm from '../components/Blog/CreateBlogPostForm'
import BlogMetaTags from '../components/Blog/BlogMetaTags'

gsap.registerPlugin(ScrollTrigger)

function CreateBlogPostPageContent() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })

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
        title="Write a Blog Post - LocalCooks" 
        description="Share your story, recipes, and insights with the LocalCooks community."
      />
      <Navbar />
      
      <section ref={sectionRef} className="pt-32 pb-24 px-3 sm:px-4 md:px-6 overflow-x-clip">
        <div className="max-w-4xl mx-auto w-full box-border">
          {/* Back to Blog Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
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
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-16 animate-section"
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-[var(--color-primary)] mb-6 uppercase tracking-tight">
              Write a Post
            </h1>
            <p className="font-body text-lg sm:text-xl text-[var(--color-charcoal)]/60 max-w-2xl mx-auto">
              Share your story, recipes, and insights with our community
            </p>
          </motion.div>

          {/* Form */}
          <div className="animate-section">
            <CreateBlogPostForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function CreateBlogPostPage() {
  return (
    <SmoothScroll>
      <CreateBlogPostPageContent />
    </SmoothScroll>
  )
}

