import { Image as RNImage, Platform, type ImageStyle, type StyleProp } from 'react-native'
import type { CSSProperties } from 'react'

type Props = {
  src?: string | null
  uri?: string | null
  alt?: string
  width?: number | `${number}%` | '100%'
  height?: number | `${number}%` | '100%'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  priority?: boolean
  /** Absolute fill inside a positioned aspect-ratio frame (web). */
  fill?: boolean
  style?: StyleProp<ImageStyle> | CSSProperties
  className?: string
}

/**
 * Cross-platform remote image.
 * Uses <img> on web (correct SSR src) and RN Image on native.
 */
export function GalleryImage({
  src,
  uri,
  alt = '',
  width = '100%',
  height = '100%',
  objectFit = 'cover',
  priority,
  fill = false,
  style,
  className,
}: Props) {
  const resolved = (src || uri || '/placeholder.svg') as string

  if (Platform.OS === 'web') {
    const flat = (typeof style === 'object' && style && !Array.isArray(style)
      ? (style as CSSProperties)
      : {}) as CSSProperties

    const onError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      if (img.dataset.fallback === '1') return
      img.dataset.fallback = '1'
      img.src = '/placeholder.svg'
    }

    if (fill) {
      return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
          src={resolved}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`g-img-fill ${className || ''}`}
          onError={onError}
          style={{
            objectFit,
            backgroundColor: '#ece7df',
            ...flat,
          }}
        />
      )
    }

    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        src={resolved}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={className}
        onError={onError}
        style={{
          display: 'block',
          width: typeof width === 'number' ? width : width,
          height: typeof height === 'number' ? height : height,
          objectFit,
          backgroundColor: '#ece7df',
          ...flat,
        }}
      />
    )
  }

  return (
    <RNImage
      source={{ uri: resolved }}
      accessibilityLabel={alt}
      resizeMode={
        objectFit === 'contain'
          ? 'contain'
          : objectFit === 'fill'
            ? 'stretch'
            : 'cover'
      }
      style={[
        fill
          ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
          : {
              width: width as any,
              height: height as any,
            },
        { backgroundColor: '#ece7df' },
        style as ImageStyle,
      ]}
    />
  )
}
