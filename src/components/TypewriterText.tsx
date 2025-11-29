import { useState, useEffect, useCallback, useRef } from 'react'

interface TypewriterTextProps {
  staticText?: string
  words: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  className?: string
  staticClassName?: string
  dynamicClassName?: string
}

export default function TypewriterText({
  staticText = 'Local',
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = '',
  staticClassName = '',
  dynamicClassName = '',
}: TypewriterTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)

  const currentWord = words[currentWordIndex]

  const tick = useCallback(() => {
    if (isPaused) return

    if (!isDeleting) {
      // Typing
      if (currentText.length < currentWord.length) {
        setCurrentText(currentWord.slice(0, currentText.length + 1))
      } else {
        // Word complete, pause before deleting
        setIsPaused(true)
        setTimeout(() => {
          setIsPaused(false)
          setIsDeleting(true)
        }, pauseDuration)
      }
    } else {
      // Deleting
      if (currentText.length > 0) {
        setCurrentText(currentWord.slice(0, currentText.length - 1))
      } else {
        // Word deleted, move to next
        setIsDeleting(false)
        setCurrentWordIndex((prev) => (prev + 1) % words.length)
      }
    }
  }, [currentText, currentWord, isDeleting, isPaused, pauseDuration, words.length])

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [tick, isDeleting, deletingSpeed, typingSpeed])

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className={staticClassName}>{staticText}</span>
      <span className="relative ml-2">
        <span
          ref={textRef}
          className={dynamicClassName}
          style={{ display: 'inline-block', minWidth: '1ch' }}
        >
          {currentText}
        </span>
        <span className="typewriter-cursor" />
      </span>
    </span>
  )
}


