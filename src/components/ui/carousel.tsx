"use client";

import { IconArrowNarrowRight, IconArrowUpRight } from "@tabler/icons-react";
import { Camera, Clock } from "lucide-react";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";

export interface SlideData {
  title: string;
  button: string;
  src?: string;
  link?: string;
  subtitle?: string;
  avatar?: string;
  variant?: "cta";
  meta?: { label: string; value: string }[];
  priceBadge?: string;
  address?: string;
}

interface SlideProps {
  slide: SlideData;
}

const SLIDE_FRAME =
  "relative z-10 box-border flex w-[82%] shrink-0 grow-0 basis-[82%] justify-center px-2 sm:w-[46%] sm:basis-[46%] md:w-[31%] md:basis-[31%] lg:w-[24%] lg:basis-[24%] xl:w-[20%] xl:basis-[20%]";

function SlideCredit({ subtitle }: { subtitle: string }) {
  const isChef = /^Chef\s+/i.test(subtitle);
  const name = subtitle.replace(/^Chef\s+/i, "").trim();

  if (isChef) {
    return (
      <p className="mt-1 truncate font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-[var(--color-charcoal)]/55">
        Chef {name}
      </p>
    );
  }

  return (
    <p className="mt-1 line-clamp-2 font-body text-[11px] font-normal leading-relaxed text-[var(--color-charcoal)]/50">
      {subtitle}
    </p>
  );
}

function SlidePortrait({
  avatar,
  subtitle,
  title,
  avatarError,
  onAvatarError,
}: {
  avatar?: string;
  subtitle?: string;
  title: string;
  avatarError: boolean;
  onAvatarError: () => void;
}) {
  if (!subtitle && !avatar) return null;

  const initial = (subtitle ?? title).replace(/^Chef\s+/i, "").charAt(0);

  return (
    <div className="pointer-events-none absolute left-3.5 top-0 z-10 -translate-y-1/2">
      {avatar && !avatarError ? (
        <img
          src={avatar}
          alt=""
          className="h-16 w-16 rounded-full object-cover shadow-[0_6px_16px_rgba(26,26,26,0.22)] ring-[3px] ring-white sm:h-20 sm:w-20"
          onError={onAvatarError}
        />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream-dark)] font-heading text-xl text-[var(--color-charcoal)] shadow-[0_6px_16px_rgba(26,26,26,0.12)] ring-[3px] ring-white sm:h-20 sm:w-20">
          {initial}
        </span>
      )}
    </div>
  );
}

