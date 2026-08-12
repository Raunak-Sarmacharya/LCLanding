"use client";

import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useId, useEffect } from "react";

interface SlideData {
  title: string;
  button: string;
  src: string;
  link?: string;
}

interface SlideProps {
  slide: SlideData;
  index: number;
  current: number;
  handleSlideClick: (index: number) => void;
}

const Slide = ({ slide, index, current, handleSlideClick }: SlideProps) => {
  const slideRef = useRef<HTMLLIElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);
  const [imgError, setImgError] = useState(false);

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

  const { src, button, title } = slide;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        className="group flex flex-1 flex-col items-center justify-end pb-8 sm:pb-12 relative text-center text-white opacity-100 transition-all duration-500 ease-in-out w-[75vw] sm:w-[340px] md:w-[420px] aspect-[4/5] mx-[2vw] sm:mx-[16px] z-10"
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            current !== index
              ? "scale(0.98) rotateX(8deg)"
              : "scale(1) rotateX(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "bottom",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full bg-[var(--color-charcoal)] rounded-[2rem] overflow-hidden transition-all duration-300 ease-out shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/10"
          style={{
            transform:
              current === index
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
                className="absolute inset-0 w-full h-full object-cover opacity-100 transition-transform duration-700 ease-out z-10 group-hover:scale-105"
                style={{
                  opacity: current === index ? 1 : 0.5,
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

          {current === index && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-1000 z-20 pointer-events-none" />
          )}
        </div>

        <article
          className={`relative z-30 p-[4vmin] transition-all duration-1000 ease-in-out transform ${
            current === index ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"
          }`}
        >
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide text-white drop-shadow-md mb-2">
            {title}
          </h2>
          <div className="flex justify-center mt-4">
            {slide.link ? (
              <a href={slide.link} target="_blank" rel="noopener noreferrer" className="px-6 py-3 w-fit mx-auto text-sm font-semibold text-[var(--color-charcoal)] bg-white/95 backdrop-blur-md border border-white/20 flex justify-center items-center rounded-full hover:bg-white hover:scale-105 hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.4)] transition-all duration-300">
                {button}
              </a>
            ) : (
              <button className="px-6 py-3 w-fit mx-auto text-sm font-semibold text-[var(--color-charcoal)] bg-white/95 backdrop-blur-md border border-white/20 flex justify-center items-center rounded-full hover:bg-white hover:scale-105 hover:shadow-[0_8px_20px_-6px_rgba(255,255,255,0.4)] transition-all duration-300">
                {button}
              </button>
            )}
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
  const [current, setCurrent] = useState(0);

  const handlePreviousClick = () => {
    const previous = current - 1;
    setCurrent(previous < 0 ? slides.length - 1 : previous);
  };

  const handleNextClick = () => {
    const next = current + 1;
    setCurrent(next === slides.length ? 0 : next);
  };

  const handleSlideClick = (index: number) => {
    if (current !== index) {
      setCurrent(index);
    }
  };

  const id = useId();

  return (
    <div
      className="relative w-[75vw] sm:w-[340px] md:w-[420px] aspect-[4/5] mx-auto"
      aria-labelledby={`carousel-heading-${id}`}
    >
      <ul
        className="absolute flex mx-[-2vw] sm:mx-[-16px] transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${current * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            index={index}
            current={current}
            handleSlideClick={handleSlideClick}
          />
        ))}
      </ul>

      <div className="absolute flex justify-center w-full top-[calc(100%+2rem)]">
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

