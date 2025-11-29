import './WaveDivider.css'

interface WaveDividerProps {
  /**
   * Direction of the wave:
   * - 'down': Waves point downward (fills bottom - use when colored section is BELOW)
   * - 'up': Waves point upward (fills top - use when colored section is ABOVE)
   */
  direction?: 'down' | 'up'
  /**
   * The color of the wave (the section that's "bleeding" into the other)
   */
  waveColor?: string
  /**
   * The background color (the section being bled into)
   */
  bgColor?: string
  className?: string
}

// Modified path that starts and ends at X=0 for seamless tiling
// Wave path that fills BOTTOM (for colored section BELOW bleeding UP)
const wavePathDown = "M0 150L0 68C0 68 14 68 21 67C37 65 57 60 71 52C86 44 98 35 114 31C132 26 153 27 171 34C174 35 176 37 179 38C182 39 186 41 189 43C189 43 190 43 190 43C190 43 191 44 192 44C203 50 215 56 227 61C262 74 296 75 331 65C365 56 399 36 433 23C467 10 502 5 536 10C583 16 625 42 670 57C715 72 758 71 801 50C831 36 860 14 894 16C924 18 950 39 978 52C1003 64 1031 70 1058 65C1122 55 1170 -5 1237 1C1297 6 1345 46 1401 62C1413 66 1425 68 1438 68C1438 68 1442 68 1442 68L1442 150L0 150Z"

// Wave path that fills TOP (for colored section ABOVE bleeding DOWN)
const wavePathUp = "M0 0L0 82C0 82 14 82 21 83C37 85 57 91 71 99C86 107 98 115 114 120C132 125 153 124 171 116C174 115 176 114 179 113C182 111 186 110 189 108C189 108 190 108 190 108C190 107 191 107 192 107C203 101 215 95 227 90C262 77 296 75 331 85C365 95 399 115 433 128C467 141 502 146 536 142C583 135 625 110 670 94C715 79 758 80 801 101C831 115 860 136 894 135C924 133 950 113 978 99C1003 87 1031 82 1058 86C1122 96 1170 156 1237 150C1297 145 1345 104 1401 88C1413 85 1425 83 1438 82C1438 82 1442 82 1442 82L1442 0L0 0Z"

export default function WaveDivider({
  direction = 'down',
  waveColor = 'var(--color-primary)',
  bgColor = 'var(--color-cream)',
  className = ''
}: WaveDividerProps) {
  const wavePath = direction === 'up' ? wavePathUp : wavePathDown
  
  return (
    <div 
      className={`wave-divider ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div 
        className="wave-marquee-container"
        style={{ color: waveColor }}
      >
        <div className="wave-marquee-track">
          {/* Multiple SVG waves for seamless scrolling - 6 copies for smoother loop */}
          {[...Array(6)].map((_, index) => (
            <div key={index} className="wave-svg-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1442 150"
                preserveAspectRatio="none"
                className="wave-svg"
              >
                <path d={wavePath} fill="currentColor" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