function SlideLink({
  slide,
  label,
  children,
  className = "",
}: {
  slide: SlideData;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  if (!slide.link) {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  return (
    <a
      href={slide.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`block w-full rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-cream)] ${className}`}
    >
      {children}
    </a>
  );
}

const Slide = ({ slide }: SlideProps) => {
  const [imgError, setImgError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const { src, button, title, subtitle, avatar, meta, priceBadge, address } = slide;
  const label = `${button} — ${title}`;

  const card = (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] bg-white text-left shadow-[0_10px_28px_-14px_rgba(26,26,26,0.18)] ring-1 ring-black/5">
      <div className="relative p-1.5 pb-0">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[0.95rem] bg-[var(--color-cream-dark)]">
          {src && !imgError ? (
            <img
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              alt={title}
              src={src}
              draggable={false}
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8F5] to-white group-hover:from-white transition-colors duration-500 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--color-primary) 1.5px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-white/90 shadow-sm border border-[var(--color-primary)]/10 flex items-center justify-center mb-2 transform transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300 relative">
                  <Camera className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.5} />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm border border-black/5">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-[var(--color-charcoal)] font-heading font-medium text-xs leading-tight mb-1 opacity-90">Visuals in the Oven</h3>
                <p className="text-[var(--color-charcoal-light)] font-body text-[9px] leading-relaxed max-w-[130px] opacity-75">
                  High-quality photos coming soon
                </p>
              </div>
            </div>
          )}
          {priceBadge && (
            <div className="absolute top-2.5 right-2.5 z-20 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--color-charcoal)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              {priceBadge}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(26,26,26,0.08)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-[var(--color-charcoal)]/[0.08] via-transparent to-white/10" />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-white/0 to-white/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </div>

      <div className="relative flex flex-col flex-1 px-3.5 pb-3.5 pt-11 sm:px-4 sm:pt-12">
        <SlidePortrait
          avatar={avatar}
          subtitle={subtitle}
          title={title}
          avatarError={avatarError}
          onAvatarError={() => setAvatarError(true)}
        />

        <div className="flex flex-col flex-1 gap-2.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1 pr-1">
              <h2 className="font-heading text-sm font-normal leading-snug tracking-tight text-[var(--color-charcoal)] sm:text-base">
                <span className="line-clamp-2">{title}</span>
              </h2>
              {subtitle && <SlideCredit subtitle={subtitle} />}
              {address && (
                <p className="mt-0.5 line-clamp-2 font-body text-[10px] leading-relaxed text-[var(--color-charcoal)]/40">
                  {address}
                </p>
              )}
            </div>

            <span
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_6px_14px_-6px_rgba(245,16,66,0.7)] transition-transform duration-300 ease-out group-hover:scale-105"
              aria-hidden="true"
            >
              <IconArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" stroke={2.25} />
            </span>
          </div>

          <div className="mt-auto">
            {meta && meta.length > 0 && (
              <div className="w-full text-[12px] bg-[var(--color-cream-dark)] rounded-xl p-3 flex gap-4">
                {meta.map((row) => (
                  <div key={row.label} className="flex flex-col flex-1 gap-1 min-w-0">
                    <span className="text-[var(--color-charcoal)]/60 font-medium whitespace-nowrap text-[10px] uppercase tracking-wider">{row.label}</span>
                    <span className="font-semibold text-[var(--color-charcoal)] break-words">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <div className={`${SLIDE_FRAME} self-stretch`}>
      <SlideLink slide={slide} label={label} className="h-full">
        {card}
      </SlideLink>
    </div>
  );
};

const CtaSlide = ({ slide }: SlideProps) => {
  const { title, button } = slide;
  const label = button || title;

  const card = (
    <article className="group relative flex h-full min-h-[16rem] w-full flex-col items-center justify-center overflow-hidden rounded-[1.25rem] bg-[var(--color-charcoal)] px-5 py-8 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,249,245,0.08)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/12 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <h2 className="font-heading text-[1.85rem] font-normal leading-[1.05] tracking-tight text-[var(--color-cream)] sm:text-[2.05rem]">
          {title.startsWith("Discover more ") ? (
            <>
              Discover more
              <span className="mt-0.5 block font-display text-[var(--color-primary)]">
                {title.replace("Discover more ", "")}
              </span>
            </>
          ) : (
            title
          )}
        </h2>

        <span
          className="mt-7 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_8px_18px_-8px_rgba(245,16,66,0.75)] transition-transform duration-300 ease-out group-hover:scale-105"
          aria-hidden="true"
        >
          <IconArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-px group-hover:-translate-y-px" stroke={2.25} />
        </span>
      </div>
    </article>
  );

  return (
    <div className={`${SLIDE_FRAME} self-stretch`}>
      <SlideLink slide={slide} label={label} className="h-full">
        {card}
      </SlideLink>
    </div>
  );
};

interface CarouselControlProps {
  type: string;
  title: string;
  handleClick: () => void;
  disabled?: boolean;
}

const CarouselControl = ({
  type,
  title,
  handleClick,
  disabled = false,
}: CarouselControlProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white shadow-[0_6px_16px_-8px_rgba(26,26,26,0.4)] transition-all duration-300 hover:scale-105 hover:bg-[var(--color-primary)] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-current ${
        type === "previous" ? "rotate-180" : ""
      }`}
      title={title}
      onClick={handleClick}
    >
      <IconArrowNarrowRight className="h-4 w-4 text-current transition-colors" />
    </button>
  );
};

interface CarouselProps {
  slides: SlideData[];
  loop?: boolean;
}

export default function Carousel({ slides, loop = true }: CarouselProps) {
  const displaySlides = [...slides];
  if (loop && displaySlides.length > 0 && displaySlides.length < 8) {
    while (displaySlides.length < 8) {
      displaySlides.push(...slides);
    }
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align: "start",
    containScroll: loop ? false : "trimSnaps",
    dragFree: false,
    skipSnaps: false,
  });

  const [canPrev, setCanPrev] = useState(loop);
  const [canNext, setCanNext] = useState(true);

  const handlePreviousClick = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const handleNextClick = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full px-4 sm:px-5 md:px-6">
      <div className="embla w-full overflow-hidden pb-8 pt-2" ref={emblaRef}>
        <div
          className="embla__container flex h-full items-stretch touch-pan-y"
          style={{ backfaceVisibility: "hidden" }}
        >
          {displaySlides.map((slide, index) =>
            slide.variant === "cta" ? (
              <CtaSlide key={`cta-${index}`} slide={slide} />
            ) : (
              <Slide key={`${slide.title}-${index}`} slide={slide} />
            )
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-start gap-2 overflow-visible pt-1">
        <CarouselControl
          type="previous"
          title="Go to previous slide"
          handleClick={handlePreviousClick}
          disabled={!canPrev}
        />
        <CarouselControl
          type="next"
          title="Go to next slide"
          handleClick={handleNextClick}
          disabled={!canNext}
        />
      </div>
    </div>
  );
}
