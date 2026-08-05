import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { Reveal } from './Reveal'
import { LabelCaps, Muted } from './primitives'

export type MediaItem = {
  src: string
  alt?: string
  title?: string
}

function MediaCard({
  item,
  index,
  total,
  priority,
  onOpen,
  compact = false,
}: {
  item: MediaItem
  index: number
  total: number
  priority?: boolean
  onOpen: () => void
  compact?: boolean
}) {
  const label = item.title || `Coverage ${String(index + 1).padStart(2, '0')}`

  if (Platform.OS === 'web') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`g-media-card${compact ? ' g-media-card--compact' : ''}`}
        aria-label={`Open ${label}`}
      >
        <span className="g-media-card__frame">
          <GalleryImage
            src={item.src}
            alt={item.alt || label}
            fill
            objectFit="cover"
            priority={priority}
          />
          <span className="g-media-card__veil" aria-hidden />
          <span className="g-media-card__chip">
            <span aria-hidden>⤢</span>
            <span className="g-label">View</span>
          </span>
        </span>
        <span className="g-media-card__meta">
          <span className="g-label" style={{ color: 'var(--gallery-bronze)' }}>
            {String(index + 1).padStart(2, '0')}
            {!compact ? ` / ${String(total).padStart(2, '0')}` : ''}
          </span>
          {!compact ? <span className="g-media-card__title">{label}</span> : null}
        </span>
      </button>
    )
  }

  return (
    <YStack width="100%" onPress={onOpen} pressStyle={{ opacity: 0.92 }} cursor="pointer">
      <YStack
        width="100%"
        aspectRatio={4 / 5}
        overflow="hidden"
        backgroundColor="$secondary"
        position="relative"
      >
        <GalleryImage
          src={item.src}
          alt={item.alt || label}
          fill
          objectFit="cover"
          priority={priority}
        />
      </YStack>
      {!compact ? (
        <XStack marginTop={14} justifyContent="space-between" alignItems="flex-start" gap={12}>
          <YStack flex={1} gap={4}>
            <LabelCaps color="$accent">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </LabelCaps>
            <Text fontFamily="$heading" fontSize={20} lineHeight={26}>
              {label}
            </Text>
          </YStack>
          <LabelCaps paddingTop={4}>View</LabelCaps>
        </XStack>
      ) : (
        <LabelCaps marginTop={10} color="$accent">
          {String(index + 1).padStart(2, '0')}
        </LabelCaps>
      )}
    </YStack>
  )
}

function MediaLightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: MediaItem[]
  index: number
  onClose: () => void
  onChange: (next: number) => void
}) {
  const item = items[index]
  if (!item) return null

  const label = item.title || `Coverage ${String(index + 1).padStart(2, '0')}`
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [hasNext, hasPrev, index, onChange, onClose])

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <YStack
        flex={1}
        {...(Platform.OS === 'web'
          ? {
              className: 'g-lightbox',
              style: { background: 'rgba(14, 12, 10, 0.94)' },
            }
          : { backgroundColor: 'rgba(14, 12, 10, 0.96)' })}
      >
        <XStack
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor="rgba(248,246,242,0.12)"
          paddingHorizontal={20}
          paddingVertical={18}
          $gtMd={{ paddingHorizontal: 40 }}
          gap={16}
        >
          <YStack flex={1} minWidth={0} gap={4}>
            <LabelCaps color="#a68b6a">
              Media · {String(index + 1).padStart(2, '0')} of{' '}
              {String(items.length).padStart(2, '0')}
            </LabelCaps>
            <Text
              fontFamily="$heading"
              fontSize={22}
              lineHeight={28}
              color="#f8f6f2"
              numberOfLines={1}
              {...(Platform.OS === 'web'
                ? {
                    style: {
                      fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                      fontSize: 24,
                      lineHeight: '1.2',
                      color: '#f8f6f2',
                    },
                  }
                : null)}
            >
              {label}
            </Text>
          </YStack>

          <XStack alignItems="center" gap={8}>
            <Pressable
              onPress={() => hasPrev && onChange(index - 1)}
              disabled={!hasPrev}
              style={{ opacity: hasPrev ? 1 : 0.35 }}
            >
              <XStack
                alignItems="center"
                gap={8}
                paddingHorizontal={12}
                paddingVertical={10}
                borderWidth={1}
                borderColor="rgba(248,246,242,0.18)"
              >
                <Text color="#f8f6f2" fontSize={16}>
                  ←
                </Text>
                <LabelCaps color="#f8f6f2">Prev</LabelCaps>
              </XStack>
            </Pressable>
            <Pressable
              onPress={() => hasNext && onChange(index + 1)}
              disabled={!hasNext}
              style={{ opacity: hasNext ? 1 : 0.35 }}
            >
              <XStack
                alignItems="center"
                gap={8}
                paddingHorizontal={12}
                paddingVertical={10}
                borderWidth={1}
                borderColor="rgba(248,246,242,0.18)"
              >
                <LabelCaps color="#f8f6f2">Next</LabelCaps>
                <Text color="#f8f6f2" fontSize={16}>
                  →
                </Text>
              </XStack>
            </Pressable>
            <Pressable onPress={onClose}>
              <XStack
                alignItems="center"
                gap={8}
                paddingHorizontal={12}
                paddingVertical={10}
                backgroundColor="rgba(248,246,242,0.1)"
              >
                <LabelCaps color="#f8f6f2">Close</LabelCaps>
                <Text color="#f8f6f2" fontSize={18}>
                  ×
                </Text>
              </XStack>
            </Pressable>
          </XStack>
        </XStack>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 28,
            paddingHorizontal: 20,
          }}
        >
          <Pressable onPress={onClose} style={{ width: '100%', maxWidth: 1100 }}>
            {Platform.OS === 'web' ? (
              <img
                src={item.src}
                alt={item.alt || label}
                className="g-lightbox__image"
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: '78vh',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              />
            ) : (
              <GalleryImage
                src={item.src}
                alt={item.alt || label}
                width="100%"
                height={520}
                objectFit="contain"
              />
            )}
          </Pressable>
          <Muted marginTop={20} textAlign="center" color="rgba(248,246,242,0.55)" fontSize={13}>
            Use ← → to browse · Esc to close
          </Muted>
        </ScrollView>
      </YStack>
    </Modal>
  )
}

export function MediaCoverageGrid({
  images,
  titlePrefix = 'Press',
  columns = 4,
  layout = 'grid',
}: {
  images: string[]
  titlePrefix?: string
  columns?: 2 | 3 | 4
  layout?: 'grid' | 'row'
}) {
  const [active, setActive] = useState<number | null>(null)

  const items: MediaItem[] = images.map((src, i) => ({
    src,
    alt: `Media coverage ${i + 1}`,
    title: `${titlePrefix} ${String(i + 1).padStart(2, '0')}`,
  }))

  if (items.length === 0) return null

  const isRow = layout === 'row'
  const gridClass = isRow
    ? 'g-media-grid g-media-grid--row'
    : columns === 2
      ? 'g-media-grid g-media-grid--2'
      : columns === 3
        ? 'g-media-grid g-media-grid--3'
        : 'g-media-grid'

  return (
    <>
      {Platform.OS === 'web' ? (
        <div
          className={gridClass}
          style={
            isRow
              ? ({ ['--media-cols']: String(items.length) } as Record<string, string>)
              : undefined
          }
        >
          {items.map((item, i) => (
            <Reveal key={item.src} delay={Math.min(i, 8) * 40}>
              <MediaCard
                item={item}
                index={i}
                total={items.length}
                priority={i < (isRow ? items.length : columns)}
                onOpen={() => setActive(i)}
                compact={isRow}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <XStack flexWrap={isRow ? 'nowrap' : 'wrap'} gap={16} rowGap={40}>
          {items.map((item, i) => (
            <YStack
              key={item.src}
              width={isRow ? 140 : '47%'}
              flexShrink={0}
              $gtMd={{ width: isRow ? 160 : columns >= 3 ? '31%' : '47%' }}
            >
              <MediaCard
                item={item}
                index={i}
                total={items.length}
                priority={i < 4}
                onOpen={() => setActive(i)}
                compact={isRow}
              />
            </YStack>
          ))}
        </XStack>
      )}

      {active !== null ? (
        <MediaLightbox
          items={items}
          index={active}
          onClose={() => setActive(null)}
          onChange={setActive}
        />
      ) : null}
    </>
  )
}
