import { Link, useLoader } from 'one'
import { Platform } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ArrowLink } from '~/components/gallery/ArrowLink'
import { ArtworkCard } from '~/components/gallery/ArtworkCard'
import { GalleryCarousel } from '~/components/gallery/Carousel'
import { ExhibitionCard } from '~/components/gallery/ExhibitionCard'
import { GalleryImage } from '~/components/gallery/GalleryImage'
import { MediaCoverageGrid } from '~/components/gallery/MediaCoverage'
import { SectionHeading } from '~/components/gallery/PageHeader'
import { Reveal } from '~/components/gallery/Reveal'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps, Muted, SerifHeading, WorkGrid } from '~/components/gallery/primitives'
import {
  exhibitionStatusLabel,
    getGalleryInfo,
  leadExhibition,
  worksByArtist,
  type Artist,
  type Artwork,
} from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'

function pickImages(pool: (string | null | undefined)[], count: number) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const src of pool) {
    if (!src || seen.has(src)) continue
    seen.add(src)
    out.push(src)
    if (out.length >= count) break
  }
  return out
}

export async function loader() {
  const [catalogue, info] = await Promise.all([getMergedCatalogue(), getGalleryInfo()])
  const lead = leadExhibition(catalogue)
  const liveLead =
    lead && (lead.status === 'Current' || lead.status === 'Upcoming') ? lead : null

  const featured = catalogue.artworks.filter((w) => w.about.length > 0).slice(0, 7)
  const arrivals = [...catalogue.artworks]
    .sort((a, b) => (b.opens || '').localeCompare(a.opens || ''))
    .slice(0, 6)

  const exhibitions = catalogue.exhibitions
    .filter((e) => e.status === 'Current' || e.status === 'Upcoming')
    .slice(0, 3)

  const origins = catalogue.countries.slice(0, 8)

  const roomCategory =
    [...catalogue.categories]
      .map((name) => ({
        name,
        works: catalogue.artworks.filter((w) => w.category === name).slice(0, 4),
      }))
      .sort((a, b) => b.works.length - a.works.length)
      .find((c) => c.works.length >= 3) ?? null

  const artistsRaw = catalogue.artists.filter(
    (a) => a.attributed && a.workCount > 0,
  )
  const artists = artistsRaw
    .slice()
    .sort((a, b) => b.workCount - a.workCount || a.name.localeCompare(b.name))
    .slice(0, 12)
    .map((a) => {
      const works = worksByArtist(catalogue, a.slug)
      return {
        ...a,
        portrait: a.portrait || works[0]?.image || null,
        sampleWorks: works.slice(0, 3).map((w) => w.image).filter(Boolean),
      }
    })

  const spotlightCandidate =
    [...artistsRaw]
      .filter((a) => {
        const works = worksByArtist(catalogue, a.slug)
        return a.bio.length > 0 && works.length > 0 && (a.portrait || works[0]?.image)
      })
      .sort((a, b) => b.bio.join(' ').length - a.bio.join(' ').length)[0] ??
    artists.find((a) => worksByArtist(catalogue, a.slug).length > 0) ??
    null

  const spotlightWorks = spotlightCandidate
    ? worksByArtist(catalogue, spotlightCandidate.slug).slice(0, 12)
    : []

  const spotlight = spotlightCandidate
    ? {
        ...spotlightCandidate,
        portrait:
          spotlightCandidate.portrait ||
          spotlightWorks[0]?.image ||
          null,
        years: [
          ...new Set(
            spotlightWorks
              .map((w) => w.year)
              .filter((y) => /^\d{4}$/.test(y) && Number(y) >= 1900 && Number(y) <= 2100),
          ),
        ].sort(),
        excerpt: spotlightCandidate.bio
          .filter((p) => p !== spotlightCandidate.short && p.length >= 40)
          .slice(0, 2),
      }
    : null

  const mediums = catalogue.categories.map((name) => {
    const works = catalogue.artworks.filter((w) => w.category === name)
    return {
      name,
      count: works.length,
      image: works.find((w) => w.image)?.image ?? null,
    }
  })

  const workImages = catalogue.artworks.map((w) => w.image)
  const conciergeImages = pickImages(
    [
      info.spaceImages[0],
      featured[0]?.image,
      info.amohaImages[0],
      arrivals[0]?.image,
      info.spaceImages[1],
      featured[1]?.image,
      info.mediaImages[0],
      arrivals[1]?.image,
      ...workImages,
    ],
    4,
  )
  const circleImages = pickImages(
    [
      ...featured.map((w) => w.image),
      ...arrivals.map((w) => w.image),
      ...info.spaceImages,
      ...workImages,
    ],
    6,
  )

  return {
    catalogue,
    info,
    lead: liveLead,
    featured,
    arrivals,
    artists,
    spotlight,
    spotlightWorks,
    mediums,
    exhibitions,
    origins,
    roomCategory,
    conciergeImages,
    circleImages,
  }
}

