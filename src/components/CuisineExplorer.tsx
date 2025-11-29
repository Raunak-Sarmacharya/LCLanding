import { motion, useInView } from 'motion/react'
import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'

const chefPerks = [
  {
    icon: '🎯',
    title: 'Your Schedule. Your Rules.',
    description: 'No minimums. No locked contracts. Cook Monday? Skip it. Taking Friday off? Done. You run your business—we provide the tools.',
    features: ['Flexible hours', 'No commitments', 'Full control'],
    color: '#f51042',
    gradient: 'from-[#f51042] to-[#ff4d6d]',
  },
  {
    icon: '💙',
    title: '0% Commission Trial',
    description: 'We believe in putting chefs first. During our trial phase, we take $0 from your sales. You keep 100% of your menu price.',
    features: ['Zero platform fees', 'No subscriptions', 'Weekly payouts'],
    color: '#7CB69D',
    gradient: 'from-[#7CB69D] to-[#5A9A7A]',
  },
  {
    icon: '🏠',
    title: 'Cook From Home',
    description: 'Newfoundland makes this simple. Register once (FREE), then go live. Or rent a shared kitchen ($15-20/hour)—your choice.',
    features: ['Home-based allowed', 'Shared kitchens', 'Legal guidance'],
    color: '#E5A84B',
    gradient: 'from-[#E5A84B] to-[#D4943A]',
  },
  {
    icon: '⚡',
    title: 'Everything Included',
    description: 'Professional order management, secure payments via Stripe, customer messaging, menu builder, and 24/7 support—all free for now.',
    features: ['Payment processing', 'Order management', 'Marketing tools'],
    color: '#E8A5A5',
    gradient: 'from-[#E8A5A5] to-[#D18989]',
  },
  {
    icon: '👥',
    title: 'Real Community',
    description: 'Connect with 15+ other chefs. Share tips. Celebrate wins. We\'re building a local food movement together, not just an app.',
    features: ['Chef network', 'Peer support', 'Collaboration'],
    color: '#2D4739',
    gradient: 'from-[#2D4739] to-[#1A2A22]',
  },
  {
    icon: '📚',
    title: 'Legal Support',
    description: 'Confused about regulations? We have checklists. Questions about food handler certificates? We have resources. Real support, not bots.',
    features: ['Free registration', 'Compliance help', 'Food safety'],
    color: '#d10d38',
    gradient: 'from-[#d10d38] to-[#a80a2d]',
  },
]

const allowedFoods = [
  'Baked goods',
  'Prepared meals',
  'Sauces & condiments',
  'Jams & preserves',
  'Pastas & grains',
  'Coffee/tea preps',
  'Sautéed vegetables',
  'Sides & salads',
]

