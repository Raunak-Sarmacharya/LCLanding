import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'

function PrivacyPageContent() {
  const sectionRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const isFooterInView = useInView(footerRef, { once: true, margin: '-50px' })
  const { scrollToTop } = useSmoothScroll()
  const { lenisRef } = useLenis()
  
  // Track scroll position to hide button when near top
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const SCROLL_THRESHOLD = 300

  // Listen to Lenis scroll events to detect scroll position
  useEffect(() => {
    const checkLenis = () => {
      const lenis = lenisRef?.current?.lenis
      if (!lenis) {
        const timeout = setTimeout(checkLenis, 100)
        return () => clearTimeout(timeout)
      }

      const handleScroll = () => {
        const scrollPosition = lenis.actualScroll || lenis.scroll || 0
        setShowScrollToTop(scrollPosition > SCROLL_THRESHOLD)
      }

      handleScroll()
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

  // Legal links for bottom bar
  const legalLinks = [
    { name: 'Terms of Service', href: '/terms', isRoute: true },
    { name: 'Privacy Policy', href: '/privacy', isRoute: true },
  ]

  // Main navigation links
  const mainNavLinks = [
    { name: 'About Us', href: '/#about' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'For Chefs', href: 'https://local-cooks-community.vercel.app/', external: true },
    { name: 'Blog', href: '/blog', isRoute: true },
    { name: 'Contact', href: '/contact', isRoute: true },
  ]

  // Social links
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/local-cooks',
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
      href: 'https://www.facebook.com/LocalCooks',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/localcooksnfld/',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      ),
    },
  ]

  return (
    <main className="min-h-screen bg-[var(--color-cream)]">
      {/* Navigation - Elegant top bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-cream)]/90 backdrop-blur-md border-b border-[var(--color-charcoal)]/5 overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 flex items-center justify-between w-full box-border">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              className="w-10 h-10 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <img 
                src="/logo-lc.png" 
                alt="LocalCooks Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </motion.div>
            <span className="font-display text-2xl tracking-tight text-[var(--color-primary)]">
              LocalCooks
            </span>
          </Link>
          <Link 
            to="/"
            className="flex items-center gap-2 font-body text-[var(--color-charcoal)] hover:text-[var(--color-primary)] transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <section ref={sectionRef} className="pt-32 pb-24 px-3 sm:px-4 md:px-6 overflow-x-clip">
        <div className="max-w-4xl mx-auto w-full box-border">
          {/* Animated Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-16"
          >
            <h1 
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--color-primary)] mb-6 uppercase tracking-tight"
              style={{ fontWeight: 900, letterSpacing: '-0.02em' }}
            >
              Privacy Policy
            </h1>
            <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-lg mx-auto">
              Last updated: September 7, 2025
            </p>
          </motion.div>

          {/* Privacy Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="prose prose-lg max-w-none"
          >
            <div className="font-body text-[var(--color-charcoal)] space-y-10 leading-relaxed">
              {/* Section 1: Introduction */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">1. Introduction</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.1 Our Commitment to Privacy</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    At Local Cooks Inc. ("Local Cooks", "we", "us", or "our"), we are committed to safeguarding your privacy. This Privacy Policy outlines how we collect, use, disclose, and protect the personal information of our users ("you" or "your").
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.2 Scope</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Privacy Policy applies to your use of our website, mobile application, and any related services (collectively, the "Service"). By accessing or using our Service, you agree to the collection and use of your information in accordance with this policy.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.3 Updates</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the "Last Updated" date will be revised accordingly. Your continued use of the Service after such modifications constitutes your acknowledgment of the updated policy.
                  </p>
                </div>
              </div>

              {/* Section 2: Information We Collect */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">2. Information We Collect</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We collect the following personal information to provide and improve our Service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li><strong>Identifiers:</strong> Phone number, username, and optional email address.</li>
                  <li><strong>Usage Data:</strong> Information on how you interact with our Service, including access times, pages viewed, and other usage statistics.</li>
                </ul>
              </div>

              {/* Section 3: Use of Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">3. Use of Information</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li><strong>Service Delivery:</strong> To provide, maintain, and improve our Service.</li>
                  <li><strong>Communication:</strong> To contact you regarding your account, respond to inquiries, and send updates.</li>
                  <li><strong>Security:</strong> To detect and prevent fraudulent activities and ensure the security of our Service.</li>
                </ul>
              </div>

              {/* Section 4: Disclosure of Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">4. Disclosure of Information</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We do not sell or rent your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li><strong>Service Providers:</strong> With third-party vendors who assist in operating our Service, subject to confidentiality agreements.</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
                </ul>
              </div>

              {/* Section 5: Consent */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">5. Consent</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">5.1 Obtaining Consent</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    By providing your personal information, you consent to its collection, use, and disclosure as outlined in this Privacy Policy.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">5.2 Withdrawing Consent</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You may withdraw your consent at any time by contacting us. However, this may affect your ability to use certain features of our Service.
                  </p>
                </div>
              </div>

              {/* Section 6: Protection of Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">6. Protection of Information</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">6.1 Accuracy</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We strive to keep your personal information accurate and up-to-date. Please notify us of any changes.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">6.2 Access</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You have the right to access and correct your personal information. Contact us to make such requests.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">6.3 Security Measures</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We implement appropriate security measures to protect your information from unauthorized access or disclosure.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">6.4 Retention</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy or as required by law.
                  </p>
                </div>
              </div>

              {/* Section 7: Other Data Practices */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">7. Other Data Practices</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">7.1 Cookies and Similar Technologies</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We may use cookies to enhance your experience on our Service. You can adjust your browser settings to refuse cookies, but this may limit certain functionalities.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">7.2 Children's Privacy</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Our Service is not intended for individuals under 13. We do not knowingly collect information from children under 13.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">7.3 External Links</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Our Service may contain links to external websites. We are not responsible for the privacy practices of these sites.
                  </p>
                </div>
              </div>

              {/* Section 8: Contact Us */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">8. Contact Us</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">8.1 Questions or Complaints</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If you have any questions, concerns, or complaints about our privacy practices, please contact us at:
                  </p>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    <strong>Email:</strong> <a href="mailto:support@localcook.shop" className="text-[var(--color-primary)] hover:underline">support@localcook.shop</a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Same style as ContactPage */}
      <footer ref={footerRef} className="bg-white relative overflow-x-clip">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 pb-10 w-full box-border">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isFooterInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="lg:w-[45%] flex items-start lg:pr-16"
            >
              <Link 
                to="/"
                className="group inline-block footer-contact-link"
              >
                <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.85] uppercase tracking-normal footer-contact-text select-none">
                  <span className="block">Back</span>
                  <span className="block">Home</span>
                </h2>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isFooterInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="lg:w-[55%] flex flex-col justify-between lg:pl-8 lg:border-l lg:border-[var(--color-charcoal)]/10"
            >
              <div className="flex flex-wrap gap-x-8 gap-y-6 mb-8">
                <div className="space-y-1.5">
                  <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] uppercase tracking-widest">
                    Talk to us
                  </h3>
                  <div className="space-y-0.5">
                    <a 
                      href="tel:+17096318480"
                      className="block font-body text-[var(--color-charcoal)]/60 text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                    >
                      +1 (709) 631-8480
                    </a>
                    <a 
                      href="mailto:admin@localcook.shop"
                      className="block font-body text-[var(--color-charcoal)]/60 text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                    >
                      admin@localcook.shop
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] uppercase tracking-widest">
                    Come see us
                  </h3>
                  <p className="font-body text-[var(--color-charcoal)]/60 text-sm leading-snug">
                    St. John's,<br />
                    Newfoundland,<br />
                    Canada
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-body font-bold text-[var(--color-charcoal)] text-[11px] uppercase tracking-widest">
                    Follow us
                  </h3>
                  <div className="flex gap-1">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-full border border-[var(--color-charcoal)]/20 flex items-center justify-center text-[var(--color-charcoal)]/70 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all duration-300"
                        aria-label={social.name}
                      >
                        {social.icon}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {mainNavLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={isFooterInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.25 + index * 0.04 }}
                    >
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body font-semibold text-[var(--color-charcoal)] text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      ) : link.isRoute ? (
                        <Link
                          to={link.href}
                          className="font-body font-semibold text-[var(--color-charcoal)] text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="font-body font-semibold text-[var(--color-charcoal)] text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      )}
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={isFooterInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.37 }}
                  >
                    <Link
                      to="/"
                      className="font-body font-semibold text-[var(--color-charcoal)] text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                    >
                      Home
                    </Link>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isFooterInView ? { opacity: 1, scale: 1 } : {}}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={isFooterInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-[var(--color-primary)] overflow-x-clip"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 w-full box-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1">
                {legalLinks.map((link) => (
                  link.isRoute ? (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      key={link.name}
                      href={link.href}
                      className="font-mono text-[10px] uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  )
                ))}
              </div>

              <p className="font-mono text-[10px] text-white/70 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 rounded-full bg-white/50" />
                {new Date().getFullYear()}, LocalCooks. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showScrollToTop && (
            <motion.a
              href="#"
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
    </main>
  )
}

export default function PrivacyPage() {
  return (
    <SmoothScroll>
      <PrivacyPageContent />
    </SmoothScroll>
  )
}

