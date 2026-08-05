import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useGalleryAuth } from './AuthProvider'
import {
  addToCart,
  clearCart,
  listCart,
  mergeCartOnLogin,
  removeFromCart,
  type CartItem,
} from './enquiries'

type EnquiryCartValue = {
  items: CartItem[]
  count: number
  loading: boolean
  refresh: () => Promise<void>
  add: (artworkId: string) => Promise<{ ok: true } | { ok: false; error: string }>
  remove: (itemId: string) => Promise<void>
  clear: () => Promise<void>
}

const EnquiryCartContext = createContext<EnquiryCartValue | null>(null)

export function EnquiryCartProvider({ children }: { children: ReactNode }) {
  const { user } = useGalleryAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setItems(await listCart())
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (user) await mergeCartOnLogin()
      if (!cancelled) await refresh()
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, refresh])

  const value = useMemo<EnquiryCartValue>(
    () => ({
      items,
      count: items.length,
      loading,
      refresh,
      add: async (artworkId: string) => {
        const res = await addToCart(artworkId)
        if (res.ok) await refresh()
        return res
      },
      remove: async (itemId: string) => {
        await removeFromCart(itemId)
        await refresh()
      },
      clear: async () => {
        await clearCart()
        await refresh()
      },
    }),
    [items, loading, refresh],
  )

  return <EnquiryCartContext.Provider value={value}>{children}</EnquiryCartContext.Provider>
}

export function useEnquiryCart() {
  const ctx = useContext(EnquiryCartContext)
  if (!ctx) {
    throw new Error('useEnquiryCart must be used within EnquiryCartProvider')
  }
  return ctx
}
