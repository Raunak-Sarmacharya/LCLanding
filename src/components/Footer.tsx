import { motion, useInView, AnimatePresence } from 'motion/react'
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'

// Main navigation links
const mainNavLinks = [
  { name: 'About Us', href: '#about' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'For Chefs', href: 'https://local-cooks-community.vercel.app/', external: true },
  { name: 'Blog', href: '/blog', isRoute: true },
  { name: 'Contact', href: '/contact', isRoute: true },
]

// Legal links for bottom bar
const legalLinks = [
  { name: 'Terms of Service', href: '#terms' },
  { name: 'Privacy Policy', href: '#privacy' },
  { name: 'Cookies', href: '#cookies' },
]

// Modern minimal social icons - Lucide-style line icons
const socialLinks = [
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/localcooks',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect width="4" height="12" x="2" y="9"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/localcooks',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/localcooks',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    ),
  },
]

export default function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { scrollToTop } = useSmoothScroll()
  const { lenisRef } = useLenis()
  
  // Track scroll position to hide button when near top
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const SCROLL_THRESHOLD = 300 // Hide button when within 300px of top

  // Listen to Lenis scroll events to detect scroll position
  useEffect(() => {
    // Wait for Lenis to be available (it might not be ready immediately)
    const checkLenis = () => {
      const lenis = lenisRef?.current?.lenis
      if (!lenis) {
        // Retry after a short delay if Lenis is not ready
        const timeout = setTimeout(checkLenis, 100)
        return () => clearTimeout(timeout)
      }

      const handleScroll = () => {
        // Use actualScroll for more accurate position (works with Lenis smooth scroll)
        const scrollPosition = lenis.actualScroll || lenis.scroll || 0
        // Show button only when scrolled past threshold
        setShowScrollToTop(scrollPosition > SCROLL_THRESHOLD)
      }

      // Check initial scroll position
      handleScroll()

      // Listen to Lenis scroll events
      lenis.on('scroll', handleScroll)

      return () => {
        lenis.off('scroll', handleScroll)
      }
    }

    const cleanup = checkLenis()
    return cleanup
  }, [lenisRef, SCROLL_THRESHOLD])

  const handleBackToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop({ duration: 1.2 })
  }

  return (
    <footer id="contact" ref={ref} className="bg-white relative overflow-hidden">
      {/* Main Footer Content - properly contained */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-16 lg:pt-20 pb-8 sm:pb-8 md:pb-10 w-full box-border overflow-x-clip">
        {/* Two Column Layout - stacks vertically on mobile like ContactPage */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-6 md:gap-8 lg:gap-0">
          
          {/* Left Column: Contact Us Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="sm:w-[40%] lg:w-[45%] flex items-start lg:pr-8 xl:pr-16 flex-shrink-0"
          >
            <Link 
              to="/contact"
              className="group inline-block footer-contact-link"
            >
              <h2 className="font-display text-5xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-[5.5rem] leading-[0.85] uppercase tracking-normal footer-contact-text select-none">
                <span className="block">Contact</span>
                <span className="block">Us</span>
              </h2>
            </Link>
          </motion.div>

          {/* Right Column: All Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="sm:w-[60%] lg:w-[55%] flex flex-col justify-between lg:pl-8 lg:border-l lg:border-[var(--color-charcoal)]/10"
          >
            {/* Top Row: Contact Info - larger sizes on mobile to match ContactPage */}
            <div className="flex flex-wrap gap-x-6 sm:gap-x-5 md:gap-x-8 gap-y-4 sm:gap-y-4 md:gap-y-6 mb-6 sm:mb-6 md:mb-8">
              {/* Talk to us */}
              <div className="space-y-1 sm:space-y-1 md:space-y-1.5">
                <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] sm:text-[9px] md:text-[11px] uppercase tracking-widest">
                  Talk to us
                </h3>
                <div className="space-y-0.5">
                  <a 
                    href="tel:+17095550123"
                    className="block font-body text-[var(--color-charcoal)]/60 text-sm sm:text-xs md:text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    +1 (709) 555-0123
                  </a>
                  <a 
                    href="mailto:hello@localcooks.ca"
                    className="block font-body text-[var(--color-charcoal)]/60 text-sm sm:text-xs md:text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    hello@localcooks.ca
                  </a>
                </div>
              </div>

              {/* Come see us - visible on all screens */}
              <div className="space-y-1 sm:space-y-1 md:space-y-1.5">
                <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] sm:text-[9px] md:text-[11px] uppercase tracking-widest">
                  Visit us
                </h3>
                <p className="font-body text-[var(--color-charcoal)]/60 text-sm sm:text-xs md:text-sm leading-snug">
                  St. John's, NL<br />
                  Canada
                </p>
              </div>

              {/* Follow us */}
              <div className="space-y-1 sm:space-y-1 md:space-y-1.5">
                <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] sm:text-[9px] md:text-[11px] uppercase tracking-widest">
                  Follow us
                </h3>
                <div className="flex gap-1 sm:gap-1">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border border-[var(--color-charcoal)]/20 flex items-center justify-center text-[var(--color-charcoal)]/70 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-300 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-4 sm:[&_svg]:h-4 md:[&_svg]:w-5 md:[&_svg]:h-5"
                      aria-label={social.name}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Nav Links + Logo - stacks on mobile like ContactPage */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-4 md:gap-6">
              {/* Navigation Links */}
              <div className="flex flex-wrap gap-x-4 sm:gap-x-3 md:gap-x-5 gap-y-1.5">
                {mainNavLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.25 + index * 0.04 }}
                  >
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="font-body font-semibold text-[var(--color-charcoal)] text-sm sm:text-[10px] md:text-xs lg:text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    ) : link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body font-semibold text-[var(--color-charcoal)] text-sm sm:text-[10px] md:text-xs lg:text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="font-body font-semibold text-[var(--color-charcoal)] text-sm sm:text-[10px] md:text-xs lg:text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Brand Logo - Using actual logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <Link to="/" className="flex items-center gap-2.5 group">
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-11 h-11 bg-white border border-[var(--color-charcoal)]/10 rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <img 
                      src="/logo-lc.png" 
                      alt="LocalCooks" 
                      className="w-8 h-8 object-contain"
                    />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-display text-lg text-[var(--color-primary)] leading-tight">
                      LocalCooks
                    </span>
                    <span className="font-body text-[9px] text-[var(--color-charcoal)]/40 leading-tight tracking-wide">
                      Homemade flavors, delivered fresh
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar with Divider - properly contained */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-[var(--color-primary)] overflow-x-clip"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 w-full box-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1">
              {legalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="font-mono text-[10px] text-white/70 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="inline-block w-1 h-1 rounded-full bg-white/50" />
              {new Date().getFullYear()}, LocalCooks. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Back to top button - only visible when scrolled past threshold */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.a
            href="#home"
            onClick={handleBackToTop}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white shadow-xl shadow-[var(--color-primary)]/30 z-40"
            aria-label="Back to top"
          >
        <svg 
          className="w-5 h-5 sm:w-6 sm:h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
          </motion.a>
        )}
      </AnimatePresence>
    </footer>
  )
}