function MediaStrip({
  images,
  alt,
  hrefs,
}: {
  images: string[]
  alt: string
  hrefs?: string[]
}) {
  if (images.length === 0) return null

  if (Platform.OS === 'web') {
    return (
      <div className="g-img-grid">
        {images.map((src, i) => {
          const inner = (
            <>
              <GalleryImage
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                objectFit="cover"
                priority={i < 6}
              />
            </>
          )
          const href = hrefs?.[i]
          if (href) {
            return (
              <Link key={`${src}-${i}`} href={href as any} className="g-img-grid__cell">
                {inner}
              </Link>
            )
          }
          return (
            <div key={`${src}-${i}`} className="g-img-grid__cell">
              {inner}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <XStack flexWrap="wrap" gap="$3">
      {images.map((src, i) => {
        const cell = (
          <YStack
            width="47%"
            aspectRatio={4 / 5}
            overflow="hidden"
            backgroundColor="$secondary"
            position="relative"
          >
            <GalleryImage src={src} alt={`${alt} ${i + 1}`} fill objectFit="cover" />
          </YStack>
        )
        const href = hrefs?.[i]
        if (href) {
          return (
            <Link key={`${src}-${i}`} href={href as any}>
              {cell}
            </Link>
          )
        }
        return <YStack key={`${src}-${i}`}>{cell}</YStack>
      })}
    </XStack>
  )
}

function sectionIndex(n: number) {
  return String(n).padStart(2, '0')
}

export default function HomePage() {
  const {
    catalogue,
    info,
    lead,
    featured,
    arrivals,
    artists,
    spotlight,
    spotlightWorks,
    mediums,
    exhibitions,
    origins,
    roomCategory,
    conciergeImages,
    circleImages,
  } = useLoader(loader)

  if (!catalogue.ok && !info.spaceImages.length && !info.vision) {
    return (
      <Container className="g-container" width="100%" maxWidth="100%" pt="$12" $gtMd={{ pt: '$20' }}>
        <SeoHead path="/" />
        <SerifHeading size="display">{info.name}</SerifHeading>
        <Muted mt="$6" maxWidth={480} fontFamily="$heading" fontSize="$7" fontStyle="italic">
          The live catalogue at amohagalleria.com could not be reached. Please try again in a
          moment.
        </Muted>
      </Container>
    )
  }

  const exhibitionImages = lead?.images?.length ? lead.images : []
  const heroImage =
    exhibitionImages[0] ||
    info.spaceImages[0] ||
    info.amohaImages[0] ||
    featured[0]?.image ||
    null

  const brand = info.name
  const headline = lead?.title ?? info.fullName ?? info.name
  const lede =
    lead?.tagline ??
    info.tagline ??
    'A private viewing room for heritage, painting and contemporary craft.'

  let idx = 0
  const next = () => sectionIndex(++idx)

  return (
    <YStack width="100%">
      <SeoHead path="/" />
      {Platform.OS === 'web' && heroImage ? (
        <section className="g-hero-stage g-hero-stage--lux">
          <div className="g-hero-stage__media">
            <GalleryImage
              src={heroImage}
              alt={headline}
              fill
              objectFit="cover"
              priority
            />
          </div>
          <div className="g-hero-stage__veil" aria-hidden />
          <div className="g-hero-stage__content">
            <Reveal>
              <p className="g-hero-brand">{brand}</p>
              <h1 className="g-hero" style={{ marginTop: 18, maxWidth: lead ? '18ch' : '14ch' }}>
                {headline}
              </h1>
              <p className="g-lede" style={{ marginTop: 22, maxWidth: 'min(36rem, 100%)' }}>
                {lede}
              </p>
              <div className="g-hero-cta">
                {lead ? (
                  <ArrowLink href={`/exhibitions/${lead.slug}`}>
                    {lead.status === 'Current' ? 'Enter the exhibition' : 'Preview the exhibition'}
                  </ArrowLink>
                ) : (
                  <ArrowLink href="/works">Enter the viewing room</ArrowLink>
                )}
                <ArrowLink href="/contact">Request a viewing</ArrowLink>
              </div>
            </Reveal>
            <div className="g-hero-scroll" aria-hidden>
              <span />
            </div>
          </div>
        </section>
      ) : (
        <YStack width="100%" style={{ backgroundColor: '#0e0c0a' }}>
          {heroImage ? (
            <YStack
              width="100%"
              aspectRatio={3 / 4}
              overflow="hidden"
              position="relative"
              style={{ maxHeight: 520 }}
            >
              <GalleryImage src={heroImage} alt={headline} fill objectFit="cover" priority />
              <YStack
                position="absolute"
                style={{
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(14,12,10,0.45)',
                }}
              />
              <YStack
                position="absolute"
                gap="$3"
                style={{
                  left: 0,
                  right: 0,
                  bottom: 0,
                  paddingHorizontal: 20,
                  paddingBottom: 28,
                  paddingTop: 40,
                }}
              >
                <LabelCaps color="#a68b6a">{brand}</LabelCaps>
                <Text
                  fontFamily="$heading"
                  fontSize={40}
                  lineHeight={44}
                  letterSpacing={-0.6}
                  color="#fcfbf8"
                >
                  {headline}
                </Text>
                <Text fontFamily="$heading" fontSize={17} fontStyle="italic" color="#ece7df">
                  {lede}
                </Text>
                <XStack gap="$4" flexWrap="wrap" style={{ marginTop: 8 }}>
                  <Link href={lead ? (`/exhibitions/${lead.slug}` as any) : '/works'}>
                    <Text color="#fcfbf8" fontSize={14} fontWeight="600">
                      {lead
                        ? lead.status === 'Current'
                          ? 'Enter the exhibition →'
                          : 'Preview the exhibition →'
                        : 'Enter the viewing room →'}
                    </Text>
                  </Link>
                  <Link href="/contact">
                    <Text color="#a68b6a" fontSize={14}>
                      Request a viewing →
                    </Text>
                  </Link>
                </XStack>
              </YStack>
            </YStack>
          ) : (
            <Container className="g-container" pt="$16" width="100%">
              <LabelCaps color="$accent">{brand}</LabelCaps>
              <SerifHeading size="hero" mt="$5">
                {headline}
              </SerifHeading>
              <Muted mt="$6" fontFamily="$heading" fontSize="$7" fontStyle="italic">
                {lede}
              </Muted>
            </Container>
          )}
        </YStack>
      )}

      <Container className="g-container" width="100%" maxWidth="100%">
        <Reveal>
          <div className="g-lux-rail">
            <div>
              <span className="g-label">Collection</span>
              <strong>{catalogue.ok ? catalogue.artworks.length : '—'}</strong>
              <em>works</em>
            </div>
            <div>
              <span className="g-label">Artists</span>
              <strong>
                {catalogue.ok ? catalogue.artists.filter((a) => a.attributed).length : '—'}
              </strong>
              <em>represented</em>
            </div>
            <div>
              <span className="g-label">Mediums</span>
              <strong>{catalogue.ok ? catalogue.categories.length : '—'}</strong>
              <em>disciplines</em>
            </div>
            {lead ? (
              <div>
                <span className="g-label">{exhibitionStatusLabel(lead.status)}</span>
                <strong>{lead.dateLabel?.split('–')[0]?.trim() || 'Now'}</strong>
                <em>{lead.title}</em>
              </div>
            ) : (
              <div>
                <span className="g-label">Enquiries</span>
                <strong>Private</strong>
                <em>By appointment</em>
              </div>
            )}
          </div>
        </Reveal>
      </Container>

      {/* Editorial quote */}
      {(info.tagline || info.vision) && Platform.OS === 'web' ? (
        <Container className="g-container g-section g-section--tight">
          <Reveal>
            <blockquote className="g-quote-lux">
              <p>
                “{info.tagline || info.vision!.slice(0, 160)}
                {!info.tagline && info.vision && info.vision.length > 160 ? '…' : ''}”
              </p>
              <cite>{info.fullName ?? info.name}</cite>
            </blockquote>
          </Reveal>
        </Container>
      ) : null}

      {lead && exhibitionImages.length > 1 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title={lead.title}
              action={<ArrowLink href={`/exhibitions/${lead.slug}`}>Exhibition details</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={90} mt="$8">
            <MediaStrip images={exhibitionImages.slice(1, 7)} alt="Exhibition" />
          </Reveal>
        </Container>
      ) : null}

      {/* Programme */}
      {exhibitions.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="Programme"
              action={<ArrowLink href="/exhibitions">All exhibitions</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={70} mt="$8">
            {Platform.OS === 'web' ? (
              <div className={`g-programme${exhibitions.length === 1 ? ' g-programme--solo' : ''}`}>
                {exhibitions.map((show, i) => (
                  <ExhibitionCard key={show.slug} show={show} index={i} featured={i === 0} />
                ))}
              </div>
            ) : (
              <YStack gap="$8">
                {exhibitions.map((show, i) => (
                  <ExhibitionCard key={show.slug} show={show} index={i} />
                ))}
              </YStack>
            )}
          </Reveal>
        </Container>
      ) : null}

      {/* Mediums */}
      {mediums.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="Mediums"
              action={<ArrowLink href="/works">Browse by category</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={70} mt="$8">
            {Platform.OS === 'web' ? (
              <div className="g-mediums-lux">
                {mediums.map((m) => (
                  <Link
                    key={m.name}
                    href={`/works` as any}
                    className="g-mediums-lux__card"
                  >
                    <span className="g-mediums-lux__media">
                      {m.image ? (
                        <GalleryImage
                          src={m.image}
                          alt={m.name}
                          fill
                          objectFit="cover"
                        />
                      ) : null}
                    </span>
                    <span className="g-mediums-lux__meta">
                      <strong>{m.name}</strong>
                      <em>{m.count} works</em>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <XStack flexWrap="wrap" gap="$4">
                {mediums.map((m) => (
                  <LabelCaps key={m.name}>
                    {m.name} · {m.count}
                  </LabelCaps>
                ))}
              </XStack>
            )}
          </Reveal>
        </Container>
      ) : null}

      {/* Selected works */}
      {featured.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="Selected works"
              action={<ArrowLink href="/works">Viewing room</ArrowLink>}
            />
          </Reveal>
          {Platform.OS === 'web' ? (
            <div className="g-salon" style={{ marginTop: 40 }}>
              <Reveal className="g-salon__hero">
                <ArtworkCard work={featured[0]} priority showCategory={false} />
              </Reveal>
              <div className="g-salon__stack">
                {featured.slice(1, 3).map((work, i) => (
                  <Reveal key={work.slug} delay={(i + 1) * 90}>
                    <ArtworkCard work={work} priority={i === 0} showCategory={false} />
                  </Reveal>
                ))}
              </div>
              {featured.length > 3 ? (
                <div className="g-salon__row">
                  {featured.slice(3).map((work, i) => (
                    <Reveal key={work.slug} delay={(i + 1) * 70}>
                      <ArtworkCard work={work} showCategory={false} />
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <WorkGrid>
              {featured.map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 90} width="100%">
                  <ArtworkCard work={work} priority={i < 3} />
                </Reveal>
              ))}
            </WorkGrid>
          )}
        </Container>
      ) : null}

      {/* Room focus */}
      {roomCategory ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title={`${roomCategory.name} room`}
              action={<ArrowLink href="/works">See more</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={70} mt="$8">
            {Platform.OS === 'web' ? (
              <div className="g-room">
                {roomCategory.works.map((work, i) => (
                  <Reveal key={work.slug} delay={i * 60}>
                    <ArtworkCard work={work} showCategory={false} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <WorkGrid>
                {roomCategory.works.map((work) => (
                  <ArtworkCard key={work.slug} work={work} />
                ))}
              </WorkGrid>
            )}
          </Reveal>
        </Container>
      ) : null}

      {/* Spotlight artist */}
      {spotlight ? (
        <YStack
          className="g-section g-spotlight-lux"
          {...(Platform.OS !== 'web' ? { mt: '$16' } : null)}
        >
          <Container className="g-container" width="100%" maxWidth="100%" py="$12" $gtMd={{ py: '$16' }}>
            <Reveal>
              <SectionHeading
                index={next()}
                title="Artist spotlight"
                action={
                  <ArrowLink href={`/artists/${spotlight.slug}`}>View profile</ArrowLink>
                }
              />
            </Reveal>
            <Reveal delay={80} mt="$8">
              <div className="g-spotlight-lux__grid">
                <div className="g-spotlight-lux__portrait g-frame g-frame--portrait">
                  {spotlight.portrait ? (
                    <GalleryImage
                      src={spotlight.portrait}
                      alt={spotlight.name}
                      fill
                      objectFit="cover"
                      priority
                    />
                  ) : null}
                </div>
                <div className="g-spotlight-lux__copy">
                  <LabelCaps color="$accent">
                    {spotlight.disciplines?.length
                      ? spotlight.disciplines.join(' · ')
                      : spotlight.discipline}
                  </LabelCaps>
                  <SerifHeading size="large" mt="$4">
                    {spotlight.name}
                  </SerifHeading>
                  <Muted mt="$4" size="$4" lineHeight="$6" maxWidth={540}>
                    {spotlight.short ||
                      `${spotlight.workCount} works in the Amoha Galleria catalogue.`}
                  </Muted>
                  {spotlight.excerpt?.length > 1 ? (
                    <div className="g-spotlight-lux__bio">
                      {spotlight.excerpt.slice(1).map((para: string) => (
                        <p key={para.slice(0, 40)}>{para}</p>
                      ))}
                    </div>
                  ) : null}
                  <div className="g-spotlight-lux__facts">
                    {spotlight.location ? (
                      <div>
                        <span className="g-label">Based</span>
                        <strong>{spotlight.location}</strong>
                      </div>
                    ) : null}
                    <div>
                      <span className="g-label">Works</span>
                      <strong>{spotlight.workCount}</strong>
                    </div>
                    {spotlight.years?.length ? (
                      <div>
                        <span className="g-label">In catalogue</span>
                        <strong>
                          {spotlight.years[0]}
                          {spotlight.years.length > 1
                            ? ` – ${spotlight.years[spotlight.years.length - 1]}`
                            : ''}
                        </strong>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </Reveal>
            {spotlightWorks.length > 0 ? (
              <Reveal delay={120} mt="$10">
                {Platform.OS === 'web' ? (
                  <GalleryCarousel label={`${spotlight.name} · selected works`}>
                    {spotlightWorks.map((work: Artwork) => (
                      <Link
                        key={work.slug}
                        href={`/works/${work.slug}` as any}
                        className="g-spotlight-lux__work"
                      >
                        <div className="g-frame g-frame--portrait g-spotlight-lux__media">
                          <GalleryImage
                            src={work.image}
                            alt={work.title}
                            fill
                            objectFit="cover"
                          />
                        </div>
                        <span className="g-spotlight-lux__work-meta">
                          <strong>{work.title}</strong>
                          <em>
                            {[work.year, work.category].filter(Boolean).join(' · ')}
                          </em>
                        </span>
                      </Link>
                    ))}
                  </GalleryCarousel>
                ) : (
                  <WorkGrid>
                    {spotlightWorks.slice(0, 4).map((work: Artwork) => (
                      <ArtworkCard key={work.slug} work={work} />
                    ))}
                  </WorkGrid>
                )}
              </Reveal>
            ) : null}
          </Container>
        </YStack>
      ) : null}

      {/* New arrivals */}
      {arrivals.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="Recently listed"
              action={<ArrowLink href="/works">See all works</ArrowLink>}
            />
          </Reveal>
          {Platform.OS === 'web' ? (
            <div className="g-arrivals-lux" style={{ marginTop: 40 }}>
              {arrivals.map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 70}>
                  <ArtworkCard work={work} priority={i < 2} />
                </Reveal>
              ))}
            </div>
          ) : (
            <WorkGrid>
              {arrivals.map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 70} width="100%">
                  <ArtworkCard work={work} />
                </Reveal>
              ))}
            </WorkGrid>
          )}
        </Container>
      ) : null}

      {/* Artists index */}
      {artists.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="Artists"
              action={<ArrowLink href="/artists">All artists</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={80} mt="$8">
            {Platform.OS === 'web' ? (
              <div className="g-artist-lux">
                {artists.map((artist: Artist & { sampleWorks?: string[] }) => (
                  <Link
                    key={artist.slug}
                    href={`/artists/${artist.slug}` as any}
                    className="g-artist-lux__item"
                  >
                    <span className="g-artist-lux__portrait g-frame g-frame--portrait">
                      {artist.portrait ? (
                        <GalleryImage
                          src={artist.portrait}
                          alt={`Portrait of ${artist.name}`}
                          fill
                          objectFit="cover"
                        />
                      ) : (
                        <span className="g-artist-lux__fallback" aria-hidden>
                          {artist.name.slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <span className="g-artist-lux__copy">
                      <strong>{artist.name}</strong>
                      <em>
                        {(artist.disciplines?.length
                          ? artist.disciplines.slice(0, 2).join(' · ')
                          : artist.discipline) || 'Art'}
                        {artist.workCount ? ` · ${artist.workCount} works` : ''}
                      </em>
                      {artist.location ? (
                        <span className="g-artist-lux__place">{artist.location}</span>
                      ) : null}
                      {artist.short ? (
                        <span className="g-artist-lux__blurb">{artist.short}</span>
                      ) : null}
                      <span className="g-artist-lux__cta g-label">
                        View profile <span aria-hidden>→</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <YStack gap="$6">
                {artists.map((artist: Artist) => (
                  <Link key={artist.slug} href={`/artists/${artist.slug}` as any}>
                    <YStack gap="$3">
                      {artist.portrait ? (
                        <YStack
                          width="100%"
                          aspectRatio={4 / 5}
                          overflow="hidden"
                          backgroundColor="$secondary"
                          position="relative"
                        >
                          <GalleryImage
                            src={artist.portrait}
                            alt={artist.name}
                            fill
                            objectFit="cover"
                          />
                        </YStack>
                      ) : null}
                      <Text fontFamily="$heading" fontSize={24}>
                        {artist.name}
                      </Text>
                      <Muted mt="$1">
                        {artist.discipline}
                        {artist.workCount ? ` · ${artist.workCount} works` : ''}
                        {artist.location ? ` · ${artist.location}` : ''}
                      </Muted>
                    </YStack>
                  </Link>
                ))}
              </YStack>
            )}
          </Reveal>
        </Container>
      ) : null}

      {/* Origins */}
      {origins.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading index={next()} title="From around the world" />
          </Reveal>
          <Reveal delay={60} mt="$8">
            {Platform.OS === 'web' ? (
              <div className="g-origins">
                {origins.map((place) => (
                  <span key={place} className="g-origins__chip">
                    {place}
                  </span>
                ))}
              </div>
            ) : (
              <Muted>{origins.join(' · ')}</Muted>
            )}
          </Reveal>
        </Container>
      ) : null}

      {/* Vision */}
      {info.vision ? (
        <YStack
          className="g-section g-manifesto"
          {...(Platform.OS !== 'web' ? { mt: '$16' } : null)}
        >
          <Container className="g-container" width="100%" maxWidth="100%" py="$14" $gtMd={{ py: '$18' }}>
            <Reveal>
              <div className="g-manifesto__grid">
                <div>
                  <LabelCaps color="#a68b6a">The vision · {next()}</LabelCaps>
                  <h2 className="g-manifesto__title">{info.fullName ?? info.name}</h2>
                </div>
                <div>
                  <p className="g-manifesto__body">{info.vision}</p>
                  <div style={{ marginTop: 28 }}>
                    <ArrowLink href="/contact">Speak with us</ArrowLink>
                  </div>
                </div>
              </div>
            </Reveal>
            {info.amohaImages.length > 0 ? (
              <Reveal delay={100} mt="$10">
                <MediaStrip images={info.amohaImages.slice(0, 6)} alt="AMOHA" />
              </Reveal>
            ) : null}
          </Container>
        </YStack>
      ) : null}

      {/* Space */}
      {info.spaceImages.length > 0 ? (
        <Container className="g-container g-section">
          <Reveal>
            <SectionHeading
              index={next()}
              title="The space"
              action={<ArrowLink href="/contact">Enquire</ArrowLink>}
            />
          </Reveal>
          <Reveal delay={80} mt="$8">
            <MediaStrip images={info.spaceImages.slice(0, 6)} alt="Gallery interior" />
          </Reveal>
        </Container>
      ) : null}

      {/* Project DAAN */}
      {info.project ? (
        <Container className="g-container g-section">
          <Reveal>
            <div className="g-daan-lux">
              {info.daanLogo ? (
                <div className="g-daan-lux__mark">
                  <GalleryImage
                    src={info.daanLogo}
                    alt="Project DAAN"
                    width="100%"
                    height="100%"
                    objectFit="contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ) : null}
              <div className="g-daan-lux__copy">
                <LabelCaps color="$accent">Project DAAN · {next()}</LabelCaps>
                <SerifHeading size="large" mt="$3">
                  {info.projectSubtitle ?? 'Donate an artwork for need'}
                </SerifHeading>
                <Muted mt="$4" maxWidth={560} size="$4" lineHeight="$6">
                  {info.project}
                </Muted>
                {info.impact.length > 0 ? (
                  <div className="g-daan-lux__impact">
                    {info.impact.map((line) => (
                      <span key={line} className="g-label">
                        {line}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div style={{ marginTop: 22 }}>
                  <ArrowLink href="/contact">Speak with the gallery</ArrowLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      ) : null}

      {/* Press */}
      {info.mediaImages.length > 0 ? (
        <YStack
          className="g-section g-press-lux"
          {...(Platform.OS !== 'web' ? { mt: '$16' } : null)}
        >
          <Container className="g-container" width="100%" maxWidth="100%" py="$12" $gtMd={{ py: '$16' }}>
            <Reveal>
              <SectionHeading index={next()} title="In the press" />
            </Reveal>
            <Reveal delay={80} mt="$8">
              <MediaCoverageGrid images={info.mediaImages.slice(0, 8)} titlePrefix="Press" />
            </Reveal>
          </Container>
        </YStack>
      ) : null}

      {/* Concierge */}
      <Container className="g-container g-section">
        <Reveal>
          <SectionHeading
            index={next()}
            title="Gallery concierge"
            action={<ArrowLink href="/contact">Speak with us</ArrowLink>}
          />
        </Reveal>
        <Reveal delay={70} mt="$8">
          {Platform.OS === 'web' ? (
            <div className="g-concierge">
              {(
                [
                  {
                    href: '/works',
                    title: 'Private catalogue',
                    body: `Browse ${catalogue.ok ? catalogue.artworks.length : 'the'} works and request availability in confidence.`,
                    cta: 'Enter viewing room',
                  },
                  {
                    href: '/contact',
                    title: 'Acquisition advice',
                    body: 'Curators help place works into new and established collections.',
                    cta: 'Make an enquiry',
                  },
                  {
                    href: '/contact',
                    title: 'Private viewings',
                    body: 'Arrange a remote or in-person private viewing with the gallery team.',
                    cta: 'Request a viewing',
                  },
                  {
                    href: '/contact',
                    title: 'Worldwide delivery',
                    body: 'Packing, insurance guidance and installation advice for collectors abroad.',
                    cta: 'Ask about shipping',
                  },
                ] as const
              ).map((item, i) => (
                <Link key={item.title} href={item.href as any} className="g-concierge__item">
                  <span className="g-concierge__media">
                    {conciergeImages[i] ? (
                      <GalleryImage
                        src={conciergeImages[i]}
                        alt=""
                        fill
                        objectFit="cover"
                      />
                    ) : null}
                  </span>
                  <span className="g-label">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <span className="g-concierge__cta g-label">
                    {item.cta} <span aria-hidden>→</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <ArrowLink href="/contact">Speak with us</ArrowLink>
          )}
        </Reveal>
      </Container>

      {/* Collectors circle */}
      <YStack
        className="g-section g-circle"
        {...(Platform.OS !== 'web' ? { mt: '$16', mb: '$12' } : { mb: '$10' })}
      >
        <Container className="g-container" width="100%" maxWidth="100%" py="$12" $gtMd={{ py: '$16' }}>
          <Reveal>
            {Platform.OS === 'web' ? (
              <div className="g-circle__grid">
                <div>
                  <p className="g-label" style={{ color: 'var(--gallery-bronze)' }}>
                    Collectors circle · {next()}
                  </p>
                  <h2 className="g-circle__title">A quieter way to follow the gallery.</h2>
                  <p className="g-circle__lede">
                    Save works, receive private viewing invitations, and hear first about new
                    listings.
                  </p>
                  <div className="g-circle__actions">
                    <Link href="/register" className="g-circle__btn g-circle__btn--solid">
                      Join the circle
                    </Link>
                    <Link href="/login" className="g-circle__btn">
                      Sign in
                    </Link>
                  </div>
                </div>
                {circleImages.length > 0 ? (
                  <div className="g-circle__mosaic" aria-hidden>
                    {circleImages.map((src, i) => (
                      <span key={`${src}-${i}`} className="g-circle__tile">
                        <GalleryImage src={src} alt="" fill objectFit="cover" />
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <YStack gap="$5">
                <LabelCaps color="$accent">Collectors circle · {next()}</LabelCaps>
                <SerifHeading size="large">A quieter way to follow the gallery.</SerifHeading>
                <XStack gap="$6" flexWrap="wrap">
                  <ArrowLink href="/register">Join the circle</ArrowLink>
                  <ArrowLink href="/login">Sign in</ArrowLink>
                </XStack>
              </YStack>
            )}
          </Reveal>
        </Container>
      </YStack>
    </YStack>
  )
}