export default function CuisineExplorer() {
  const ref = useRef(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isInView || !gridRef.current) return

    const ctx = gsap.context(() => {
      // Animate perk cards with stagger
      gsap.fromTo('.perk-card',
        { 
          opacity: 0, 
          scale: 0.9,
          y: 50
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.4)',
        }
      )
      
      // Animate food tags
      gsap.fromTo('.food-tag',
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.05,
          delay: 0.8,
          ease: 'back.out(2)',
        }
      )
    }, gridRef)

    return () => ctx.revert()
  }, [isInView])

  return (
    <section id="cuisines" className="py-24 md:py-32 bg-[var(--color-cream-dark)] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-60 h-60 bg-[var(--color-primary)]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-[var(--color-gold)]/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-[var(--color-sage)]/20 rounded-full blur-[80px]" />
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(var(--color-charcoal) 1px, transparent 1px),
                          linear-gradient(90deg, var(--color-charcoal) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[var(--color-primary)]/10 px-4 py-2 rounded-full mb-6"
          >
            <span className="text-xl">👨‍🍳</span>
            <span className="font-mono text-sm text-[var(--color-primary)] uppercase tracking-widest">For Chefs</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--color-charcoal)] leading-tight mb-4 sm:mb-6"
          >
            Why Chefs Choose{' '}
            <span className="font-display text-[var(--color-primary)]">Local Cooks</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base sm:text-lg md:text-xl text-[var(--color-charcoal-light)] max-w-3xl mx-auto leading-relaxed px-4"
          >
            Share your culinary heritage. Whether it's a side hustle or a full-time dream, 
            we support you with tools, community, and zero platform fees during our trial.
          </motion.p>
        </div>

        {/* Perks Grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {chefPerks.map((perk, index) => (
            <div
              key={index}
              className="perk-card relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`relative h-full bg-white rounded-3xl p-7 border-2 transition-all duration-500 overflow-hidden ${
                  hoveredIndex === index
                    ? 'border-[var(--color-primary)] shadow-2xl shadow-[var(--color-primary)]/10 -translate-y-2'
                    : 'border-transparent shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Gradient accent on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${perk.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                />

                {/* Icon with animated background */}
                <div className="relative mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ backgroundColor: `${perk.color}20` }}
                  >
                    {perk.icon}
                  </div>
                  {/* Pulse ring on hover */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ 
                      boxShadow: `0 0 0 0 ${perk.color}40`,
                      animation: hoveredIndex === index ? 'pulse-ring 1.5s ease-out infinite' : 'none',
                    }}
                  />
                </div>

                {/* Content */}
                <h3 className="font-heading text-xl text-[var(--color-charcoal)] mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                  {perk.title}
                </h3>

                <p className="font-body text-sm text-[var(--color-charcoal-light)] leading-relaxed mb-5">
                  {perk.description}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2">
                  {perk.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[var(--color-cream)] rounded-full font-mono text-xs text-[var(--color-charcoal)] border border-[var(--color-charcoal)]/5"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-6 right-6 w-10 h-10 bg-[var(--color-cream)] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-45">
                  <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What You Can Sell Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-[var(--color-charcoal)]/5 mb-8 sm:mb-12"
        >
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">✅</span>
                <h3 className="font-heading text-2xl text-[var(--color-charcoal)]">
                  Foods You CAN Sell from Home
                </h3>
              </div>
              <p className="font-body text-[var(--color-charcoal-light)] mb-6">
                Newfoundland allows home-based food businesses for many food types. 
                No license required—just a simple, free registration.
              </p>
              <div className="flex flex-wrap gap-2">
                {allowedFoods.map((food, index) => (
                  <span
                    key={index}
                    className="food-tag inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-sage)]/15 text-[#2D5A3D] rounded-full font-mono text-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {food}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Earnings example card */}
              <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-6 text-white">
                <h4 className="font-mono text-xs uppercase tracking-widest text-white/70 mb-3">Example Earnings</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="font-body">Sell a $20 meal</span>
                    <span className="font-heading text-xl">$19.12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body">Sell a $50 order</span>
                    <span className="font-heading text-xl">$48.55</span>
                  </div>
                </div>
                <p className="mt-4 font-mono text-xs text-white/60">
                  *After Stripe processing (2.9% + 30¢)
                </p>
              </div>
              
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--color-gold)]/30 rounded-full blur-2xl" />
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a
              href="https://local-cooks-community.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta inline-flex items-center gap-3 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full font-body font-semibold text-lg hover:bg-[var(--color-primary-dark)] transition-all duration-300 shadow-xl shadow-[var(--color-primary)]/30 hover:shadow-2xl hover:shadow-[var(--color-primary)]/40 hover:scale-105"
            >
              <span>Start Cooking & Earning</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            
            <span className="font-body text-[var(--color-charcoal-light)]">or</span>
            
            <a
              href="https://local-cooks-community.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body font-semibold text-[var(--color-charcoal)] hover:text-[var(--color-primary)] transition-colors group"
            >
              <span>Learn more about joining as a chef</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <p className="mt-8 font-body text-[var(--color-charcoal-light)]">
            Join <span className="font-semibold text-[var(--color-charcoal)]">15+ chefs</span> already building food businesses on Local Cooks.{' '}
            <a href="https://local-cooks-community.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-semibold underline underline-offset-4 hover:no-underline">
              Ready to join?
            </a>
          </p>
        </motion.div>
      </div>
      
      {/* Custom keyframe for pulse ring */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 currentColor;
            opacity: 0.6;
          }
          100% {
            box-shadow: 0 0 0 20px currentColor;
            opacity: 0;
          }
        }
      `}</style>
    </section>
  )
}
