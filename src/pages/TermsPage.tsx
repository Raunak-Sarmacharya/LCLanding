import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import SmoothScroll from '../components/SmoothScroll'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'
import SEOHead from '../components/SEO/SEOHead'

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
      {/* SEO Head - Terms Page */}
      <SEOHead
        title="Terms of Service"
        description="Read the Terms of Service for LocalCooks. Understand your rights and responsibilities when using our platform to order homemade meals from local chefs in St. John's, Newfoundland."
        canonicalUrl="/terms"
        noIndex={false}
        breadcrumbs={[
          { name: 'Home', url: 'https://www.localcooks.ca' },
          { name: 'Terms of Service', url: 'https://www.localcooks.ca/terms' },
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
                <p className="text-base text-[var(--color-charcoal)]/90 font-bold uppercase">
                  PLEASE READ THESE TERMS AND CONDITIONS ("TERMS") CAREFULLY. THIS IS A BINDING LEGAL AGREEMENT.
                </p>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  These Terms of Service (the "Agreement") constitute a legally binding contract between Local Cooks Inc. ("Local Cooks," "we," "us," or "our"), a corporation organized under the laws of Newfoundland and Labrador, and you ("User," "you," or "your").
                </p>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  This Agreement governs your access to and use of the Local Cooks mobile application, website (www.localcook.shop), and all related services, features, content, and applications offered by us (collectively, the "Platform").
                </p>
                <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                  BY CLICKING "I AGREE," REGISTERING FOR AN ACCOUNT, OR ACCESSING THE PLATFORM, YOU EXPRESSLY ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS AGREEMENT. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE USE OF THE PLATFORM.
                </p>
                <div className="bg-[var(--color-primary)]/5 border-l-4 border-[var(--color-primary)] p-4 rounded-r-lg">
                  <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                    NOTICE REGARDING DISPUTE RESOLUTION: SECTION 14 CONTAINS A MANDATORY ARBITRATION PROVISION AND CLASS ACTION WAIVER THAT AFFECTS HOW DISPUTES BETWEEN YOU AND LOCAL COOKS ARE RESOLVED.
                  </p>
                </div>
              </div>

              {/* Section 1: The Local Cooks Platform */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">1. The Local Cooks Platform</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.1 Marketplace Model (Crucial Distinction)</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You acknowledge and agree that Local Cooks operates as a technology marketplace that connects consumers ("Diners") with independent third-party chefs and food preparers ("Chefs") for the sale and delivery of meals. Local Cooks is not a restaurant, caterer, or food preparation entity. The Chefs are independent business owners and are not employees, partners, or agents of Local Cooks.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">1.2 No Control Over Food Preparation</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Local Cooks does not control, oversee, or inspect the food preparation processes, ingredients, or kitchens of the Chefs. We make no representations or warranties regarding the safety, quality, or legality of the meals provided by Chefs.
                  </p>
                </div>
              </div>

              {/* Section 2: Eligibility and Accounts */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">2. Eligibility and Accounts</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.1 Eligibility</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    By using the Platform, you represent and warrant that: (a) you are at least the age of majority in your jurisdiction of residence; (b) you have the legal capacity to enter into binding contracts; and (c) your use of the Platform does not violate any applicable law or regulation.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">2.2 Account Registration & Security</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    To access certain features, you must register an account. You agree to provide accurate, current, and complete information. You are solely responsible for safeguarding your login credentials. You accept full responsibility for all activities that occur under your account, whether or not you authorized them. You must notify us immediately at <a href="mailto:support@localcook.shop" className="text-[var(--color-primary)] hover:underline">support@localcook.shop</a> of any unauthorized use.
                  </p>
                </div>
              </div>

              {/* Section 3: Orders, Pricing, and Payments */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">3. Orders, Pricing, and Payments</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">3.1 Pricing</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Prices for meals are set by the Chefs. Local Cooks may add administrative fees, delivery fees, service charges, and applicable taxes (e.g., HST/GST) to your order. The final price will be displayed prior to checkout.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">3.2 Payment Processing</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We use third-party payment processors, primarily Stripe, to bill you. The processing of payments is subject to the terms, conditions, and privacy policies of the Payment Processor in addition to this Agreement. You authorize us to charge your designated payment method for the total amount of your order.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">3.3 No Refunds; All Sales Final</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Unless otherwise required by law or explicitly stated by Local Cooks in writing, all orders are final and non-refundable once confirmed. Local Cooks, in its sole discretion, may offer credits or refunds for issues such as missing items or severe quality defects, provided such issues are reported within 2 hours of delivery.
                  </p>
                </div>
              </div>

              {/* Section 4: Delivery Services */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">4. Delivery Services</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.1 Delivery Coordination</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Local Cooks arranges for delivery through independent contractors or third-party logistics providers ("Couriers"). Estimated delivery times are non-binding estimates and not guarantees.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">4.2 Unattended Delivery & Spoilage Risk</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If you are not available to receive the delivery at the designated address, you authorize the Courier to leave the order at your door or in a designated area. You acknowledge that the meals are perishable. Upon delivery (including unattended delivery), all risk of loss, spoilage, theft, or contamination passes to you. Local Cooks is not liable for the condition of food left unattended.
                  </p>
                </div>
              </div>

              {/* Section 5: Food Safety, Allergens, and Disclaimers */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">5. Food Safety, Allergens, and Disclaimers</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">5.1 Assumption of Risk</h3>
                  <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                    YOU ACKNOWLEDGE THAT LOCAL COOKS DOES NOT PREPARE FOOD AND CANNOT GUARANTEE THAT MEALS ARE FREE OF ALLERGENS. Chefs are solely responsible for ingredient disclosures. You understand that meals may be prepared in shared kitchens where cross-contamination with common allergens (nuts, dairy, shellfish, gluten, etc.) may occur.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">5.2 Release</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    You rely on the Chef's descriptions at your own risk. Local Cooks expressly disclaims any liability for illness, injury, allergic reactions, or other health impacts resulting from the consumption of meals ordered through the Platform.
                  </p>
                </div>
              </div>

              {/* Section 6: User Conduct and Restrictions */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">6. User Conduct and Restrictions</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/80">
                  <li>Use the Platform for any illegal purpose or in violation of any local, provincial, or federal law;</li>
                  <li>Decompile, reverse engineer, or disassemble the Platform;</li>
                  <li>Harass, threaten, or defraud Chefs, Couriers, or Local Cooks staff;</li>
                  <li>Use any robot, spider, or scraper to access the Platform for any purpose;</li>
                  <li>Create multiple accounts to abuse promotional codes or referral programs.</li>
                </ul>
              </div>

              {/* Section 7: Intellectual Property */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">7. Intellectual Property</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">7.1 Ownership</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Local Cooks and its licensors own all rights, title, and interest in the Platform, including all software, text, graphics, logos, and trademarks.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">7.2 License to User Content</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If you post reviews, photos, or feedback ("User Content"), you grant Local Cooks a non-exclusive, royalty-free, perpetual, worldwide license to use, display, reproduce, and modify such User Content for marketing and operational purposes.
                  </p>
                </div>
              </div>

              {/* Section 8: Third-Party Links */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">8. Third-Party Links</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  The Platform may contain links to third-party websites or services not owned by Local Cooks. We assume no responsibility for the content, privacy policies, or practices of any third-party websites.
                </p>
              </div>

              {/* Section 9: Privacy */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">9. Privacy</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  Your use of the Platform is governed by our <Link to="/privacy" className="text-[var(--color-primary)] hover:underline">Privacy Policy</Link>, which is incorporated herein by reference. By using the Platform, you consent to the collection and use of your data as outlined in the Privacy Policy.
                </p>
              </div>

              {/* Section 10: Term and Termination */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">10. Term and Termination</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  We may suspend or terminate your access to the Platform at our sole discretion, without notice or liability, for any reason, including breach of this Agreement. Provisions regarding Indemnification, Liability, and Intellectual Property shall survive termination.
                </p>
              </div>

              {/* Section 11: Disclaimer of Warranties */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">11. Disclaimer of Warranties</h2>
                <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                  THE PLATFORM AND ALL SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, LOCAL COOKS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                </p>
              </div>

              {/* Section 12: Limitation of Liability */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">12. Limitation of Liability</h2>
                <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LOCAL COOKS, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR:
                </p>
                <ul className="list-[upper-alpha] list-inside space-y-2 ml-4 text-base text-[var(--color-charcoal)]/90 font-semibold">
                  <li>ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES;</li>
                  <li>DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES;</li>
                  <li>DAMAGES ARISING FROM THE CONDUCT OF ANY CHEF OR COURIER; OR</li>
                  <li>PERSONAL INJURY OR PROPERTY DAMAGE RESULTING FROM YOUR ACCESS TO THE PLATFORM.</li>
                </ul>
                <p className="text-base text-[var(--color-charcoal)]/90 font-semibold mt-4">
                  IN NO EVENT SHALL LOCAL COOKS' TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (I) THE AMOUNT YOU PAID TO LOCAL COOKS IN THE SIX (6) MONTHS PRECEDING THE CLAIM, OR (II) ONE HUNDRED CANADIAN DOLLARS ($100 CAD).
                </p>
              </div>

              {/* Section 13: Indemnification */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">13. Indemnification</h2>
                <p className="text-base text-[var(--color-charcoal)]/80">
                  You agree to defend, indemnify, and hold harmless Local Cooks and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with: (a) your violation of these Terms; (b) your use of the Platform; (c) your violation of any third-party right; or (d) any dispute between you and a Chef or Courier.
                </p>
              </div>

              {/* Section 14: Dispute Resolution and Arbitration */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">14. Dispute Resolution and Arbitration</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">14.1 Governing Law</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Agreement is governed by the laws of the Province of Newfoundland and Labrador and the federal laws of Canada applicable therein, without regard to conflict of law principles.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">14.2 Binding Arbitration</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Any dispute arising out of or relating to this Agreement shall be finally resolved by binding arbitration pursuant to the Arbitration Act of Newfoundland and Labrador. The place of arbitration shall be St. John's, Newfoundland and Labrador.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">14.3 Class Action Waiver</h3>
                  <p className="text-base text-[var(--color-charcoal)]/90 font-semibold">
                    YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION AGAINST LOCAL COOKS.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">14.4 Small Claims</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    Notwithstanding the above, either party may bring an individual action in small claims court in Newfoundland and Labrador if the claim qualifies.
                  </p>
                </div>
              </div>

              {/* Section 15: General Provisions */}
              <div className="space-y-4">
                <h2 className="font-heading text-2xl sm:text-3xl text-[var(--color-primary)] font-bold mt-8 mb-4">15. General Provisions</h2>
                
                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">15.1 Severability</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    If any provision of this Agreement is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall remain in full force and effect.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">15.2 Entire Agreement</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    This Agreement constitutes the entire agreement between you and Local Cooks and supersedes all prior agreements.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">15.3 Modification</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    We reserve the right to modify these Terms at any time. Updated versions will be posted on the Platform. Continued use constitutes acceptance of the changes.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-body text-lg font-semibold text-[var(--color-charcoal)]">15.4 Contact</h3>
                  <p className="text-base text-[var(--color-charcoal)]/80">
                    For legal notices or support:
                  </p>
                  <div className="bg-[var(--color-cream-dark)]/30 p-4 rounded-lg">
                    <p className="text-base text-[var(--color-charcoal)]/80 font-semibold">Local Cooks Inc.</p>
                    <p className="text-base text-[var(--color-charcoal)]/80">
                      Email: <a href="mailto:support@localcook.shop" className="text-[var(--color-primary)] hover:underline">support@localcook.shop</a>
                    </p>
                  </div>
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

export default function TermsPage() {
  return (
    <SmoothScroll>
      <TermsPageContent />
    </SmoothScroll>
  )
}

