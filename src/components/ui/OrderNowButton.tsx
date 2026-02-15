import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'

// Delivery truck SVG path - shared across all sizes
const DELIVERY_ICON_PATH = "M16.4 17.6C16.4 19.4778 17.8775 21 19.7 21C21.5225 21 23 19.4778 23 17.6C23 15.7222 21.5225 14.2 19.7 14.2C17.8775 14.2 16.4 15.7222 16.4 17.6ZM16.4 17.6L10.9 17.5997M10.9 17.5997V15.7452C10.9 13.4136 10.9 12.249 10.2554 11.5245C9.6108 10.8 8.5746 10.8 6.5 10.8H5.84C5.4319 10.8 5.2273 10.8 5.0546 10.8148C4.01011 10.9072 3.02922 11.4154 2.28838 12.248C1.54754 13.0807 1.09536 14.1831 1.0132 15.357C1 15.5511 1 15.7823 1 16.2398C1 16.3547 1 16.4128 1.0033 16.4598C1.02373 16.7535 1.1368 17.0293 1.32214 17.2376C1.50747 17.4459 1.75289 17.573 2.0142 17.596C2.07942 17.5994 2.14471 17.6006 2.21 17.5997H10.9ZM4.3 7.39972H9.8M2.1 4H7.6M12 4H12.5421C13.7772 4 14.3942 4 14.8901 4.38122C15.387 4.76117 15.6631 5.44713 16.2145 6.81903L19.1867 14.2M18.3068 11.65L19.006 11.01C19.276 10.7626 19.4115 10.6402 19.5049 10.4783C19.5689 10.3689 19.6185 10.2475 19.6517 10.1187C19.7 9.92875 19.7 9.72093 19.7 9.30528C19.7 8.51733 19.7 8.12462 19.5645 7.8301C19.4735 7.6325 19.3417 7.46873 19.1826 7.3558C18.9464 7.1875 18.6282 7.1875 17.9947 7.1875H16.62M9.25 17.6C9.25 18.5017 8.90232 19.3665 8.28345 20.0042C7.66458 20.6418 6.82521 21 5.95 21C5.07479 21 4.23542 20.6418 3.61655 20.0042C2.99768 19.3665 2.65 18.5017 2.65 17.6"

// Size presets for the clover-style Order Now button
const sizeConfig = {
  sm: {
    padding: 'px-3.5 py-2.5',
    textWidth: 85,
    containerHeight: 'h-8',
    iconSize: 16,
    iconGap: 'gap-1.5',
    arrowSize: 'w-6 h-6',
    arrowIconSize: 'w-3 h-3',
    textClass: 'text-sm sm:text-base',
    textOffset: 40,
    textWeight: { normal: 400, hover: 700 },
    glowIntensity: '8px',
    glowOpacity: 0.5,
  },
  md: {
    padding: 'px-4 py-3',
    textWidth: 90,
    containerHeight: 'h-9',
    iconSize: 18,
    iconGap: 'gap-1.5',
    arrowSize: 'w-7 h-7',
    arrowIconSize: 'w-3.5 h-3.5',
    textClass: 'text-sm sm:text-base',
    textOffset: 44,
    textWeight: { normal: 400, hover: 700 },
    glowIntensity: '9px',
    glowOpacity: 0.55,
  },
  lg: {
    padding: 'px-5 py-3.5',
    textWidth: 100,
    containerHeight: 'h-10',
    iconSize: 20,
    iconGap: 'gap-2',
    arrowSize: 'w-8 h-8',
    arrowIconSize: 'w-4 h-4',
    textClass: 'text-base sm:text-lg',
    textOffset: 48,
    textWeight: { normal: 500, hover: 700 },
    glowIntensity: '10px',
    glowOpacity: 0.6,
  },
} as const

type OrderNowSize = keyof typeof sizeConfig

interface OrderNowButtonProps {
  href: string
  size?: OrderNowSize
  label?: string
  customIcon?: ReactNode
  textWidthOverride?: number
  target?: string
}

// Clover-style animated Order Now button
// Icon slides from left to right on hover, text slides left, arrow circle appears
export default function OrderNowButton({ href, size = 'sm', label = 'Order Now', customIcon, textWidthOverride, target }: OrderNowButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const config = sizeConfig[size]
  const finalTextWidth = textWidthOverride ?? config.textWidth
  
  return (
    <motion.a
      href={href}
      className={`clover-link-btn inline-flex items-center cursor-pointer bg-white rounded-full shadow-xl hover:shadow-2xl transition-shadow duration-300 ${config.padding}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minWidth: `${finalTextWidth + 50}px` }}
      {...(target ? { target, rel: 'noopener noreferrer' } : {})}
    >
      {/* Container with relative positioning */}
      <div className={`relative flex items-center ${config.containerHeight}`} style={{ width: `${finalTextWidth + 60}px` }}>
        {/* Icon container - animates from left to right */}
        <motion.div 
          className={`absolute flex-shrink-0 z-10 flex items-center ${config.iconGap}`}
          animate={{ 
            x: isHovered ? finalTextWidth + 10 : 0
          }}
          transition={{ 
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {/* Icon with elegant scale + glow effect */}
          {customIcon ? (
            <motion.div
              className="flex-shrink-0"
              style={{ width: config.iconSize, height: config.iconSize }}
              animate={{ 
                scale: isHovered ? 1.08 : 1,
                filter: isHovered 
                  ? `drop-shadow(0 0 ${config.glowIntensity} rgba(245, 16, 66, ${config.glowOpacity}))` 
                  : 'drop-shadow(0 0 0px rgba(245, 16, 66, 0))'
              }}
              transition={{ 
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {customIcon}
            </motion.div>
          ) : (
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width={config.iconSize}
              height={config.iconSize}
              viewBox="0 0 24 24"
              fill="none"
              className="flex-shrink-0"
              animate={{ 
                scale: isHovered ? 1.08 : 1,
                filter: isHovered 
                  ? `drop-shadow(0 0 ${config.glowIntensity} rgba(245, 16, 66, ${config.glowOpacity}))` 
                  : 'drop-shadow(0 0 0px rgba(245, 16, 66, 0))'
              }}
              transition={{ 
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <path
                d={DELIVERY_ICON_PATH}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-[var(--color-primary)]"
              />
            </motion.svg>
          )}
          
          {/* Arrow appears to the RIGHT of the icon */}
          <motion.div 
            className="flex items-center justify-center"
            animate={{ 
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : -8
            }}
            transition={{ 
              duration: 0.35, 
              delay: isHovered ? 0.15 : 0,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <div className={`${config.arrowSize} bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-md`}>
              <svg 
                className={`${config.arrowIconSize} text-white`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Text - animates from right to left, becomes bold */}
        <motion.span
          className={`absolute ${config.textClass} text-[var(--color-primary)] whitespace-nowrap font-body`}
          animate={{ 
            x: isHovered ? 0 : config.textOffset,
            fontWeight: isHovered ? config.textWeight.hover : config.textWeight.normal
          }}
          transition={{ 
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {label}
        </motion.span>
      </div>
    </motion.a>
  )
}
