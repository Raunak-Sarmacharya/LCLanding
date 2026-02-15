import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import OrderNowButton from './ui/OrderNowButton'

// Session storage key for discount popup
const DISCOUNT_POPUP_SHOWN_KEY = 'localcooks_discount_popup_shown'

export default function DiscountPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if popup has already been shown this session
    const hasSeenPopup = sessionStorage.getItem(DISCOUNT_POPUP_SHOWN_KEY) === 'true'
    
    if (!hasSeenPopup) {
      // Delay appearance for better UX (after user has time to explore)
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 15000) // Show after 15 seconds
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem(DISCOUNT_POPUP_SHOWN_KEY, 'true')
  }

  // Handle Escape key
  useEffect(() => {
    if (!isVisible) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isVisible])

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleClose}
          />
          
          {/* Popup content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.4, 0, 0.2, 1]
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                onClick={handleClose}
                className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-20 hover:scale-110 transition-transform duration-200 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close popup"
              >
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-charcoal)] group-hover:text-[var(--color-primary)] transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>

              {/* CTA Card - Exact replica with center alignment */}
              <div className="bg-[var(--color-primary)] rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl shadow-[var(--color-primary)]/30 relative overflow-hidden text-center">
                {/* Emoji background decorations */}
                <motion.div
                  className="absolute -top-8 -right-8 text-7xl sm:text-8xl md:text-9xl opacity-20 select-none pointer-events-none"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎫
                </motion.div>
                
                {/* Food emojis scattered in background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute top-1/4 left-8 text-5xl sm:text-6xl opacity-15 select-none"
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 3, 0]
                    }}
                    transition={{ 
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0
                    }}
                  >
                    🥤
                  </motion.div>
                  <motion.div
                    className="absolute top-1/2 right-12 text-4xl sm:text-5xl opacity-15 select-none"
                    animate={{ 
                      y: [0, 8, 0],
                      rotate: [0, -2, 0]
                    }}
                    transition={{ 
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  >
                    🥗
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1/4 left-12 text-5xl sm:text-6xl opacity-15 select-none"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 2, 0]
                    }}
                    transition={{ 
                      duration: 6.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  >
                    🍔
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1/3 right-8 text-4xl sm:text-5xl opacity-15 select-none"
                    animate={{ 
                      y: [0, 10, 0],
                      rotate: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 7.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5
                    }}
                  >
                    🍗
                  </motion.div>
                  <motion.div
                    className="absolute top-1/3 left-1/4 text-4xl sm:text-5xl opacity-15 select-none"
                    animate={{ 
                      y: [0, -6, 0],
                      rotate: [0, 2, 0]
                    }}
                    transition={{ 
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.8
                    }}
                  >
                    🍟
                  </motion.div>
                  <motion.div
                    className="absolute bottom-1/4 right-1/4 text-4xl sm:text-5xl opacity-15 select-none"
                    animate={{ 
                      y: [0, 8, 0],
                      rotate: [0, -2, 0]
                    }}
                    transition={{ 
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.2
                    }}
                  >
                    🥓
                  </motion.div>
                </div>
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
                </div>
                
                <div className="relative z-10">
                  {/* Heading - One line, similar typography to "Where Flavor Meets Freedom" */}
                  <h3 className="font-heading text-[clamp(1.25rem,3.5vw,2.25rem)] sm:text-[clamp(1.5rem,4.5vw,2.75rem)] md:text-[clamp(1.75rem,5vw,3rem)] text-white leading-[0.9] tracking-tight mb-4 sm:mb-5 whitespace-nowrap pb-2 sm:pb-2.5">
                    Ready to{' '}
                    <span className="font-display text-white/90">Taste</span>
                    {' '}The{' '}
                    <span className="font-display text-white/90">Difference?</span>
                  </h3>
                  
                  {/* Discount text and copy button */}
                  <div className="mb-4 sm:mb-5">
                    <p className="font-body text-sm sm:text-base text-white/90 mb-2.5 sm:mb-3">
                      Use <span className="font-bold text-white">STJOHNS30</span> to get <span className="font-bold text-white text-lg sm:text-xl">30% off</span> your first order
                    </p>
                    <motion.button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText('STJOHNS30')
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch (err) {
                          console.error('Failed to copy:', err)
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="font-body text-xs sm:text-sm text-white">
                        {copied ? 'Copied!' : 'Click to copy'}
                      </span>
                      {copied ? (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                  
                  {/* Order Now Button - Clover style effect */}
                  <OrderNowButton href="https://localcook.shop/app/index.php" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

