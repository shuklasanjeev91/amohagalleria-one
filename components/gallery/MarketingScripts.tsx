import { useEffect } from 'react'
import { Platform } from 'react-native'
import { GTM_ID } from '~/lib/seo'

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/** Inject Google Tag Manager (same container as amohagalleria.com). */
export function MarketingScripts() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    if (document.getElementById('amoha-gtm')) return

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

    const script = document.createElement('script')
    script.id = 'amoha-gtm'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
    document.head.appendChild(script)
  }, [])

  return null
}

/** GTM noscript iframe for body (web only). */
export function GtmNoscript() {
  if (Platform.OS !== 'web') return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
