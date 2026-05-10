import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import SmoothScroll from '../components/SmoothScroll'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEOHead from '../components/SEO/SEOHead'

/**
 * 404 Not Found Page
 *
 * SEO behaviour:
 *  - <SEOHead noIndex /> emits `<meta name="robots" content="noindex, nofollow">`
 *    so Googlebot does NOT index this page (which would otherwise be flagged
 *    as a "Soft 404" since the SPA returns HTTP 200 for unknown URLs).
 *  - The optional Prerender.io / Googlebot status hint is emitted via the
 *    <meta name="prerender-status-code" content="404"> tag — respected by
 *    most JS-rendering crawl middleware. While Googlebot itself does NOT
 *    parse this tag, the `noindex` directive is what keeps unknown URLs
 *    out of the index, which is the actually-effective signal.
 *
 * UX: Provides clear navigation back to the homepage and key sections,
 *  preserving link equity recovery.
 */
function NotFoundContent() {
  const location = useLocation()

  // Log unknown routes in production for monitoring (helps spot broken
  // inbound links and content gaps without leaving stack traces).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(`[404] Unmatched route: ${location.pathname}`)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[var(--color-cream)] flex flex-col">
      <SEOHead
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Explore homemade meals from local chefs in St. John's, Newfoundland on LocalCooks."
        noIndex={true}
      />
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <h1 className="font-display text-7xl sm:text-9xl text-[var(--color-primary)] mb-4 leading-none">
            404
          </h1>
          <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-charcoal)] mb-4 uppercase tracking-tight">
            Page not found
          </h2>
          <p className="font-body text-base sm:text-lg text-[var(--color-charcoal)]/70 mb-10 max-w-md mx-auto">
            The page you were looking for doesn't exist or may have been moved.
            Let's get you back to homemade goodness.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <Link
              to="/"
              className="inline-block px-8 py-3.5 bg-[var(--color-primary)] text-white font-body font-semibold rounded-full hover:bg-[var(--color-primary)]/90 transition-colors duration-300"
            >
              Back to home
            </Link>
            <Link
              to="/blog"
              className="inline-block px-8 py-3.5 border border-[var(--color-charcoal)]/20 text-[var(--color-charcoal)] font-body font-semibold rounded-full hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors duration-300"
            >
              Read the blog
            </Link>
          </div>

          {/* Helpful internal link recovery — preserves crawl/link equity */}
          <div className="text-left max-w-md mx-auto">
            <p className="font-body font-bold text-xs uppercase tracking-widest text-[var(--color-charcoal)]/60 mb-3">
              Popular pages
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="font-body text-sm text-[var(--color-charcoal)]/80 hover:text-[var(--color-primary)] transition-colors"
                >
                  → Contact us
                </Link>
              </li>
              <li>
                <a
                  href="https://chef.localcooks.ca/"
                  className="font-body text-sm text-[var(--color-charcoal)]/80 hover:text-[var(--color-primary)] transition-colors"
                >
                  → For chefs
                </a>
              </li>
              <li>
                <a
                  href="https://kitchen.localcooks.ca/"
                  className="font-body text-sm text-[var(--color-charcoal)]/80 hover:text-[var(--color-primary)] transition-colors"
                >
                  → For kitchen owners
                </a>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

export default function NotFoundPage() {
  return (
    <SmoothScroll>
      <NotFoundContent />
    </SmoothScroll>
  )
}
