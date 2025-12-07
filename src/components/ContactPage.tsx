import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import { Link } from 'react-router-dom'
import SmoothScroll from './SmoothScroll'
import { useSmoothScroll } from '../hooks/useSmoothScroll'
import { useLenis } from '../contexts/LenisContext'

type InquiryType = 'general' | 'chef'

// Topic options for general inquiry dropdown
const topicOptions = [
  { value: '', label: 'Select topic' },
  { value: 'question', label: 'I have a question about Local Cooks' },
  { value: 'media', label: 'Media inquiry / Press' },
  { value: 'partnership', label: 'Partnership opportunity' },
  { value: 'feedback', label: 'Feedback or suggestion' },
  { value: 'other', label: 'Other' },
]

// Modern minimal social icons - Lucide-style line icons
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

// Main navigation links for contact page footer
const mainNavLinks = [
  { name: 'About Us', href: '/#about' },
  { name: 'How It Works', href: '/#how-it-works' },
  { name: 'For Chefs', href: 'https://local-cooks-community.vercel.app/', external: true },
]

// Legal links for bottom bar
const legalLinks = [
  { name: 'Terms of Service', href: '/terms', isRoute: true },
  { name: 'Privacy Policy', href: '/privacy', isRoute: true },
]

function ContactPageContent() {
  const [inquiryType, setInquiryType] = useState<InquiryType>('general')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTopicOpen, setIsTopicOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const isFooterInView = useInView(footerRef, { once: true, margin: '-50px' })
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    topic: '',
    cookingDescription: '',
    experience: '',
    heardFrom: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTopicSelect = (value: string) => {
    setFormData(prev => ({ ...prev, topic: value }))
    setIsTopicOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      // Determine API base URL
      const apiBaseUrl = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? '/api'
          : `${window.location.origin}/api`)
        : '/api'

      const response = await fetch(`${apiBaseUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          message: formData.message.trim() || undefined,
          inquiryType,
          topic: formData.topic || undefined,
          cookingDescription: formData.cookingDescription.trim() || undefined,
          experience: formData.experience.trim() || undefined,
          heardFrom: formData.heardFrom.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to submit contact form')
      }

      // Success - show verification message
      setIsSubmitting(false)
      setIsSubmitted(true)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        topic: '',
        cookingDescription: '',
        experience: '',
        heardFrom: '',
      })
    } catch (err) {
      console.error('Contact form submission error:', err)
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleBackToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop({ duration: 1.2 })
  }

  // Reset form when switching inquiry type
  const handleInquiryTypeChange = (type: InquiryType) => {
    setInquiryType(type)
    setIsSubmitted(false)
    setError(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      topic: '',
      cookingDescription: '',
      experience: '',
      heardFrom: '',
    })
  }

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
              Let's Talk
            </h1>
            <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-lg mx-auto">
              Whether you have a question or want to join our community of talented home chefs, we'd love to hear from you.
            </p>
          </motion.div>

          {/* Success State */}
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 mx-auto mb-8 bg-[var(--color-sage)]/20 rounded-full flex items-center justify-center"
                >
                  <svg className="w-12 h-12 text-[var(--color-sage)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                
                {inquiryType === 'general' ? (
                  <>
                    <h2 className="font-heading text-3xl sm:text-4xl text-[var(--color-charcoal)] mb-4">
                      Check Your Email! 📧
                    </h2>
                    <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-md mx-auto mb-8">
                      We've received your message! Please check your email and click the verification link to confirm your submission. Once verified, we'll get back to you within 24 hours.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading text-3xl sm:text-4xl text-[var(--color-charcoal)] mb-4">
                      Check Your Email! 📧
                    </h2>
                    <p className="font-body text-lg text-[var(--color-charcoal)]/60 max-w-md mx-auto mb-8">
                      Thank you for your interest! Please check your email and click the verification link to confirm your application. Once verified, we'll review your submission and be in touch within 1-2 business days.
                    </p>
                  </>
                )}
                
                <motion.button
                  onClick={() => setIsSubmitted(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="font-body text-[var(--color-primary)] hover:underline"
                >
                  Send another message
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-12"
              >
                {/* Inquiry Type Selection - Conversational style */}
                <div className="space-y-4">
                  <p className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] leading-relaxed">
                    Hello, I would like to talk to you about
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      type="button"
                      onClick={() => handleInquiryTypeChange('general')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-3 rounded-full font-body font-semibold text-base transition-all duration-300 ${
                        inquiryType === 'general'
                          ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                          : 'bg-transparent text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
                      }`}
                    >
                      General Inquiry
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => handleInquiryTypeChange('chef')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-3 rounded-full font-body font-semibold text-base transition-all duration-300 ${
                        inquiryType === 'chef'
                          ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                          : 'bg-transparent text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5'
                      }`}
                    >
                      Joining as a Chef
                    </motion.button>
                  </div>
                </div>

                {/* Name Field - Conversational inline */}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
                  <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)]">My name is</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="flex-1 min-w-[200px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-[var(--color-charcoal)] transition-colors duration-300"
                    placeholder=""
                  />
                </div>

                {/* Dynamic Fields Based on Inquiry Type */}
                <AnimatePresence mode="wait">
                  {inquiryType === 'general' ? (
                    <motion.div
                      key="general-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="space-y-12 overflow-hidden"
                    >
                      {/* Topic Selection - Custom dropdown */}
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
                        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)]">and I would like to discuss</span>
                        <div className="relative flex-1 min-w-[280px]">
                          <button
                            type="button"
                            onClick={() => setIsTopicOpen(!isTopicOpen)}
                            className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-left transition-colors duration-300 flex items-center justify-between"
                          >
                            <span className={formData.topic ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-charcoal)]/40'}>
                              {formData.topic ? topicOptions.find(o => o.value === formData.topic)?.label : 'Select topic'}
                            </span>
                            <svg 
                              className={`w-5 h-5 text-[var(--color-charcoal)]/40 transition-transform duration-300 ${isTopicOpen ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          <AnimatePresence>
                            {isTopicOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-black/10 border border-[var(--color-charcoal)]/10 overflow-hidden z-20"
                              >
                                {topicOptions.filter(o => o.value).map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleTopicSelect(option.value)}
                                    className={`w-full px-4 py-3 text-left font-body text-base hover:bg-[var(--color-primary)]/5 transition-colors duration-200 ${
                                      formData.topic === option.value ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-charcoal)]'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Message Field */}
                      <div className="space-y-4">
                        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">Here is my message:</span>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
                          placeholder="What's on your mind? Tell us everything..."
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chef-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className="space-y-12 overflow-hidden"
                    >

                                            {/* Experience Field */}
                                            <div className="space-y-4">
                        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
                          Here is my message:
                        </span>
                        <p className="font-body text-base text-[var(--color-charcoal)]/50 -mt-2">
                          Tell us why you're reaching out — whether it's a question, feedback, partnership idea, or just to say hello.
                        </p>
                        <textarea
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
                          placeholder=""
                        />
                      </div>
                      
                      {/* Cooking Description */}
                      <div className="space-y-4">
                        <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
                          Tell us about your cooking
                          <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
                        </span>
                        <p className="font-body text-base text-[var(--color-charcoal)]/50 -mt-2">
                          What cuisines do you specialize in? What's your cooking style or philosophy?
                        </p>
                        <textarea
                          name="cookingDescription"
                          value={formData.cookingDescription}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-3 px-1 font-body text-lg text-[var(--color-charcoal)] transition-colors duration-300 resize-none leading-relaxed"
                          placeholder=""
                        />
                      </div>



                      {/* How did you find us */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
                          <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)]">
                            I found you through
                            <span className="text-[var(--color-charcoal)]/40 text-lg ml-2">(Optional)</span>
                          </span>
                          <input
                            type="text"
                            name="heardFrom"
                            value={formData.heardFrom}
                            onChange={handleInputChange}
                            className="flex-1 min-w-[200px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-[var(--color-charcoal)] transition-colors duration-300"
                            placeholder=""
                          />
                        </div>
                        <p className="font-body text-sm text-[var(--color-charcoal)]/40">
                          Word of mouth, Instagram, Google search, friend referral, event, etc.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Contact Information Section */}
                <div className="space-y-6 pt-4">
                  <span className="font-heading text-2xl sm:text-3xl text-[var(--color-charcoal)] block">
                    Your Contact Details
                  </span>
                  
                  {/* Email */}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
                    <span className="font-body text-xl text-[var(--color-charcoal)]/70">Email:</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="flex-1 min-w-[200px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-[var(--color-charcoal)] transition-colors duration-300"
                      placeholder=""
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
                    <span className="font-body text-xl text-[var(--color-charcoal)]/70">
                      Phone:
                      <span className="text-[var(--color-charcoal)]/40 text-base ml-2">(Optional)</span>
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="flex-1 min-w-[180px] bg-transparent border-b-2 border-[var(--color-charcoal)]/20 focus:border-[var(--color-primary)] outline-none py-2 px-1 font-body text-xl text-[var(--color-charcoal)] transition-colors duration-300"
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Privacy Notice */}
                <p className="font-body text-sm text-[var(--color-charcoal)]/50 leading-relaxed">
                  By submitting this form, I acknowledge that I have read and agree to LocalCooks'{' '}
                  <Link to="/privacy" className="text-[var(--color-primary)] hover:underline transition-colors">Privacy Policy</Link>{' '}
                  and{' '}
                  <Link to="/terms" className="text-[var(--color-primary)] hover:underline transition-colors">Terms of Service</Link>.
                </p>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-body text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className={`bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-10 py-4 rounded-full font-body font-semibold text-lg transition-all duration-300 shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:shadow-[var(--color-primary)]/35 flex items-center gap-3 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>{inquiryType === 'general' ? 'Send My Message' : "Let's Cook Together"}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer - Same style as main footer but with "Home" instead of "Contact Us" */}
      <footer ref={footerRef} className="bg-white relative overflow-x-clip">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 pb-10 w-full box-border">
          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-0">
            
            {/* Left Column: Home Link */}
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

            {/* Right Column: All Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isFooterInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="lg:w-[55%] flex flex-col justify-between lg:pl-8 lg:border-l lg:border-[var(--color-charcoal)]/10"
            >
              {/* Top Row: Contact Info */}
              <div className="flex flex-wrap gap-x-8 gap-y-6 mb-8">
                {/* Talk to us */}
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
                      href="mailto:admin@localcook."
                      className="block font-body text-[var(--color-charcoal)]/60 text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                    >
                      admin@localcook.shop
                    </a>
                  </div>
                </div>

                {/* Come see us */}
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

                {/* Follow us */}
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

              {/* Bottom Row: Nav Links + Logo */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                {/* Navigation Links */}
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
                      ) : (
                        <Link
                          to={link.href}
                          className="font-body font-semibold text-[var(--color-charcoal)] text-sm hover:text-[var(--color-primary)] transition-colors duration-200"
                        >
                          {link.name}
                        </Link>
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

                {/* Brand Logo */}
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

        {/* Bottom Bar with Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isFooterInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-[var(--color-primary)] overflow-x-clip"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 w-full box-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Legal Links */}
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

              {/* Copyright */}
              <p className="font-mono text-[10px] text-white/70 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 rounded-full bg-white/50" />
                {new Date().getFullYear()}, LocalCooks. Made with ❤️ for food lovers.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to top button - only visible when scrolled past threshold */}
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

// Wrapper component that provides SmoothScroll
export default function ContactPage() {
  return (
    <SmoothScroll>
      <ContactPageContent />
    </SmoothScroll>
  )
}
