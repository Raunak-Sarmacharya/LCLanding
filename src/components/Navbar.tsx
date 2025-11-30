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

// ============================================
// les-arbres-fruitiers.fr inspired FULL-SCREEN menu
// Key: clipPath reveal animation from circle to full screen
// ============================================

// The color splash background - reveals via clipPath from top-right (burger position)
const colorSplashVariants = {
  closed: {
    clipPath: 'circle(0% at calc(100% - 40px) 40px)',
    transition: {
      duration: 0.6,
      ease: [0.77, 0, 0.175, 1], // Custom easing for smooth close
      delay: 0.3, // Wait for content to fade out first
    }
  },
  open: {
    clipPath: 'circle(150% at calc(100% - 40px) 40px)',
    transition: {
      duration: 0.8,
      ease: [0.77, 0, 0.175, 1], // Smooth reveal easing
    }
  }
}

// Menu content container - appears AFTER the splash reveals
const menuContentVariants = {
  closed: {
    opacity: 0,
    transition: {
      duration: 0.2,
      when: 'beforeChildren',
    }
  },
  open: {
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: 0.5, // Wait for color splash to reveal first
      when: 'beforeChildren',
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
}

// Individual menu items - slide up and fade in with stagger
const menuItemVariants = {
  closed: { 
    opacity: 0, 
    y: 40,
    transition: {
      duration: 0.2,
    }
  },
  open: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // Smooth easeOut
    }
  }
}

