import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'
import SEOHead from '../components/SEO/SEOHead'

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
    { name: 'For Chefs', href: 'https://chef.localcooks.ca', external: true },
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
      {/* SEO Head - Privacy Policy */}
      <SEOHead
        title="Privacy Policy"
        description="Read LocalCooks' Privacy Policy. Learn how we collect, use, and protect your personal information when you use our platform to order homemade food from local chefs."
        canonicalUrl="/privacy"
        noIndex={false}
        breadcrumbs={[
          { name: 'Home', url: 'https://www.localcooks.ca' },
          { name: 'Privacy Policy', url: 'https://www.localcooks.ca/privacy' },
        ]}
      />
      
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
              {/* Section 1: Introduction and Scope */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">1. Introduction and Scope</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Local Cooks Inc. ("Local Cooks," "we," "us," or "our") values the trust you place in us when sharing your personal data. This Privacy Policy details how we collect, use, disclose, and safeguard your Personal Information when you access our mobile application, website (www.localcook.shop), and related services (collectively, the "Platform").
                </p>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  By accessing the Platform, you consent to the data practices described in this Policy. If you do not agree with the data practices described herein, you should not use the Platform.
                </p>
              </div>

              {/* Section 2: Information We Collect */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">2. Information We Collect</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We collect information necessary to facilitate the connection between Diners, Independent Chefs, and Couriers.
                </p>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.1 Information You Provide Directly</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li><strong>Account Registration:</strong> When you sign up, we collect identifiers such as your full name, phone number, email address, and password.</li>
                    <li><strong>Transaction Data:</strong> Order details, dietary preferences, and delivery instructions.</li>
                    <li><strong>Payment Information:</strong> We do not store full credit card numbers. Payment data is tokenized and processed directly by our third-party payment processor (Stripe). We retain only limited information (e.g., last four digits, expiration date) for verification.</li>
                    <li><strong>Communications:</strong> Content of messages sent to us or generated through the Platform (e.g., feedback, chat with support).</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.2 Information We Collect Automatically</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li><strong>Geolocation Data:</strong> With your permission, we collect precise or approximate location data from your mobile device to facilitate delivery logistics and show you Chefs available in your area.</li>
                    <li><strong>Device & Usage Data:</strong> We collect technical data including your IP address, device model, operating system, unique device identifiers (UDID), and crash data to improve app stability and security.</li>
                    <li><strong>Cookies and Tracking Technologies:</strong> We use cookies, beacons, and similar technologies to analyze trends, administer the Platform, and track users' movements around the Platform.</li>
                  </ul>
                </div>
              </div>

              {/* Section 3: How We Use Your Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">3. How We Use Your Information</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We use your data for specific, limited purposes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li><strong>Service Fulfillment:</strong> To process orders, coordinate deliveries, and facilitate payments.</li>
                  <li><strong>Safety & Security:</strong> To verify accounts, detect potential fraud, and ensure the safety of our Users, Chefs, and Couriers.</li>
                  <li><strong>Communication:</strong> To send order updates (push notifications/SMS), security alerts, and administrative messages.</li>
                  <li><strong>Platform Improvement:</strong> To analyze usage trends and optimize the user experience (e.g., suggesting Chefs based on past orders).</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable legal obligations, such as tax laws and law enforcement requests.</li>
                </ul>
              </div>

              {/* Section 4: Sharing and Disclosure of Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">4. Sharing and Disclosure of Information</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We are not in the business of selling your data. We share your information only as described below:
                </p>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.1 Sharing with Ecosystem Partners (Necessary for Service)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li><strong>Independent Chefs:</strong> We share your first name, order details, and dietary restrictions with the Chef preparing your meal. We do not share your payment details with Chefs.</li>
                    <li><strong>Couriers/Delivery Partners:</strong> We share your delivery address, phone number, and first name with the Courier assigned to your order to facilitate delivery.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.2 Service Providers</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We employ third-party companies to facilitate our Service (e.g., cloud hosting via AWS/Google, payment processing via Stripe, SMS notifications via Twilio). These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.3 Legal Requirements</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We may disclose your Personal Information if required to do so by law or in the good faith belief that such action is necessary to: (a) comply with a legal obligation (e.g., subpoena); (b) protect and defend the rights or property of Local Cooks; or (c) protect the personal safety of users or the public.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.4 Business Transfers</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If Local Cooks is involved in a merger, acquisition, or sale of assets, your Personal Information may be transferred as part of that transaction.
                  </p>
                </div>
              </div>

              {/* Section 5: International Data Transfers */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">5. International Data Transfers</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Local Cooks is based in Canada. However, we and our third-party service providers may store or process your Personal Information on servers located outside of Canada (including in the United States). While your information is outside Canada, it is subject to the laws of the country in which it is held, which may differ from Canadian privacy laws.
                </p>
              </div>

              {/* Section 6: Your Rights and Choices */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">6. Your Rights and Choices</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Under Canadian privacy laws (PIPEDA), you have specific rights regarding your Personal Information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li><strong>Access and Correction:</strong> You have the right to request access to the personal data we hold about you and to request corrections if it is inaccurate.</li>
                  <li><strong>Withdrawal of Consent:</strong> You may withdraw your consent to the collection or use of your personal information at any time, subject to legal or contractual restrictions. Note that withdrawing consent for essential data (like location or payment info) may render the Service unusable.</li>
                  <li><strong>Location Settings:</strong> You can disable location tracking at any time through your device settings, though this will impact the functionality of the Platform.</li>
                  <li><strong>Marketing Communications:</strong> You can opt-out of marketing emails by following the "unsubscribe" link. You cannot opt-out of transactional emails (e.g., order receipts).</li>
                </ul>
              </div>

              {/* Section 7: Data Retention */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">7. Data Retention</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We retain your Personal Information only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements. When we no longer need your personal information, we will securely delete or anonymize it.
                </p>
              </div>

              {/* Section 8: Security */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">8. Security</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We implement industry-standard physical, technical, and administrative security measures designed to protect your Personal Information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee its absolute security.
                </p>
              </div>

              {/* Section 9: Children's Privacy */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">9. Children's Privacy</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  The Platform is not directed to individuals under the age of 13 (or the applicable age of digital consent). We do not knowingly collect Personal Information from children. If we become aware that a child has provided us with Personal Information, we will take steps to delete such information.
                </p>
              </div>

              {/* Section 10: Third-Party Links */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">10. Third-Party Links</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Our Platform may contain links to third-party websites. This Privacy Policy applies only to Local Cooks. We are not responsible for the privacy practices of other sites.
                </p>
              </div>

              {/* Section 11: Contact Us */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">11. Contact Us (Privacy Officer)</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  If you have questions about this Privacy Policy, or wish to exercise your rights regarding your Personal Information, please contact our designated Privacy Officer:
                </p>
                <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-6 mt-4">
                  <p className="text-base text-[var(--color-charcoal)]/80 font-semibold">
                    Local Cooks Inc.
                  </p>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Attn: Privacy Officer
                  </p>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Email: <a href="mailto:support@localcook.shop" className="text-[var(--color-primary)] hover:underline">support@localcook.shop</a>
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

