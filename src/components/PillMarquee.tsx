import './PillMarquee.css'

interface PillItem {
  text: string
  colorClass: string
}

// Row 1 pills - scrolling left (soft pastels complementing brand color)
const pillsRow1: PillItem[] = [
  { text: 'Homemade Fresh', colorClass: 'pill-blush' },
  { text: 'Local Chefs', colorClass: 'pill-sage' },
  { text: 'Authentic Flavors', colorClass: 'pill-lavender' },
  { text: 'Food Safety Certified', colorClass: 'pill-peach' },
  { text: 'Community First', colorClass: 'pill-rose' },
  { text: 'Delivered Fresh', colorClass: 'pill-sky' },
  { text: 'Diverse Cuisines', colorClass: 'pill-mint' },
  { text: 'Support Local', colorClass: 'pill-butter' },
]

// Row 2 pills - scrolling right (different order for variety)
const pillsRow2: PillItem[] = [
  { text: 'Farm to Table', colorClass: 'pill-mint' },
  { text: 'Cultural Recipes', colorClass: 'pill-coral' },
  { text: 'Made with Love', colorClass: 'pill-lilac' },
  { text: 'Fresh Ingredients', colorClass: 'pill-butter' },
  { text: 'Home Cooked', colorClass: 'pill-sage' },
  { text: 'Quality First', colorClass: 'pill-blush' },
  { text: 'Local Community', colorClass: 'pill-peach' },
  { text: 'Trusted Chefs', colorClass: 'pill-lavender' },
]

export default function PillMarquee() {
  return (
    <div className="pill-marquee-section">
      {/* Row 1 - Scrolling Left */}
      <div className="pill-marquee-container">
        <div className="pill-marquee-track pill-scroll-left">
          {/* Render pills multiple times for seamless loop */}
          {[...Array(4)].map((_, setIndex) => (
            <div key={setIndex} className="pill-set">
              {pillsRow1.map((pill, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className={`pill ${pill.colorClass}`}
                >
                  <span className="pill-text">{pill.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Row 2 - Scrolling Right (opposite direction) */}
      <div className="pill-marquee-container">
        <div className="pill-marquee-track pill-scroll-right">
          {/* Render pills multiple times for seamless loop */}
          {[...Array(4)].map((_, setIndex) => (
            <div key={setIndex} className="pill-set">
              {pillsRow2.map((pill, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className={`pill ${pill.colorClass}`}
                >
                  <span className="pill-text">{pill.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
