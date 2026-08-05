import { Head } from 'one'
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  FACEBOOK_DOMAIN_VERIFICATION,
  GOOGLE_SITE_VERIFICATION,
  KEYWORDS,
  OG_IMAGE,
  organizationJsonLd,
  SHORT_DESCRIPTION,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_PUBLISHER,
  titleFor,
  TWITTER_CREATOR,
  webSiteJsonLd,
  type SeoProps,
} from '~/lib/seo'

/** Per-route document head (title, description, Open Graph, Twitter). */
export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = OG_IMAGE,
  noIndex = false,
  type = 'website',
  includeJsonLd = false,
}: SeoProps & { includeJsonLd?: boolean }) {
  const fullTitle = titleFor(title)
  const url = absoluteUrl(path)
  const img = image || OG_IMAGE
  const robots = noIndex
    ? 'noindex, nofollow'
    : 'index, follow'
  const googlebot = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1'

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={SITE_AUTHOR} />
      <meta name="keywords" content={KEYWORDS} />
      <meta name="publisher" content={SITE_PUBLISHER} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={googlebot} />
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      <meta name="facebook-domain-verification" content={FACEBOOK_DOMAIN_VERIFICATION} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || SHORT_DESCRIPTION} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={TWITTER_CREATOR} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || SHORT_DESCRIPTION} />
      <meta name="twitter:image" content={img} />

      {includeJsonLd ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
          />
        </>
      ) : null}
    </Head>
  )
}
