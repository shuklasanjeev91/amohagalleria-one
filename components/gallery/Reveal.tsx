import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { YStack, type YStackProps } from 'tamagui'

export function Reveal({
  children,
  delay = 0,
  as,
  className,
  ...props
}: YStackProps & {
  children: ReactNode
  delay?: number
  as?: string
  className?: string
}) {
  const ref = useRef<any>(null)
  const [shown, setShown] = useState(Platform.OS !== 'web')

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setShown(true)
      return
    }
    const node = ref.current as HTMLElement | null
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (Platform.OS === 'web') {
    return (
      <div
        ref={ref}
        className={`g-reveal ${shown ? 'is-shown' : ''} ${className || ''}`}
        style={{
          transitionDelay: `${delay}ms`,
          width: '100%',
          ...(props as any)?.style,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <YStack opacity={shown ? 1 : 0} y={shown ? 0 : 16} width="100%" {...props}>
      {children}
    </YStack>
  )
}
