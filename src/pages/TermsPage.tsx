import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'

function TermsPageContent() {
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
              Terms of Service
            </h1>
            <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-lg mx-auto">
              Last updated: September 7, 2025
            </p>
          </motion.div>

          {/* Terms Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="prose prose-lg max-w-none"
          >
            <div className="font-body text-[var(--color-charcoal)] space-y-10 leading-relaxed">
              {/* Introduction */}
              <div className="space-y-4">
                <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                  PLEASE READ THESE TERMS AND CONDITIONS ("AGREEMENT") CAREFULLY. THIS AGREEMENT IS A LEGAL CONTRACT BETWEEN LOCAL COOKS INC. ("LOCAL COOKS," "WE," "US," OR "OUR") AND YOU ("YOU" OR "YOUR"). BY ACCESSING OR USING OUR MOBILE APPLICATION, WEBSITE, OR ANY RELATED SERVICES (COLLECTIVELY, THE "SERVICE"), YOU AGREE TO BE BOUND BY THIS AGREEMENT, INCLUDING ANY POLICIES OR TERMS INCORPORATED HEREIN. IF YOU DO NOT AGREE, PLEASE DO NOT USE THE SERVICE.
                </p>
              </div>

              {/* Section 1: Acceptance of Terms */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.1 Eligibility</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    By using the Service, you represent and warrant that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li>You are of legal age in your jurisdiction to enter into a binding contract;</li>
                    <li>You have read, understood, and agreed to these Terms and our Privacy Policy (incorporated herein by reference); and</li>
                    <li>You have the authority to enter into this Agreement.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.2 Modifications</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We reserve the right, at our sole discretion, to modify or update these Terms at any time. Changes will be effective upon posting on our Service with the "Last Updated" date revised accordingly. Your continued use of the Service after such changes constitutes your acceptance of the updated Terms.
                  </p>
                </div>
              </div>

              {/* Section 2: Description of the Service */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">2. Description of the Service</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.1 Service Overview</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Local Cooks is an online marketplace that connects you with independent chefs who prepare meals for you. While Local Cooks does not prepare or cook the food, we coordinate the entire process—from ordering to delivering the meal right to your door. All transactions are securely processed via our designated payment partner, Stripe.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.2 Delivery and Transaction Process</h3>
                  <div className="space-y-2 text-base text-[var(--color-charcoal)]/80">
                    <p><strong>Ordering:</strong> You browse available meals on our platform and place an order directly through the Service.</p>
                    <p><strong>Payment:</strong> All payments are processed via Stripe. By providing your payment details, you authorize Local Cooks to charge the applicable amount in accordance with the order details.</p>
                    <p><strong>Delivery:</strong> After your order is confirmed, Local Cooks arranges for the delivery of your meal directly to your designated address. We strive to ensure prompt and reliable delivery but cannot guarantee uninterrupted service.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: User Accounts and Security */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">3. User Accounts and Security</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">3.1 Account Registration</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    In order to use certain features of our Service, you may be required to create an account. When registering, you agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li>Provide accurate, current, and complete information;</li>
                    <li>Maintain and update your account information as necessary; and</li>
                    <li>Keep your login credentials confidential.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">3.2 Account Security</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You are solely responsible for all activities that occur under your account. Please notify us immediately at support@localcooks.com of any unauthorized use or suspected breach. We reserve the right to suspend or terminate accounts that violate these Terms or pose a risk to the Service.
                  </p>
                </div>
              </div>

              {/* Section 4: Purchases and Payment Terms */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">4. Purchases and Payment Terms</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.1 Pricing and Payment</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li>Prices for meals are set by the independent chefs and displayed on our Service.</li>
                    <li>Payment is processed securely through Stripe. You agree to provide accurate billing details and authorize the corresponding charges.</li>
                    <li>Taxes, delivery fees, and any applicable service fees will be clearly displayed before you confirm your order.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.2 Order Finality, Cancellations, and Refunds</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                    <li>Once an order is placed, it is considered final.</li>
                    <li>Cancellation or refund requests will be handled on a case-by-case basis. Should you encounter an issue with your order, please contact our customer support team at support@localcooks.com.</li>
                    <li>In the event of a delivery problem or unsatisfactory service, we will work with you to resolve the matter promptly.</li>
                  </ul>
                </div>
              </div>

              {/* Section 5: Privacy and Data Protection */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">5. Privacy and Data Protection</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and safeguard your personal information. By using the Service, you consent to the practices described in our Privacy Policy.
                </p>
              </div>

              {/* Section 6: Third-Party Links and External Content */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">6. Third-Party Links and External Content</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Our Service may contain links to third-party websites or services. Local Cooks does not control and is not responsible for the content, privacy practices, or actions of these third parties. Any interactions with third-party sites are solely between you and the third party.
                </p>
              </div>

              {/* Section 7: Limitation of Liability */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">7. Limitation of Liability</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, LOCAL COOKS IS NOT LIABLE FOR:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li>The quality, safety, or accuracy of meals prepared by independent chefs;</li>
                  <li>Delays, interruptions, or failures in the delivery process caused by factors beyond our control;</li>
                  <li>Any direct, indirect, incidental, consequential, or special damages arising out of your use of the Service.</li>
                </ul>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Your exclusive remedy for any dissatisfaction with the Service is to discontinue use.
                </p>
              </div>

              {/* Section 8: Indemnification */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">8. Indemnification</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  You agree to indemnify, defend, and hold harmless Local Cooks, its affiliates, officers, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li>Your violation of these Terms;</li>
                  <li>Your misuse of the Service; or</li>
                  <li>Any disputes between you and any third party related to your use of the Service.</li>
                </ul>
              </div>

              {/* Section 9: Dispute Resolution */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">9. Dispute Resolution</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">9.1 Governing Law</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Agreement shall be governed by and construed in accordance with the laws of the Province of Newfoundland and Labrador, Canada.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">9.2 Arbitration</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Except as prohibited by applicable law, any disputes arising out of or related to this Agreement shall be resolved by binding arbitration in Newfoundland and Labrador. By agreeing to this arbitration provision, you waive the right to a trial by jury and to participate in a class action.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">9.3 Small Claims and Interim Relief</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You may pursue claims eligible for small claims court or seek temporary injunctive relief through the courts, provided that any remaining disputes are subject to arbitration.
                  </p>
                </div>
              </div>

              {/* Section 10: Term and Termination */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">10. Term and Termination</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">10.1 Term</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Agreement begins when you first use the Service and continues until terminated as provided herein.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">10.2 Termination</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any violation of these Terms or for any conduct that we, in our sole discretion, deem harmful to the Service or its users. Termination does not relieve you of any outstanding payment obligations.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">10.3 Survival</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    The provisions regarding payment, privacy, intellectual property, limitation of liability, indemnification, dispute resolution, and any other provisions that by their nature should survive termination will continue to apply even after your access to the Service has ended.
                  </p>
                </div>
              </div>

              {/* Section 11: General Provisions */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">11. General Provisions</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">11.1 Entire Agreement</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Agreement constitutes the entire understanding between you and Local Cooks regarding your use of the Service and supersedes all prior agreements.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">11.2 Assignment</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You may not assign or transfer your rights or obligations under this Agreement without our prior written consent. Local Cooks may assign or transfer this Agreement without restriction.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">11.3 Notices</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Any notices required under this Agreement will be provided via email or regular mail to the address provided in your account or as otherwise published on our Service.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">11.4 Severability</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If any provision of this Agreement is deemed invalid or unenforceable, the remaining provisions will remain in full force and effect.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">11.5 Waiver</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Failure by Local Cooks to enforce any provision of this Agreement shall not be considered a waiver of our right to subsequently enforce that provision or any other provision.
                  </p>
                </div>
              </div>

              {/* Section 12: Contact Information */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">12. Contact Information</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  If you have any questions, concerns, or comments regarding these Terms, please contact us at:
                </p>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  <strong>Email:</strong> <a href="mailto:support@localcook.shop" className="text-[var(--color-primary)] hover:underline">support@localcook.shop</a>
                </p>
              </div>

              {/* Closing Statement */}
              <div className="mt-10 pt-6 border-t border-[var(--color-charcoal)]/10">
                <p className="text-base text-[var(--color-charcoal)]/80 font-semibold">
                  By using the Local Cooks Service, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                </p>
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

export default function TermsPage() {
  return (
    <SmoothScroll>
      <TermsPageContent />
    </SmoothScroll>
  )
}

