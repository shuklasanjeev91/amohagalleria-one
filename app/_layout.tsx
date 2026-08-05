import { Slot, useLoader } from 'one'
import type { ReactNode } from 'react'
import { Platform, ScrollView } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider, Theme, YStack } from 'tamagui'
import { BottomTabBar } from '~/components/gallery/BottomTabBar'
import { GtmNoscript } from '~/components/gallery/MarketingScripts'
import { MobileTopBar } from '~/components/gallery/MobileTopBar'
import { SiteFooter } from '~/components/gallery/SiteFooter'
import { SiteHeader } from '~/components/gallery/SiteHeader'
import type { SearchHit } from '~/components/gallery/SearchBar'
import { AuthProvider } from '~/lib/AuthProvider'
import { getGalleryInfo, type GalleryInfo } from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  FACEBOOK_DOMAIN_VERIFICATION,
  GOOGLE_SITE_VERIFICATION,
  GTM_ID,
  KEYWORDS,
  OG_IMAGE,
  organizationJsonLd,
  SHORT_DESCRIPTION,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_PUBLISHER,
  TWITTER_CREATOR,
  absoluteUrl,
  getSiteUrl,
  webSiteJsonLd,
} from '~/lib/seo'
import config from '../tamagui.config'

export async function loader() {
  const [catalogue, info] = await Promise.all([getMergedCatalogue(), getGalleryInfo()])
  const searchIndex: SearchHit[] = [
    ...catalogue.artworks.map((w) => ({
      kind: 'work' as const,
      slug: w.slug,
      title: w.title,
      meta: w.artistName,
      image: w.image,
    })),
    ...catalogue.artists
      .filter((a) => a.attributed)
      .map((a) => ({
        kind: 'artist' as const,
        slug: a.slug,
        title: a.name,
        meta: a.discipline,
        image: a.portrait,
      })),
  ]
  return { info, searchIndex }
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <Theme name="light">
          <AuthProvider>{children}</AuthProvider>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  )
}

type ShellData = {
  info: GalleryInfo
  searchIndex: SearchHit[]
}

function Shell({
  children,
  info,
  searchIndex,
}: {
  children: ReactNode
} & ShellData) {
  const isNative = Platform.OS !== 'web'

  if (isNative) {
    return (
      <YStack flex={1} backgroundColor="$background" minHeight="100%">
        <MobileTopBar
          shortName={info.shortName}
          logo={info.logo}
          name={info.name}
          searchIndex={searchIndex}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} width="100%">
            {children}
          </YStack>
        </ScrollView>
        <BottomTabBar />
      </YStack>
    )
  }

  return (
    <YStack
      className="app-shell"
      flex={1}
      backgroundColor="$background"
      minHeight="100%"
      width="100%"
      maxWidth="100%"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Desktop chrome — CSS hides below 1024px */}
      <div className="g-desktop-only" style={{ width: '100%' }}>
        <SiteHeader
          shortName={info.shortName}
          logo={info.logo}
          name={info.name}
          searchIndex={searchIndex}
        />
      </div>

      {/* Native-style chrome — CSS shows below 1024px */}
      <MobileTopBar
        shortName={info.shortName}
        logo={info.logo}
        name={info.name}
        searchIndex={searchIndex}
      />

      <YStack
        className="app-main"
        flex={1}
        tag="main"
        width="100%"
        maxWidth="100%"
        style={{ flex: '1 0 auto', width: '100%', maxWidth: '100%' }}
      >
        {children}
      </YStack>

      <div className="g-desktop-only app-footer" style={{ marginTop: 'auto', width: '100%' }}>
        <SiteFooter info={info} />
      </div>

      <BottomTabBar />
    </YStack>
  )
}

export default function Layout() {
  const data = useLoader(loader)
  const info = data?.info
  const searchIndex = data?.searchIndex ?? []

  const content = (
    <Providers>
      {info ? (
        <Shell info={info} searchIndex={searchIndex}>
          <Slot />
        </Shell>
      ) : (
        <YStack flex={1} backgroundColor="$background" minHeight="100%">
          <Slot />
        </YStack>
      )}
    </Providers>
  )

  if (Platform.OS === 'web') {
    const siteUrl = getSiteUrl()
    return (
      <html lang="en" style={{ height: '100%' }}>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
          />
          <meta name="theme-color" content="#f8f6f2" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />

          <title>{DEFAULT_TITLE}</title>
          <meta name="description" content={DEFAULT_DESCRIPTION} />
          <meta name="author" content={SITE_AUTHOR} />
          <meta name="keywords" content={KEYWORDS} />
          <meta name="publisher" content={SITE_PUBLISHER} />
          <meta name="robots" content="index, follow" />
          <meta
            name="googlebot"
            content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"
          />
          <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
          <meta name="facebook-domain-verification" content={FACEBOOK_DOMAIN_VERIFICATION} />
          <link rel="canonical" href={absoluteUrl('/')} />

          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={DEFAULT_TITLE} />
          <meta property="og:description" content={SHORT_DESCRIPTION} />
          <meta property="og:url" content={siteUrl} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta property="og:locale" content="en_IN" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:creator" content={TWITTER_CREATOR} />
          <meta name="twitter:title" content={DEFAULT_TITLE} />
          <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
          <meta name="twitter:image" content={OG_IMAGE} />

          <link rel="manifest" href="/site.webmanifest" />
          <link rel="icon" href="/favicon.svg" />
          <link
            rel="icon"
            href="/icon-light-32x32.png"
            media="(prefers-color-scheme: light)"
          />
          <link
            rel="icon"
            href="/icon-dark-32x32.png"
            media="(prefers-color-scheme: dark)"
          />
          <link rel="apple-touch-icon" href="/apple-icon.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
            rel="stylesheet"
          />
          <link rel="stylesheet" href="/gallery.css" />
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd()) }}
          />
          <style>{`
            html, body, #root {
              margin: 0;
              min-height: 100%;
              height: 100%;
              background: #f8f6f2;
              color: #141210;
            }
            body {
              font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
              -webkit-font-smoothing: antialiased;
              display: flex;
              flex-direction: column;
              min-height: 100dvh;
              width: 100%;
              overflow-x: hidden;
            }
            #root {
              flex: 1 0 auto;
              display: flex;
              flex-direction: column;
              min-height: 100%;
              width: 100%;
            }
            #root > * {
              flex: 1 0 auto;
              display: flex;
              flex-direction: column;
              min-height: 100%;
              width: 100%;
            }
            .app-shell {
              flex: 1 0 auto;
              display: flex !important;
              flex-direction: column !important;
              min-height: 100dvh !important;
              width: 100%;
            }
            .app-main {
              flex: 1 0 auto !important;
              display: block !important;
              width: 100%;
            }
            .app-footer {
              margin-top: auto !important;
              flex-shrink: 0 !important;
              width: 100%;
            }
            ::selection { background: #7a3228; color: #f8f6f2; }
            a { color: inherit; text-decoration: none; }
            .g-img-fill { max-width: none !important; }
          `}</style>
        </head>
        <body>
          <GtmNoscript />
          {content}
        </body>
      </html>
    )
  }

  return content
}