// Secondary items (CTA, links at bottom) - delayed more
const secondaryItemVariants = {
  closed: { 
    opacity: 0, 
    y: 20,
    transition: {
      duration: 0.15,
    }
  },
  open: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }
  }
}

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* 
        Navbar - stays fixed in place, no moving animations
        Only transitions: glass effect, shadow, padding when scrolled
        The "pop out" is achieved via subtle elevation (shadow) and glass blur
        
        IMPORTANT: When mobile menu is open, we hide the navbar logo to prevent overlap
      */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? 'pointer-events-none' : ''
        }`}
        style={{
          // Smooth CSS transitions for the "pop out" glass effect
          transition: 'background-color 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease, padding 0.3s ease, border-color 0.4s ease',
          // Glass morphism when scrolled (the "pop out" effect)
          backgroundColor: isMobileMenuOpen ? 'transparent' : (isScrolled ? 'rgba(255, 249, 245, 0.88)' : 'transparent'),
          backdropFilter: isMobileMenuOpen ? 'none' : (isScrolled ? 'blur(20px) saturate(180%)' : 'none'),
          WebkitBackdropFilter: isMobileMenuOpen ? 'none' : (isScrolled ? 'blur(20px) saturate(180%)' : 'none'),
          // Elevated shadow for "pop out" feel
          boxShadow: isMobileMenuOpen ? 'none' : (isScrolled 
            ? '0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)' 
            : 'none'),
          // Subtle padding change
          padding: isScrolled ? '0.5rem 0' : '1rem 0',
          // Subtle bottom border for definition
          borderBottom: isMobileMenuOpen ? 'none' : (isScrolled ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid transparent'),
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between w-full box-border">
          {/* Logo - Using actual LocalCooks logo - HIDDEN when mobile menu is open */}
          <a 
            href="#home" 
            onClick={(e) => handleNavClick(e, '#home')}
            className={`flex items-center gap-3 group transition-opacity duration-300 ${
              isMobileMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
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

              {/* 
                Mobile Menu Button - les-arbres-fruitiers.fr style
                Rounded button with animated hamburger lines
                Uses brand primary color, transforms to X when open
              */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 pointer-events-auto"
                style={{
                  backgroundColor: isMobileMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'var(--color-primary)',
                  boxShadow: isMobileMenuOpen ? 'none' : '0 4px 15px rgba(229, 62, 62, 0.3)',
                }}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <div className="w-5 h-4 relative flex flex-col justify-center items-center">
                  {/* Top line */}
                  <span
                    className="absolute w-5 h-[2px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]"
                    style={{
                      backgroundColor: 'white',
                      transform: isMobileMenuOpen 
                        ? 'translateY(0) rotate(45deg)' 
                        : 'translateY(-5px) rotate(0deg)',
                    }}
                  />
                  {/* Middle line */}
                  <span
                    className="absolute w-5 h-[2px] rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: 'white',
                      opacity: isMobileMenuOpen ? 0 : 1,
                      transform: isMobileMenuOpen ? 'scaleX(0)' : 'scaleX(1)',
                    }}
                  />
                  {/* Bottom line */}
                  <span
                    className="absolute w-5 h-[2px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]"
                    style={{
                      backgroundColor: 'white',
                      transform: isMobileMenuOpen 
                        ? 'translateY(0) rotate(-45deg)' 
                        : 'translateY(5px) rotate(0deg)',
                    }}
                  />
                </div>
              </button>
        </div>
      </nav>

      {/* Mobile Menu - FULL SCREEN with les-arbres-fruitiers.fr color splash reveal */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu-fullscreen"
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* 
              COLOR SPLASH BACKGROUND
              This is the key effect - a full-screen color that reveals via clipPath animation
              Expands from a circle at the burger button position to cover the whole screen
            */}
            <motion.div
              variants={colorSplashVariants}
              className="absolute inset-0 bg-[var(--color-primary)]"
              style={{
                // Fallback for browsers that don't support clipPath animation well
                willChange: 'clip-path',
              }}
            />

            {/* 
              MENU CONTENT 
              Appears AFTER the color splash reveals
              Uses staggered animations for each item
            */}
            <motion.nav
              variants={menuContentVariants}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              {/* Top bar with logo only - close button is the hamburger which transforms to X */}
              <motion.div 
                variants={menuItemVariants}
                className="flex items-center px-4 py-4"
                style={{ paddingTop: isScrolled ? '0.5rem' : '1rem' }}
              >
                {/* Logo in menu - white version */}
                <div className="flex items-center gap-2">
                  <img 
                    src="/logo-lc.png" 
                    alt="LocalCooks" 
                    className="w-10 h-10 object-contain brightness-0 invert"
                  />
                  <span className="font-display text-2xl text-white">
                    LocalCooks
                  </span>
                </div>
              </motion.div>

              {/* Main navigation links - centered and large */}
              <div className="flex-1 flex flex-col justify-center px-8 -mt-16">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link, index) => (
                    'isRoute' in link && link.isRoute ? (
                      <motion.div
                        key={link.name}
                        variants={menuItemVariants}
                        className="overflow-hidden"
                      >
                        <Link
                          to={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`group relative block py-2 font-heading text-4xl sm:text-5xl transition-all duration-300 ${
                            location.pathname === link.href 
                              ? 'text-white' 
                              : 'text-white/70 hover:text-white'
                          }`}
                        >
                          <span className="relative inline-block">
                            {link.name}
                            {/* Animated underline */}
                            <span 
                              className={`absolute -bottom-1 left-0 h-[3px] bg-white transition-all duration-400 ease-out ${
                                location.pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                              }`} 
                            />
                          </span>
                        </Link>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={link.name}
                        variants={menuItemVariants}
                        className="overflow-hidden"
                      >
                        <a
                          href={link.href}
                          onClick={(e) => {
                            handleNavClick(e, link.href)
                            setIsMobileMenuOpen(false)
                          }}
                          className="group relative block py-2 font-heading text-4xl sm:text-5xl text-white/70 hover:text-white transition-all duration-300"
                        >
                          <span className="relative inline-block">
                            {link.name}
                            {/* Animated underline */}
                            <span className="absolute -bottom-1 left-0 w-0 h-[3px] bg-white group-hover:w-full transition-all duration-400 ease-out" />
                          </span>
                        </a>
                      </motion.div>
                    )
                  ))}
                </div>
              </div>

              {/* Bottom section with CTA and secondary links */}
              <motion.div 
                variants={secondaryItemVariants}
                className="px-8 pb-8 space-y-6"
              >
                {/* Divider line */}
                <div className="h-[1px] bg-white/20" />

                {/* Secondary links row */}
                <div className="flex items-center justify-between">
                  <a
                    href="https://local-cooks-community.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-white/60 hover:text-white transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    For Chefs →
                  </a>
                </div>

                {/* CTA Button - white on primary background */}
                <a
                  href="https://localcook.shop/app/index.php"
                  className="group relative overflow-hidden flex items-center justify-center gap-3 bg-white text-[var(--color-primary)] px-8 py-4 rounded-full font-body font-bold text-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {/* Delivery truck icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <path d="M16.4 17.6C16.4 19.4778 17.8775 21 19.7 21C21.5225 21 23 19.4778 23 17.6C23 15.7222 21.5225 14.2 19.7 14.2C17.8775 14.2 16.4 15.7222 16.4 17.6ZM16.4 17.6L10.9 17.5997M10.9 17.5997V15.7452C10.9 13.4136 10.9 12.249 10.2554 11.5245C9.6108 10.8 8.5746 10.8 6.5 10.8H5.84C5.4319 10.8 5.2273 10.8 5.0546 10.8148C4.01011 10.9072 3.02922 11.4154 2.28838 12.248C1.54754 13.0807 1.09536 14.1831 1.0132 15.357C1 15.5511 1 15.7823 1 16.2398C1 16.3547 1 16.4128 1.0033 16.4598C1.02373 16.7535 1.1368 17.0293 1.32214 17.2376C1.50747 17.4459 1.75289 17.573 2.0142 17.596C2.07942 17.5994 2.14471 17.6006 2.21 17.5997H10.9ZM4.3 7.39972H9.8M2.1 4H7.6M12 4H12.5421C13.7772 4 14.3942 4 14.8901 4.38122C15.387 4.76117 15.6631 5.44713 16.2145 6.81903L19.1867 14.2M18.3068 11.65L19.006 11.01C19.276 10.7626 19.4115 10.6402 19.5049 10.4783C19.5689 10.3689 19.6185 10.2475 19.6517 10.1187C19.7 9.92875 19.7 9.72093 19.7 9.30528C19.7 8.51733 19.7 8.12462 19.5645 7.8301C19.4735 7.6325 19.3417 7.46873 19.1826 7.3558C18.9464 7.1875 18.6282 7.1875 17.9947 7.1875H16.62M9.25 17.6C9.25 18.5017 8.90232 19.3665 8.28345 20.0042C7.66458 20.6418 6.82521 21 5.95 21C5.07479 21 4.23542 20.6418 3.61655 20.0042C2.99768 19.3665 2.65 18.5017 2.65 17.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Order Now</span>
                </a>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
