import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { useSmoothScroll } from '../hooks/useSmoothScroll'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Chefs', href: '#chefs' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '/contact', isRoute: true },
]

// Threshold for navbar "pop out" effect (in pixels)
const SCROLL_THRESHOLD = 30

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const { scrollTo } = useSmoothScroll()
  const location = useLocation()

  // Handle smooth scroll for anchor links
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    scrollTo(href, {
      duration: 1.5,
      offset: -80,
    })
    // Close mobile menu if open
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      // Simple scroll detection - no animations, just state change
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    
    // Check initial scroll position
    handleScroll()
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* 
        Navbar - stays fixed in place, no moving animations
        Only transitions: glass effect, shadow, padding when scrolled
        The "pop out" is achieved via subtle elevation (shadow) and glass blur
      */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          // Smooth CSS transitions for the "pop out" glass effect
          transition: 'background-color 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease, padding 0.3s ease, border-color 0.4s ease',
          // Glass morphism when scrolled (the "pop out" effect)
          backgroundColor: isScrolled ? 'rgba(255, 249, 245, 0.88)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          // Elevated shadow for "pop out" feel
          boxShadow: isScrolled 
            ? '0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)' 
            : 'none',
          // Subtle padding change
          padding: isScrolled ? '0.5rem 0' : '1rem 0',
          // Subtle bottom border for definition
          borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between w-full box-border">
          {/* Logo - Using actual LocalCooks logo */}
          <a 
            href="#home" 
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-3 group"
          >
            <motion.div 
              className="w-12 h-12 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <img 
                src="/logo-lc.png" 
                alt="LocalCooks Logo" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </motion.div>
            <span className="font-display text-3xl tracking-tight text-[var(--color-primary)]">
              LocalCooks
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              'isRoute' in link && link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-body transition-colors duration-300 relative group ${
                    location.pathname === link.href 
                      ? 'text-[var(--color-primary)]' 
                      : 'text-[var(--color-charcoal)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[var(--color-primary)] transition-all duration-300 ${
                    location.pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="font-body text-[var(--color-charcoal)] hover:text-[var(--color-primary)] transition-colors duration-300 relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-primary)] group-hover:w-full transition-all duration-300" />
                </a>
              )
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="https://local-cooks-community.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-[var(--color-charcoal-light)] hover:text-[var(--color-primary)] transition-colors duration-300"
            >
              For Chefs
            </a>
            <a
              href="https://localcook.shop/app/index.php"
              className="btn-primary bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-6 py-3 rounded-full font-body font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-[var(--color-primary)]/20 flex items-center gap-2"
            >
              {/* Delivery truck icon from Pretty Patty */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M16.4 17.6C16.4 19.4778 17.8775 21 19.7 21C21.5225 21 23 19.4778 23 17.6C23 15.7222 21.5225 14.2 19.7 14.2C17.8775 14.2 16.4 15.7222 16.4 17.6ZM16.4 17.6L10.9 17.5997M10.9 17.5997V15.7452C10.9 13.4136 10.9 12.249 10.2554 11.5245C9.6108 10.8 8.5746 10.8 6.5 10.8H5.84C5.4319 10.8 5.2273 10.8 5.0546 10.8148C4.01011 10.9072 3.02922 11.4154 2.28838 12.248C1.54754 13.0807 1.09536 14.1831 1.0132 15.357C1 15.5511 1 15.7823 1 16.2398C1 16.3547 1 16.4128 1.0033 16.4598C1.02373 16.7535 1.1368 17.0293 1.32214 17.2376C1.50747 17.4459 1.75289 17.573 2.0142 17.596C2.07942 17.5994 2.14471 17.6006 2.21 17.5997H10.9ZM4.3 7.39972H9.8M2.1 4H7.6M12 4H12.5421C13.7772 4 14.3942 4 14.8901 4.38122C15.387 4.76117 15.6631 5.44713 16.2145 6.81903L19.1867 14.2M18.3068 11.65L19.006 11.01C19.276 10.7626 19.4115 10.6402 19.5049 10.4783C19.5689 10.3689 19.6185 10.2475 19.6517 10.1187C19.7 9.92875 19.7 9.72093 19.7 9.30528C19.7 8.51733 19.7 8.12462 19.5645 7.8301C19.4735 7.6325 19.3417 7.46873 19.1826 7.3558C18.9464 7.1875 18.6282 7.1875 17.9947 7.1875H16.62M9.25 17.6C9.25 18.5017 8.90232 19.3665 8.28345 20.0042C7.66458 20.6418 6.82521 21 5.95 21C5.07479 21 4.23542 20.6418 3.61655 20.0042C2.99768 19.3665 2.65 18.5017 2.65 17.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Order Now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden relative w-10 h-10 flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`w-full h-0.5 bg-[var(--color-charcoal)] transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 bg-[var(--color-charcoal)] transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-full h-0.5 bg-[var(--color-charcoal)] transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-0 right-0 w-80 h-full bg-[var(--color-cream)] shadow-2xl pt-24 px-8"
            >
              <div className="flex flex-col gap-6">
                {navLinks.map((link, index) => (
                  'isRoute' in link && link.isRoute ? (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`font-heading text-2xl transition-colors ${
                          location.pathname === link.href 
                            ? 'text-[var(--color-primary)]' 
                            : 'text-[var(--color-charcoal)] hover:text-[var(--color-primary)]'
                        }`}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.a
                      key={link.name}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={(e) => {
                        handleNavClick(e, link.href)
                        setIsMobileMenuOpen(false)
                      }}
                      className="font-heading text-2xl text-[var(--color-charcoal)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {link.name}
                    </motion.a>
                  )
                ))}
                <hr className="border-[var(--color-cream-dark)] my-4" />
                <a
                  href="https://local-cooks-community.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[var(--color-charcoal-light)]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  For Chefs
                </a>
                <a
                  href="https://localcook.shop/app/index.php"
                  className="btn-primary bg-[var(--color-primary)] text-white px-6 py-4 rounded-full font-body font-semibold text-center flex items-center justify-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {/* Delivery truck icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                    <path d="M16.4 17.6C16.4 19.4778 17.8775 21 19.7 21C21.5225 21 23 19.4778 23 17.6C23 15.7222 21.5225 14.2 19.7 14.2C17.8775 14.2 16.4 15.7222 16.4 17.6ZM16.4 17.6L10.9 17.5997M10.9 17.5997V15.7452C10.9 13.4136 10.9 12.249 10.2554 11.5245C9.6108 10.8 8.5746 10.8 6.5 10.8H5.84C5.4319 10.8 5.2273 10.8 5.0546 10.8148C4.01011 10.9072 3.02922 11.4154 2.28838 12.248C1.54754 13.0807 1.09536 14.1831 1.0132 15.357C1 15.5511 1 15.7823 1 16.2398C1 16.3547 1 16.4128 1.0033 16.4598C1.02373 16.7535 1.1368 17.0293 1.32214 17.2376C1.50747 17.4459 1.75289 17.573 2.0142 17.596C2.07942 17.5994 2.14471 17.6006 2.21 17.5997H10.9ZM4.3 7.39972H9.8M2.1 4H7.6M12 4H12.5421C13.7772 4 14.3942 4 14.8901 4.38122C15.387 4.76117 15.6631 5.44713 16.2145 6.81903L19.1867 14.2M18.3068 11.65L19.006 11.01C19.276 10.7626 19.4115 10.6402 19.5049 10.4783C19.5689 10.3689 19.6185 10.2475 19.6517 10.1187C19.7 9.92875 19.7 9.72093 19.7 9.30528C19.7 8.51733 19.7 8.12462 19.5645 7.8301C19.4735 7.6325 19.3417 7.46873 19.1826 7.3558C18.9464 7.1875 18.6282 7.1875 17.9947 7.1875H16.62M9.25 17.6C9.25 18.5017 8.90232 19.3665 8.28345 20.0042C7.66458 20.6418 6.82521 21 5.95 21C5.07479 21 4.23542 20.6418 3.61655 20.0042C2.99768 19.3665 2.65 18.5017 2.65 17.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Order Now
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
