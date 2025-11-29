import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

const footerLinks = {
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'For Chefs', href: 'https://local-cooks-community.vercel.app/' },
    { name: 'Careers', href: '#careers' },
  ],
  support: [
    { name: 'Help Center', href: '#help' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'Food Safety', href: '#safety' },
    { name: 'FAQs', href: '#faqs' },
  ],
  legal: [
    { name: 'Terms of Service', href: '#terms' },
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Cookie Policy', href: '#cookies' },
  ],
}

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/localcooks',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/localcooks',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/localcooks',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@localcooks',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
]

export default function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { scrollToTop } = useSmoothScroll()

  // Handle smooth scroll to top
  const handleBackToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToTop({
      duration: 1.2,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setEmail('')
      setTimeout(() => setIsSubmitted(false), 3000)
    }
  }

  return (
    <footer id="contact" ref={ref} className="bg-[var(--color-charcoal)] pt-24 pb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/30 to-transparent" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[var(--color-primary)] rounded-full blur-3xl opacity-5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-[30px] sm:rounded-[40px] p-6 sm:p-8 md:p-12 mb-12 sm:mb-16 md:mb-20 relative overflow-hidden shadow-2xl shadow-[var(--color-primary)]/20"
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5L5 20l15 15 15-15L20 5z' fill='white' fill-opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="relative grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl text-white mb-3 sm:mb-4">
                Stay in the Loop! 📬
              </h3>
              <p className="font-body text-sm sm:text-base text-white/80">
                Get exclusive deals, new chef announcements, and delicious inspiration delivered to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:border-white font-body"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-[var(--color-primary)] rounded-full font-body font-semibold hover:bg-[var(--color-butter)] transition-colors duration-300 whitespace-nowrap"
              >
                {isSubmitted ? '✓ Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <span className="font-display text-3xl">
                <span className="text-[var(--color-primary)]">Local</span>
                <span className="text-white">Cooks</span>
              </span>
            </a>
            <p className="font-body text-white/60 mb-6 max-w-sm leading-relaxed">
              Connecting you with passionate local chefs who bring authentic, 
              homemade flavors right to your doorstep.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[var(--color-primary)] transition-colors duration-300"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="font-body text-white/60 hover:text-[var(--color-primary)] transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg text-white mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="font-body text-white/60 hover:text-[var(--color-primary)] transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="font-body text-white/60 hover:text-[var(--color-primary)] transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-sm text-white/40">
            © {new Date().getFullYear()} <span className="font-display text-[var(--color-primary)]">Local Cooks</span>. All rights reserved.
          </p>
          <p className="font-mono text-sm text-white/40">
            Made with ❤️ for food lovers everywhere
          </p>
        </div>
      </div>

      {/* Back to top button */}
      <motion.a
        href="#home"
        onClick={handleBackToTop}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/30 hover:scale-110 transition-transform duration-300 z-40"
        aria-label="Back to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.a>
    </footer>
  )
}
