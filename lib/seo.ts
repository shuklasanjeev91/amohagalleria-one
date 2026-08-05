/**
 * Marketing / SEO defaults mirrored from https://www.amohagalleria.com
 * (meta, Open Graph, Twitter, verifications, GTM, social profiles).
 */

export const SITE_NAME = 'amohagalleria'
export const SITE_BRAND = 'Amoha Galleria'
export const SITE_AUTHOR = 'Amoha Galleria Team'
export const SITE_PUBLISHER = 'Amoha Galleria'

/** Production origin — override with VITE_SITE_URL / EXPO_PUBLIC_SITE_URL when deploying elsewhere. */
export function getSiteUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' &&
      (process.env.VITE_SITE_URL ||
        process.env.EXPO_PUBLIC_SITE_URL ||
        process.env.ONE_SERVER_URL)) ||
    ''
  const trimmed = String(fromEnv).replace(/\/$/, '')
  return trimmed || 'https://www.amohagalleria.com'
}

export const DEFAULT_TITLE = 'Modern Wall Art Painting - Art Gallery | Amoha Galleria'

export const DEFAULT_DESCRIPTION =
  'Enhance your home by beautiful wall paintings at Amoha Galleria. With our finest collection of arts, Indian artists are being featured in our platform to buy from. Shop Online now with Free Shipping and exemplary customer care'

export const SHORT_DESCRIPTION = 'Enhance your home by beautiful wall paintings at Amoha Galleria.'

export const KEYWORDS = [
  'amoha',
  'gallery',
  'bedroom',
  'bedroom wall painting',
  'flower wall painting',
  '3d wall painting for home',
  'wall paintings for sale',
  '3d wall paintings for sale',
  'wall painting for sale online',
  'hand painted wall art for sale',
  'buy wall painting',
  'buy wall painting online',
  'buy wall art online',
  'where to buy paintings in Delhi',
  'buy paintings in Delhi',
  'buy paintings online Delhi',
  'modern 3d wall painting',
  'creative wall painting art',
].join(',')

/** Primary share image (from amoha.com og/twitter tags). */
export const OG_IMAGE =
  'https://res.cloudinary.com/dkyjgpo7s/image/upload/v1732619003/pvrect8libhmlui67ynp.png'

/** Brand logo used on amoha.com og:image alternate. */
export const OG_LOGO =
  'https://uckttlzwlqkvoahi.public.blob.vercel-storage.com/logo/amohagalleria-HHKrlahRMpINXGJAAuwzqcJAZRi0wm.png'

export const TWITTER_CREATOR = '@sandeep'

/** Google Tag Manager — from amoha.com head snippet. */
export const GTM_ID = 'GTM-PRG64K8T'

export const GOOGLE_SITE_VERIFICATION = '8_nVc157bvGgOvmByAl86KyppW52lffidd8T-NpmrwU'
export const FACEBOOK_DOMAIN_VERIFICATION = 'boms3ig3qjvlxy930hilua5i2a5rj7'

/** Public social profiles (verified against live pages; IG handle is @amoha.galleria). */
export const SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/amoha.galleria/',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/amohagalleria',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/amoha-galleria',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@amohagalleria',
  },
] as const

export type SeoProps = {
  title?: string
  description?: string
  path?: string
  image?: string | null
  noIndex?: boolean
  type?: 'website' | 'article' | 'product'
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl()
  if (!path || path === '/') return `${base}/`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function titleFor(pageTitle?: string): string {
  if (!pageTitle?.trim()) return DEFAULT_TITLE
  if (pageTitle.includes('Amoha')) return pageTitle.trim()
  return `${pageTitle.trim()} | ${SITE_BRAND}`
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ArtGallery',
    name: SITE_BRAND,
    alternateName: 'Adishakti Museum of Heritage & Arts',
    url: getSiteUrl(),
    logo: OG_LOGO,
    image: OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    email: 'info@amohagalleria.com',
    telephone: '+91-9911189033',
    sameAs: SOCIAL_LINKS.map((s) => s.href),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jaipur',
      addressCountry: 'IN',
    },
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_BRAND,
    url: getSiteUrl(),
    description: SHORT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_PUBLISHER,
    },
  }
}
