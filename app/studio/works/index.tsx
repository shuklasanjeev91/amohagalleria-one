import { Link } from 'one'
import { useEffect, useState } from 'react'
import { Image } from 'react-native'
import { Text, YStack } from 'tamagui'
import { GBanner, GButton, GEmpty, GListRow, GPage } from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, Muted } from '~/components/gallery/primitives'
import { deleteOwnArtwork, listMyArtworks, type StudioArtwork } from '~/lib/studio'

export const sitemap = { exclude: true }

export default function StudioWorksPage() {
  const [works, setWorks] = useState<StudioArtwork[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setWorks(await listMyArtworks())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function remove(w: StudioArtwork) {
    if (w.status === 'published') {
      setErr('Published works can only be removed by an admin.')
      return
    }
    if (typeof confirm === 'function' && !confirm(`Delete “${w.title}”?`)) return
    setErr(null)
    const res = await deleteOwnArtwork(w.id)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    await refresh()
  }

  return (
    <StudioGate requireArtist>
      <GPage>
        <PageHeader
          eyebrow="Studio"
          title="Your works"
          lede="Draft and submit artworks for publication. Admins publish them to the public catalogue."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="works" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          <YStack marginBottom="$4">
            <GButton href="/studio/works/new">Upload artwork</GButton>
          </YStack>
          {loading ? <Muted>Loading…</Muted> : null}
          {!loading && works.length === 0 ? <GEmpty>No artworks yet.</GEmpty> : null}
          {!loading
            ? works.map((w) => (
                <GListRow
                  key={w.id}
                  thumb={
                    w.image_url ? (
                      <Image
                        source={{ uri: w.image_url }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    ) : undefined
                  }
                  title={w.title}
                  meta={[w.status, w.medium_name, w.year].filter(Boolean).join(' · ')}
                  actions={
                    <>
                      <Link href={`/studio/works/${w.id}` as any}>
                        <Text color="$accent" fontSize={13}>
                          Edit
                        </Text>
                      </Link>
                      {w.status !== 'published' ? (
                        <Text color="$accent" fontSize={13} onPress={() => void remove(w)}>
                          Delete
                        </Text>
                      ) : null}
                    </>
                  }
                />
              ))
            : null}
        </Container>
      </GPage>
    </StudioGate>
  )
}
