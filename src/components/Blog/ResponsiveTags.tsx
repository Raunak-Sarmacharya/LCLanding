import { useEffect, useRef, useState, useLayoutEffect } from 'react'

interface ResponsiveTagsProps {
  tags: string[]
  className?: string
  tagClassName?: string
  getTagStyle?: (index: number) => React.CSSProperties
  gap?: string
  maxWidth?: string
  renderTagContent?: (tag: string, index: number) => React.ReactNode
}

export default function ResponsiveTags({
  tags,
  className = '',
  tagClassName = '',
  getTagStyle,
  gap = 'gap-1.5',
  maxWidth,
  renderTagContent,
}: ResponsiveTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Calculate visible count based on actual measurements
  useLayoutEffect(() => {
    if (tags.length === 0) {
      setVisibleCount(0)
      return
    }

    const calculateVisibleCount = () => {
      const container = containerRef.current
      const wrapper = wrapperRef.current
      
      if (!container || !wrapper) {
        setVisibleCount(tags.length)
        return
      }

      // Get the actual available width - traverse up to find the constrained container
      let availableWidth = 0
      let currentElement: HTMLElement | null = wrapper.parentElement
      
      // Method 1: Use wrapper's actual available width (most accurate)
      const wrapperStyle = getComputedStyle(wrapper)
      const wrapperMarginRight = parseFloat(wrapperStyle.marginRight) || 0
      
      // Use clientWidth which gives content width (excludes padding)
      // Then subtract margin-right
      availableWidth = wrapper.clientWidth - wrapperMarginRight
      
      // Fallback to offsetWidth if clientWidth is 0 (offsetWidth includes padding)
      if (availableWidth < 10) {
        const wrapperPaddingLeft = parseFloat(wrapperStyle.paddingLeft) || 0
        const wrapperPaddingRight = parseFloat(wrapperStyle.paddingRight) || 0
        availableWidth = wrapper.offsetWidth - wrapperPaddingLeft - wrapperPaddingRight - wrapperMarginRight
      }
      
      // Account for absolutely positioned author/date info that overlaps
      // Always check for absolute elements - they can be on right side on both mobile and desktop
      if (currentElement) {
        const parentRect = currentElement.getBoundingClientRect()
        const parentChildren = Array.from(currentElement.children) as HTMLElement[]
        
        let maxAbsoluteWidth = 0
        let hasAbsoluteOnRight = false
        
        parentChildren.forEach(child => {
          const childStyle = getComputedStyle(child)
          if (childStyle.position === 'absolute') {
            const childRect = child.getBoundingClientRect()
            
            // Calculate element's position relative to parent
            const elementLeft = childRect.left - parentRect.left
            const elementRight = childRect.right - parentRect.left
            const elementWidth = childRect.width
            
            // Check if element is positioned on the right side
            // On mobile: right-4/5 (16-20px), on desktop: right-[clamp(20px,5.1vw,43px)]
            // Element is on right if its left edge is in the right 40% of parent
            const isOnRight = elementLeft > parentRect.width * 0.6 || 
                             (childStyle.right !== 'auto' && parseFloat(childStyle.right) >= 0)
            
            if (isOnRight) {
              hasAbsoluteOnRight = true
              maxAbsoluteWidth = Math.max(maxAbsoluteWidth, elementWidth)
            }
          }
        })
        
        // Always reserve space if absolute elements exist on the right
        if (hasAbsoluteOnRight && maxAbsoluteWidth > 0) {
          // Subtract element width + extra gap (increased to prevent overlap)
          const isMobile = window.innerWidth < 768
          const extraGap = isMobile ? 25 : 27 // Increased: mobile 18->25, desktop 22->27
          availableWidth = availableWidth - maxAbsoluteWidth - extraGap
        } else {
          // Check if there are any absolute elements at all (fallback)
          const hasAbsoluteElements = parentChildren.some(child => {
            const childStyle = getComputedStyle(child)
            return childStyle.position === 'absolute'
          })
          
          if (hasAbsoluteElements) {
            // Reserve conservative space for author info
            // Mobile: ~100px, Desktop: ~140px, so use responsive calculation
            const isMobile = window.innerWidth < 768
            const reservedSpace = isMobile ? 125 : 155 // Increased: mobile 115->125, desktop 145->155
            availableWidth = availableWidth - reservedSpace
          }
        }
      }
      
      // If that doesn't work, try parent
      if (availableWidth < 10 && currentElement) {
        const parentStyle = getComputedStyle(currentElement)
        const parentRect = currentElement.getBoundingClientRect()
        
        // Account for parent padding
        const parentPaddingLeft = parseFloat(parentStyle.paddingLeft) || 0
        const parentPaddingRight = parseFloat(parentStyle.paddingRight) || 0
        availableWidth = parentRect.width - parentPaddingLeft - parentPaddingRight - wrapperMarginRight
        
        // Account for absolute elements again (same logic as above)
        const parentChildren = Array.from(currentElement.children) as HTMLElement[]
        let maxAbsoluteWidth = 0
        let hasAbsoluteOnRight = false
        
        parentChildren.forEach(child => {
          const childStyle = getComputedStyle(child)
          if (childStyle.position === 'absolute') {
            const childRect = child.getBoundingClientRect()
            const elementLeft = childRect.left - parentRect.left
            const elementWidth = childRect.width
            
            const isOnRight = elementLeft > parentRect.width * 0.6 || 
                             (childStyle.right !== 'auto' && parseFloat(childStyle.right) >= 0)
            
            if (isOnRight) {
              hasAbsoluteOnRight = true
              maxAbsoluteWidth = Math.max(maxAbsoluteWidth, elementWidth)
            }
          }
        })
        
        if (hasAbsoluteOnRight && maxAbsoluteWidth > 0) {
          const isMobile = window.innerWidth < 768
          const extraGap = isMobile ? 25 : 27 // Increased: mobile 18->25, desktop 22->27
          availableWidth = availableWidth - maxAbsoluteWidth - extraGap
        } else {
          const hasAbsoluteElements = parentChildren.some(child => {
            const childStyle = getComputedStyle(child)
            return childStyle.position === 'absolute'
          })
          if (hasAbsoluteElements) {
            const isMobile = window.innerWidth < 768
            const reservedSpace = isMobile ? 125 : 155 // Increased: mobile 115->125, desktop 145->155
            availableWidth = availableWidth - reservedSpace
          }
        }
        
        // If parent is flex, account for siblings (like on desktop with image + text)
        if (parentStyle.display === 'flex' || parentStyle.display === 'inline-flex') {
          const siblings = Array.from(currentElement.children).filter(child => {
            const childStyle = getComputedStyle(child)
            return child !== wrapper && childStyle.position !== 'absolute'
          })
          if (siblings.length > 0) {
            let siblingsWidth = 0
            siblings.forEach(sibling => {
              const siblingRect = (sibling as HTMLElement).getBoundingClientRect()
              siblingsWidth += siblingRect.width
            })
            const flexGap = parseFloat(parentStyle.gap) || parseFloat(parentStyle.columnGap) || 0
            const totalGaps = siblings.length * flexGap
            availableWidth = Math.max(50, availableWidth - siblingsWidth - totalGaps)
          }
        }
      }

      // Method 2: Traverse up to find a constrained parent
      if (availableWidth < 10 || availableWidth > window.innerWidth * 1.5) {
        currentElement = wrapper.parentElement
        let depth = 0
        while (currentElement && depth < 5) {
          const style = getComputedStyle(currentElement)
          const rect = currentElement.getBoundingClientRect()
          
          // Check if this element has a valid constrained width
          if (rect.width > 0 && rect.width < window.innerWidth * 1.5) {
            const paddingLeft = parseFloat(style.paddingLeft) || 0
            const paddingRight = parseFloat(style.paddingRight) || 0
            availableWidth = rect.width - paddingLeft - paddingRight - wrapperMarginRight
            
            // If flex, account for siblings
            if (style.display === 'flex' || style.display === 'inline-flex') {
              const siblings = Array.from(currentElement.children).filter(child => {
                const wrapperParent = wrapper.parentElement
                return child !== wrapperParent && child !== wrapper
              })
              if (siblings.length > 0) {
                let siblingsWidth = 0
                siblings.forEach(sibling => {
                  siblingsWidth += (sibling as HTMLElement).getBoundingClientRect().width
                })
                const flexGap = parseFloat(style.gap) || parseFloat(style.columnGap) || 0
                availableWidth = Math.max(50, availableWidth - siblingsWidth - (siblings.length * flexGap))
              }
            }
            break
          }
          currentElement = currentElement.parentElement
          depth++
        }
      }

      // Final fallback with better estimates
      if (availableWidth < 50) {
        const isMobile = window.innerWidth < 640
        const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024
        if (isMobile) {
          availableWidth = Math.min(280, window.innerWidth - 40)
        } else if (isTablet) {
          availableWidth = Math.min(500, window.innerWidth - 60)
        } else {
          // Desktop - account for card layout
          availableWidth = Math.min(700, window.innerWidth - 100)
        }
      }
      
      // Ensure minimum width (add safety margin to prevent overlap)
      // Be more conservative to prevent any overlap with author info on both mobile and desktop
      // Use responsive safety margin (increased to fix remaining overlap)
      const isMobile = window.innerWidth < 768
      const safetyMargin = isMobile ? 15 : 17 // Increased: mobile 10->15, desktop 15->17
      availableWidth = Math.max(50, availableWidth - safetyMargin)

      // Get gap value - try multiple methods
      const containerStyle = getComputedStyle(container)
      let gapValue = parseFloat(containerStyle.gap) || parseFloat(containerStyle.columnGap)
      
      // If not found, try measure container
      if (!gapValue || gapValue === 0 || isNaN(gapValue)) {
        // Try to create a test element with the gap class to measure
        const testContainer = document.createElement('div')
        testContainer.className = `flex ${gap}`
        testContainer.style.position = 'absolute'
        testContainer.style.visibility = 'hidden'
        testContainer.style.top = '-9999px'
        document.body.appendChild(testContainer)
        
        const testGap = parseFloat(getComputedStyle(testContainer).gap) || 
                       parseFloat(getComputedStyle(testContainer).columnGap)
        document.body.removeChild(testContainer)
        
        if (testGap && testGap > 0) {
          gapValue = testGap
        } else {
          // Parse from Tailwind class string - get first/base value
          const gapMatches = gap.matchAll(/gap-(\d+(?:\.\d+)?)/g)
          const gapValues: number[] = []
          for (const match of gapMatches) {
            gapValues.push(parseFloat(match[1]) * 4) // Tailwind: 1 = 4px
          }
          gapValue = gapValues.length > 0 ? gapValues[0] : 8 // Default to 8px
        }
      }
      
      // Ensure minimum gap to prevent overlap
      gapValue = Math.max(6, gapValue)

      // Measure actual tag widths from rendered elements
      const tagElements = Array.from(container.children) as HTMLElement[]
      if (tagElements.length === 0) {
        setVisibleCount(tags.length)
        return
      }

      // Measure +n tag
      const measurePlusTag = (count: number): number => {
        const temp = document.createElement('span')
        temp.className = tagClassName
        temp.textContent = `+${count}`
        temp.style.position = 'absolute'
        temp.style.visibility = 'hidden'
        temp.style.whiteSpace = 'nowrap'
        temp.style.display = 'inline-block'
        if (getTagStyle) {
          Object.assign(temp.style, getTagStyle(tags.length))
        }
        document.body.appendChild(temp)
        const width = temp.offsetWidth
        document.body.removeChild(temp)
        return width
      }

      // Calculate how many tags fit
      let totalWidth = 0
      let count = 0

      // We need to measure tags that are currently rendered
      // But we also need to account for tags that might not be rendered yet
      // So let's create a temporary container to measure all tags
      const tempContainer = document.createElement('div')
      tempContainer.className = container.className
      tempContainer.style.position = 'absolute'
      tempContainer.style.visibility = 'hidden'
      tempContainer.style.top = '-9999px'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = 'auto'
      tempContainer.style.display = 'flex'
      tempContainer.style.flexWrap = 'nowrap'
      document.body.appendChild(tempContainer)

      // Render all tags in temp container to measure
      tags.forEach((tag, index) => {
        const tempTag = document.createElement('span')
        tempTag.className = tagClassName
        if (getTagStyle) {
          Object.assign(tempTag.style, getTagStyle(index))
        }
        tempTag.style.whiteSpace = 'nowrap'
        tempTag.style.display = 'inline-block'
        tempTag.style.flexShrink = '0'
        
        // Create content
        if (renderTagContent) {
          const content = renderTagContent(tag, index)
          if (typeof content === 'string') {
            tempTag.textContent = content
          } else {
            // For React nodes, just use the tag text
            tempTag.textContent = tag
          }
        } else {
          tempTag.textContent = tag
        }
        
        tempContainer.appendChild(tempTag)
      })

      // Apply gap
      tempContainer.style.gap = `${gapValue}px`

      // Force layout
      tempContainer.offsetHeight

      // Now measure each tag
      const tempTags = Array.from(tempContainer.children) as HTMLElement[]
      
      for (let i = 0; i < tempTags.length; i++) {
        const tagElement = tempTags[i]
        if (!tagElement) continue

        const tagWidth = tagElement.offsetWidth
        const tagGap = i > 0 ? gapValue : 0
        const neededWidth = totalWidth + tagGap + tagWidth

        // Check if we need space for +n tag
        const remainingTags = tags.length - i - 1
        if (remainingTags > 0) {
          const plusTagWidth = measurePlusTag(remainingTags)
          const totalNeeded = neededWidth + gapValue + plusTagWidth
          
          if (totalNeeded > availableWidth) {
            break
          }
        } else {
          if (neededWidth > availableWidth) {
            break
          }
        }

        totalWidth = neededWidth
        count++
      }

      // Cleanup
      document.body.removeChild(tempContainer)

      // Hide one extra tag to give more breathing room and prevent overlap
      // BUT only do this if there are 3 or more tags - if 2 or fewer, show all
      // This ensures tags don't get too close to the author info, but doesn't hide tags unnecessarily
      const finalCount = tags.length >= 3 
        ? Math.max(0, Math.min(count - 1, tags.length))  // Hide one extra only if 3+ tags
        : Math.max(0, Math.min(count, tags.length))      // Show all if 2 or fewer tags
      setVisibleCount(finalCount)
    }

    // Calculate with proper timing
    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculateVisibleCount()
        })
      })
    }, 100)

    // Recalculate on resize
    let resizeTimeout: NodeJS.Timeout
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        calculateVisibleCount()
      }, 100)
    })
    
    const handleWindowResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        calculateVisibleCount()
      }, 150)
    }
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current)
      const parent = wrapperRef.current.parentElement
      if (parent) {
        resizeObserver.observe(parent)
      }
    }
    
    window.addEventListener('resize', handleWindowResize)
    window.addEventListener('orientationchange', handleWindowResize)

    return () => {
      clearTimeout(timeout)
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      window.removeEventListener('orientationchange', handleWindowResize)
    }
  }, [tags, gap, tagClassName, getTagStyle, renderTagContent])

  // Safety check: Verify no overflow after render - continuous monitoring
  useEffect(() => {
    if (tags.length === 0) return

    let checkInterval: NodeJS.Timeout | null = null
    let isChecking = false

    const checkOverflow = () => {
      if (isChecking) return
      const container = containerRef.current
      if (!container) return

      // Force a reflow to get accurate measurements
      container.offsetHeight

      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth

      // If overflowing, reduce count until it fits (use 0 tolerance for strict checking)
      if (scrollWidth > clientWidth) {
        isChecking = true
        setVisibleCount(prev => {
          const newCount = Math.max(0, prev - 1)
          // Check again after state update
          setTimeout(() => {
            isChecking = false
            requestAnimationFrame(() => {
              requestAnimationFrame(checkOverflow)
            })
          }, 30)
          return newCount
        })
      } else {
        isChecking = false
      }
    }

    // Check immediately and then continuously
    const immediateCheck = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          checkOverflow()
        })
      })
    }

    // Initial checks
    immediateCheck()
    const timeout1 = setTimeout(immediateCheck, 100)
    const timeout2 = setTimeout(immediateCheck, 300)
    const timeout3 = setTimeout(immediateCheck, 500)
    const timeout4 = setTimeout(immediateCheck, 1000)

    // Continuous monitoring every 100ms for the first 4 seconds
    let checkCount = 0
    checkInterval = setInterval(() => {
      if (checkCount < 40) { // Check 40 times (4 seconds)
        immediateCheck()
        checkCount++
      } else {
        if (checkInterval) {
          clearInterval(checkInterval)
          checkInterval = null
        }
      }
    }, 100)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearTimeout(timeout4)
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      isChecking = false
    }
  }, [visibleCount, tags.length])

  if (tags.length === 0) return null

  const hiddenCount = tags.length - visibleCount

  return (
    <div 
      ref={wrapperRef}
      className="w-full"
      style={{ 
        width: '100%',
        maxWidth: '100%', 
        overflow: 'hidden', 
        position: 'relative',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Visible container */}
      <div
        ref={containerRef}
        className={`flex ${gap} ${className}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          ...(maxWidth ? { maxWidth } : {}),
          flexWrap: 'nowrap',
          overflow: 'hidden',
          minWidth: 0,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Render only visible tags */}
        {tags.slice(0, visibleCount).map((tag, index) => (
          <span
            key={index}
            ref={(el) => {
              tagRefs.current[index] = el
            }}
            className={tagClassName}
            style={{
              ...(getTagStyle ? getTagStyle(index) : {}),
              flexShrink: 0,
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {renderTagContent ? renderTagContent(tag, index) : tag}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span
            className={tagClassName}
            style={{
              ...(getTagStyle ? getTagStyle(visibleCount) : {}),
              flexShrink: 0,
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
          >
            {renderTagContent ? renderTagContent(`+${hiddenCount}`, visibleCount) : `+${hiddenCount}`}
          </span>
        )}
      </div>
    </div>
  )
}
