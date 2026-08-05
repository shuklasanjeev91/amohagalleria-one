import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { LabelCaps, Muted } from './primitives'

export function ArtworkViewer({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption: string
}) {
  const [open, setOpen] = useState(false)
  const uri = src || '/placeholder.svg'

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <YStack>
        {Platform.OS === 'web' ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group"
            style={{
              position: 'relative',
              display: 'block',
              width: '100%',
              cursor: 'zoom-in',
              border: 'none',
              padding: 0,
              background: 'var(--gallery-secondary)',
              overflow: 'hidden',
            }}
          >
            <img
              src={uri}
              alt={alt}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
            <span
              className="enlarge-chip"
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                bottom: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(248,246,242,0.9)',
                backdropFilter: 'blur(8px)',
                padding: '8px 12px',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <span aria-hidden>⤢</span>
              <span className="g-label" style={{ color: 'var(--gallery-fg)' }}>
                Enlarge
              </span>
            </span>
            <style>{`
              .group:hover .enlarge-chip { opacity: 1 !important; }
            `}</style>
          </button>
        ) : (
          <YStack
            onPress={() => setOpen(true)}
            backgroundColor="$secondary"
            overflow="hidden"
          >
            <GalleryImage
              src={uri}
              alt={alt}
              width="100%"
              height={400}
              objectFit="contain"
              priority
            />
          </YStack>
        )}
        <Muted marginTop={12} fontSize={12} lineHeight={18}>
          {caption}
        </Muted>
      </YStack>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <YStack flex={1} backgroundColor="rgba(14, 12, 10, 0.94)">
          <XStack
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor="rgba(248,246,242,0.12)"
            paddingHorizontal={20}
            paddingVertical={16}
            $gtMd={{ paddingHorizontal: 40 }}
          >
            <LabelCaps flex={1} numberOfLines={1} color="#a68b6a">
              {caption}
            </LabelCaps>
            <Pressable onPress={() => setOpen(false)}>
              <XStack alignItems="center" gap={8} padding={8}>
                <LabelCaps color="#f8f6f2">Close</LabelCaps>
                <Text fontSize={18} color="#f8f6f2">
                  ×
                </Text>
              </XStack>
            </Pressable>
          </XStack>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
          >
            <Pressable onPress={() => setOpen(false)} style={{ width: '100%' }}>
              {Platform.OS === 'web' ? (
                <img
                  src={uri}
                  alt={alt}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    margin: '0 auto',
                  }}
                />
              ) : (
                <GalleryImage
                  src={uri}
                  alt={alt}
                  width="100%"
                  height={500}
                  objectFit="contain"
                />
              )}
            </Pressable>
          </ScrollView>
        </YStack>
      </Modal>
    </>
  )
}
