import { Children, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { XStack, YStack } from 'tamagui'

type Props = {
  children: ReactNode
  label: string
  /** Approximate slide width for scroll-by-one on desktop. */
  slideClassName?: string
  className?: string
  /**
   * When true (default), few items expand to fill the track instead of
   * leaving empty space beside narrow carousel cards.
   */
  fillWhenSparse?: boolean
}

/**
 * Horizontal gallery rail with scroll-snap and optional ← → controls (web).
 * Sparse sets (1–4) fill the row; denser sets scroll.
 */
export function GalleryCarousel({
  children,
  label,
  slideClassName = 'g-carousel__slide',
  className = '',
  fillWhenSparse = true,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const labelId = useId()
  const items = Children.toArray(children)
  const count = items.length
  const fills = fillWhenSparse && count > 0 && count <= 4
  const needsControls = !fills

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el || fills) {
      setCanPrev(false)
      setCanNext(false)
      return
    }
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', sync)
      ro?.disconnect()
    }
  }, [sync, count, fills])

  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>(`.${slideClassName.split(' ')[0]}`)
    const step = slide ? slide.offsetWidth + 16 : el.clientWidth * 0.75
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  if (count === 0) return null

  if (Platform.OS !== 'web') {
    return (
      <XStack flexWrap="wrap" gap="$3">
        {items.map((child, i) => (
          <YStack key={i} width={count === 1 ? '100%' : '47%'}>
            {child}
          </YStack>
        ))}
      </XStack>
    )
  }

  const mods = [
    `g-carousel--count-${Math.min(count, 6)}`,
    fills ? 'g-carousel--fill' : 'g-carousel--scroll',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`g-carousel ${mods}`.trim()} role="region" aria-labelledby={labelId}>
      <div className="g-carousel__bar">
        <span id={labelId} className="g-label">
          {label}
        </span>
        {needsControls ? (
          <div className="g-carousel__controls">
            <button
              type="button"
              className="g-carousel__btn"
              aria-label="Previous"
              disabled={!canPrev}
              onClick={() => scrollBy(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className="g-carousel__btn"
              aria-label="Next"
              disabled={!canNext}
              onClick={() => scrollBy(1)}
            >
              →
            </button>
          </div>
        ) : null}
      </div>
      <div ref={trackRef} className="g-carousel__track">
        {items.map((child, i) => (
          <div key={i} className={slideClassName}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CarouselSlide({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  if (Platform.OS !== 'web') return <>{children}</>
  return <div className={`g-carousel__inner ${className}`.trim()}>{children}</div>
}
