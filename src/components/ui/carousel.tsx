"use client";

import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useId, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface SlideData {
  title: string;
  button: string;
  src: string;
  link?: string;
  badge_text?: string;
  badge_image?: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, isActive, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);
  const [imgError, setImgError] = useState(false);
  const [badgeImgError, setBadgeImgError] = useState(false);

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;
      const x = xRef.current;
      const y = yRef.current;
      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    const el = slideRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const imageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.opacity = "1";
  };

  const { src, button, title, badge_text, badge_image } = slide;

  return (
    <div className="embla__slide flex-none w-[70vw] sm:w-[240px] md:w-[280px] lg:w-[320px] mx-[2vw] sm:mx-3 z-10 flex justify-center">
      <li
        ref={slideRef}
        className="group block relative text-white opacity-100 transition-all duration-500 ease-in-out aspect-[3/2] w-full"
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            !isActive
              ? "scale(0.9)"
              : "scale(1)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "center",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full bg-[var(--color-charcoal)] rounded-[2rem] overflow-hidden transition-all duration-300 ease-out shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/10"
          style={{
            transform:
              isActive
                ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
                : "none",
          }}
        >
          {/* Creative Fallback Pattern (visible if image fails or before load) */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }} />

          {!imgError && (
            <>
              {/* Blurred Background to match image content */}
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-70 blur-xl scale-125"
                alt=""
                src={src}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
              />
              {/* Foreground Image */}
              <img
                className="absolute inset-0 w-full h-full object-contain object-center opacity-100 transition-transform duration-700 ease-out z-10 group-hover:scale-105"
                style={{
                  opacity: isActive ? 1 : 0.5,
                }}
                alt={title}
                src={src}
                onLoad={imageLoaded}
                onError={() => setImgError(true)}
                loading="eager"
                decoding="sync"
              />
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-all duration-1000 z-20 pointer-events-none" />
        </div>

        <article
          className={`absolute inset-0 z-30 p-3 sm:p-4 md:p-5 transition-all duration-1000 ease-in-out flex flex-col justify-between pointer-events-none`}
          style={{
            transform:
              isActive
                ? "translate3d(calc(var(--x) / 45), calc(var(--y) / 45), 0)"
                : "none",
          }}
        >
          {/* Top Section: Chef Info */}
          <div className="flex justify-start w-full pointer-events-auto">
            {badge_text && (
              <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-sm transition-all duration-300 hover:bg-black/35 cursor-default">
                {badge_image && !badgeImgError ? (
                  <img 
                    src={badge_image} 
                    alt={badge_text} 
                    className="w-7 h-7 rounded-full object-cover shadow-sm"
                    onError={() => setBadgeImgError(true)}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {badge_text.charAt(0)}
                  </div>
                )}
                <span className="font-body font-medium text-[13px] text-white/95 pr-2 tracking-wide leading-none">{badge_text}</span>
              </div>
            )}
          </div>

          {/* Bottom Section: Title & CTA */}
          <div className="flex flex-col items-center w-full pointer-events-auto text-center mt-auto">
            <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-2 sm:mb-3 max-w-[95%] leading-tight">
              {title}
            </h2>
            <div className={`flex-shrink-0 transition-all duration-500 ease-in-out ${isActive ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"}`}>
              {slide.link ? (
                <a href={slide.link} target="_blank" rel="noopener noreferrer" className="group/btn px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[12px] font-semibold text-[var(--color-charcoal)] bg-white/95 hover:bg-white backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 rounded-full w-fit shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95">
                  {button}
                  <svg className="w-3 h-3 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              ) : (
                <button className="group/btn px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[12px] font-semibold text-[var(--color-charcoal)] bg-white/95 hover:bg-white backdrop-blur-md transition-all duration-300 flex items-center gap-1.5 rounded-full w-fit shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95">
                  {button}
                  <svg className="w-3 h-3 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </article>
      </li>
    </div>
  );
};

interface CarouselControlProps {
  type: string;
  title: string;
  handleClick: () => void;
}

const CarouselControl = ({
  type,
  title,
  handleClick,
}: CarouselControlProps) => {
  return (
    <button
      className={`w-12 h-12 flex items-center mx-2 justify-center bg-white border border-black/5 shadow-md rounded-full hover:bg-[var(--color-primary)] hover:text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-300 ${
        type === "previous" ? "rotate-180" : ""
      }`}
      title={title}
      onClick={handleClick}
    >
      <IconArrowNarrowRight className="w-5 h-5 text-current transition-colors" />
    </button>
  );
};

interface CarouselProps {
  slides: SlideData[];
}

export default function Carousel({ slides }: CarouselProps) {
  // Ensure enough slides for Embla to loop properly
  const displaySlides = [...slides];
  if (displaySlides.length > 0 && displaySlides.length < 5) {
    while (displaySlides.length < 5) {
      displaySlides.push(...slides);
    }
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'center',
    containScroll: false,
    dragFree: false,
    skipSnaps: false,
    inViewThreshold: 0.7
  });
  
  const [current, setCurrent] = useState(0);

  const handlePreviousClick = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleNextClick = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleSlideClick = useCallback((index: number) => {
    if (emblaApi) {
      // Find the shortest path to the slide to respect loop
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const id = useId();

  return (
    <div
      className="relative w-full max-w-full py-10"
      aria-labelledby={`carousel-heading-${id}`}
    >
      <div className="embla w-full overflow-hidden" ref={emblaRef}>
        <ul className="embla__container flex touch-pan-y h-full" style={{ backfaceVisibility: 'hidden' }}>
          {displaySlides.map((slide, index) => {
            const totalSlides = displaySlides.length;
            let diff = index - current;
            if (diff > totalSlides / 2) diff -= totalSlides;
            if (diff < -totalSlides / 2) diff += totalSlides;
            const isActive = diff === 0;

            return (
              <Slide
                key={index}
                slide={slide}
                index={index}
                isActive={isActive}
                handleSlideClick={handleSlideClick}
              />
            );
          })}
        </ul>
      </div>

      <div className="absolute flex justify-center w-full bottom-[-1rem]">
        <CarouselControl
          type="previous"
          title="Go to previous slide"
          handleClick={handlePreviousClick}
        />
        <CarouselControl
          type="next"
          title="Go to next slide"
          handleClick={handleNextClick}
        />
      </div>
    </div>
  );
}
