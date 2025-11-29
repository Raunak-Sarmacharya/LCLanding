interface MarqueeProps {
  variant?: 'default' | 'reverse'
}

const phrases = [
  { text: 'HOMEMADE WITH LOVE', emoji: '❤️' },
  { text: 'FRESH & LOCAL', emoji: '🌿' },
  { text: 'AUTHENTIC FLAVORS', emoji: '✨' },
  { text: 'SUPPORT LOCAL CHEFS', emoji: '👨‍🍳' },
  { text: 'DIVERSE CUISINES', emoji: '🌍' },
  { text: 'DELIVERED TO YOU', emoji: '🚴' },
  { text: 'LOCAL COOKS', emoji: '🍳' },
  { text: 'LOCAL COMMUNITY', emoji: '🏘️' },
]

export default function Marquee({ variant = 'default' }: MarqueeProps) {
  const isReverse = variant === 'reverse'

  return (
    <div className="relative py-6 bg-[var(--color-primary)] overflow-hidden">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--color-primary)] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--color-primary)] to-transparent z-10" />

      {/* Subtle light streaks for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-1/3 w-1/3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="marquee-container">
        <div className={isReverse ? 'marquee-content-reverse' : 'marquee-content'}>
          {/* Triple the content for seamless loop */}
          {[...phrases, ...phrases, ...phrases].map((phrase, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-4 mx-8 font-mono text-base md:text-lg text-white uppercase tracking-widest whitespace-nowrap"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
            >
              <span className="font-semibold">{phrase.text}</span>
              <span className="text-xl">{phrase.emoji}</span>
              <span className="w-2 h-2 bg-white/50 rounded-full" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
