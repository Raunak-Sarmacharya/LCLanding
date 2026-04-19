import { motion } from 'motion/react'

interface StoreBadgeProps {
  store: 'apple' | 'google'
  href: string
  size?: 'sm' | 'lg'
}

const BADGES = {
  apple: '/apple-store-badge.svg',
  google: '/google-store-badge.svg',
}

const sizeConfig = {
  sm: 'h-[40px] w-[135px]',
  lg: 'h-[48px] w-[162px]',
}

export default function StoreBadge({ store, href, size = 'lg' }: StoreBadgeProps) {
  const isApple = store === 'apple'

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isApple ? 'Download Local Cooks on the App Store' : 'Get Local Cooks on Google Play'}
      className={`inline-flex items-center justify-center overflow-hidden rounded-lg ${sizeConfig[size]}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <img
        src={BADGES[store]}
        alt={isApple ? 'Download on the App Store' : 'Get it on Google Play'}
        className="h-full w-full object-contain"
      />
    </motion.a>
  )
}
