/**
 * Live data layer for amohagalleria.com.
 *
 * Everything rendered on this site comes from the gallery's own site and is
 * cached for an hour. Nothing is hardcoded: if a field is missing upstream it
 * is returned as null and the UI omits it rather than substituting a default.
 *
 *   1. GET /api/art/showcategorywithart — the public catalogue endpoint that
 *      backs their site. Returns every artwork grouped by category, with the
 *      uploading artist's name, bio, location and profile image.
 *   2. GET / — the homepage, parsed for gallery identity (address, email,
 *      phone) and for their one real exhibition, which has no API of its own.
 */

import { runtimeBag } from './runtimeCache'

const SOURCE = 'https://www.amohagalleria.com'
const REVALIDATE = 3600
/** Bump to invalidate the in-memory catalogue cache after media-rule changes. */
const CACHE_VERSION = 5

type AmohaCacheEntry = {
  at: number
  version: number
  catalogue: Catalogue
  info: GalleryInfo
}

type AmohaRuntime = {
  cached: AmohaCacheEntry | null
  inflight: Promise<{ catalogue: Catalogue; info: GalleryInfo }> | null
}

function amohaRuntime(): AmohaRuntime {
  const bag = runtimeBag()
  if (!bag.amoha) {
    bag.amoha = { cached: null, inflight: null } satisfies AmohaRuntime
  }
  return bag.amoha as AmohaRuntime
}

export const source = {
  url: SOURCE,
  catalogueEndpoint: `${SOURCE}/api/art/showcategorywithart`,
}

/* ------------------------------------------------------------------ types */

export type Artist = {
  slug: string
  id: string
  name: string
  attributed: boolean
  portrait: string | null
  location: string | null
  bio: string[]
  short: string
  disciplines: string[]
  discipline: string
  workCount: number
}

export type Artwork = {
  slug: string
  id: string
  title: string
  artistSlug: string
  artistName: string
  category: string
  image: string
  year: string
  opens: string
  closes: string
  dateLabel: string
  location: string | null
  about: string[]
  summary: string
}

/**
 * Their single real exhibition, parsed from the homepage. Every field here is
 * their own copy; only `workSlugs` is derived, by matching works whose listed
 * run overlaps the exhibition dates.
 */
export type Exhibition = {
  slug: string
  title: string
  tagline: string | null
  status: 'Current' | 'Upcoming' | 'Past'
  opens: string
  closes: string
  dateLabel: string
  preview: string | null
  timing: string | null
  venue: string[]
  image: string | null
  images: string[]
  artistSlugs: string[]
  workSlugs: string[]
}

export type GalleryInfo = {
  name: string
  shortName: string
  fullName: string | null
  tagline: string | null
  address: string[]
  email: string | null
  phone: string | null
  website: string | null
  logo: string | null
  vision: string | null
  project: string | null
  projectSubtitle: string | null
  daanLogo: string | null
  impact: string[]
  exhibitionImages: string[]
  spaceImages: string[]
  amohaImages: string[]
  mediaImages: string[]
}

export type Catalogue = {
  artworks: Artwork[]
  artists: Artist[]
  exhibitions: Exhibition[]
  categories: string[]
  countries: string[]
  fetchedAt: string
  ok: boolean
}

/* -------------------------------------------------------------- utilities */

const COLLECTION_SLUG = 'amoha-galleria-collection'
const COLLECTION_NAME = 'Amoha Galleria Collection'

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  )
}

/** Named HTML entities that show up in their artist bios and artwork copy. */
const ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  bull: '\u2022',
  middot: '\u00b7',
  deg: '\u00b0',
  eacute: '\u00e9',
  egrave: '\u00e8',
  uuml: '\u00fc',
  ouml: '\u00f6',
  auml: '\u00e4',
  szlig: '\u00df',
  ccedil: '\u00e7',
  times: '\u00d7',
  frac12: '\u00bd',
  reg: '\u00ae',
  copy: '\u00a9',
  trade: '\u2122',
}

function decode(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&(?:amp;)?([a-z][a-z0-9]{1,8});/gi, (match, name) => {
      const key = String(name).toLowerCase()
      return ENTITIES[key] ?? match
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

/** Their rich-text fields arrive as HTML. Turn them into clean paragraphs. */
function toParagraphs(html: string | null | undefined): string[] {
  if (!html) return []
  return decode(html)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1)
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max).replace(/[\s,;:.–-]+\S*$/, '')}\u2026`
}

/** Their image URLs are sometimes served over plain http; upgrade them. */
function secureImage(url: string | null | undefined) {
  if (!url) return null
  return url.replace(/^http:\/\//i, 'https://')
}

/** Resolve site-relative paths against amohagalleria.com. */
function absUrl(url: string | null | undefined) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return secureImage(url)
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${SOURCE}${url}`
  return `${SOURCE}/${url}`
}

/**
 * Older catalogue rows still point at a restricted Cloudinary cloud that
 * returns 401/403 to every public request. Prefer Vercel Blob / Amoha /
 * Supabase hosts that the live site actually serves.
 */
function isPublicMediaUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host === 'res.cloudinary.com' || host.endsWith('.cloudinary.com')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/** Absolute, publicly loadable media URL — or null if missing / blocked. */
function resolveMedia(url: string | null | undefined) {
  const absolute = absUrl(url)
  if (!absolute) return null
  if (!isPublicMediaUrl(absolute)) return null
  return absolute
}

function uniqueUrls(urls: (string | null | undefined)[]) {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of urls) {
    const url = absUrl(raw)
    if (!url || seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

function isRealDate(value: string | null | undefined) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function rangeLabel(opens: string, closes: string) {
  if (!isRealDate(opens)) return ''
  if (!isRealDate(closes) || closes === opens) return formatDate(opens)
  return `${formatDate(opens)} \u2013 ${formatDate(closes)}`
}

/* ------------------------------------------------------------- raw fetches */

type RawArt = {
  artId: string
  userid: string
  title: string | null
  imageurl: string | null
  address: string | null
  location: string | null
  startdate: string | null
  enddate: string | null
  aboutart: string | null
  biodata: string | null
  username: string | null
  profileimage: string | null
  isactive: boolean | null
  show: boolean | null
}

const AGENT = 'Mozilla/5.0 (compatible; AmohaGalleryWeb/1.0)'

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': AGENT },
    })
    if (!res.ok) {
      console.error('amoha: catalogue request failed', url, res.status)
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.error('amoha: catalogue unreachable', url, (error as Error).message)
    return null
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': AGENT },
    })
    if (!res.ok) return null
    return await res.text()
  } catch (error) {
    console.error('amoha: homepage unreachable', (error as Error).message)
    return null
  }
}

/* ------------------------------------------------- homepage: identity + show */

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

/** Turn their "28th June" + a year into an ISO date. */
function parseDayMonth(text: string, year: number): string | null {
  const m = text.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s+([a-z]+)/i)
  if (!m) return null
  const month = MONTHS.findIndex((name) => name.startsWith(m[2].toLowerCase()))
  if (month < 0) return null
  const day = Number(m[1])
  if (day < 1 || day > 31) return null
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Their exhibition run lives inside the timing line, e.g.
 * "11:00AM - 8:30PM (28th June - 2nd July)", with the year on the preview line.
 */
function parseRun(timing: string | null, preview: string | null) {
  const year = Number(
    preview?.match(/\b(20\d{2})\b/)?.[1] ??
      timing?.match(/\b(20\d{2})\b/)?.[1] ??
      '',
  )
  if (!year) return { opens: '', closes: '' }

  const inside = timing?.match(/\(([^)]+)\)/)?.[1] ?? ''
  const [from, to] = inside.split(/\s*(?:-|–|—|to)\s*/i)

  const opens =
    parseDayMonth(from ?? '', year) ??
    parseDayMonth(preview ?? '', year) ??
    ''
  let closes = parseDayMonth(to ?? '', year) ?? opens

  // A run that wraps the new year, e.g. 28th December – 3rd January.
  if (opens && closes && closes < opens) {
    closes = parseDayMonth(to ?? '', year + 1) ?? closes
  }
  return { opens, closes }
}

type Homepage = {
  info: GalleryInfo
  show: {
    title: string
    tagline: string | null
    preview: string | null
    timing: string | null
    opens: string
    closes: string
    images: string[]
  } | null
}

function grabAll(html: string | null, re: RegExp) {
  if (!html) return [] as string[]
  const out: string[] = []
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
  const pattern = new RegExp(re.source, flags)
  for (const match of html.matchAll(pattern)) {
    const value = match[1] ? decode(match[1]) : ''
    if (value) out.push(value)
  }
  return out
}

function parseHomepage(html: string | null): Homepage {
  const grab = (re: RegExp) => {
    const m = html?.match(re)
    const value = m?.[1] ? decode(m[1]) : ''
    return value.length > 0 ? value : null
  }

  /* Physical street address is intentionally not published on this site. */
  const address: string[] = []

  const tagline = grab(/text-lg italic text-gray-700[^>]*>([^<]+)</)

  const exhibitionImages = uniqueUrls(
    grabAll(html, /alt="Exhibition image \d+"[^>]*src="([^"]+)"/),
  )
  const spaceImages = uniqueUrls(
    grabAll(html, /(\/images\/GalleryPic\/[^"'\\\s]+)/),
  )
  const mediaImages = uniqueUrls(
    grabAll(html, /(\/images\/mediapic\/[^"'\\\s]+)/),
  )
  const amohaImages = uniqueUrls(
    grabAll(
      html,
      /(https:\/\/c3rdoriiplwdtqdi\.public\.blob\.vercel-storage\.com\/arts\/[^"'\\&\s]+)/,
    ),
  )
  const logo =
    absUrl(
      grab(
        /(https:\/\/uckttlzwlqkvoahi\.public\.blob\.vercel-storage\.com\/logo\/[^"'\\&\s]+)/,
      ),
    ) ?? null
  const daanLogo = absUrl(grab(/(\/images\/[Dd]aan[^"'\\\s]*)/))
  const project =
    grab(
      /(Project DAAN, a philanthropic initiative[\s\S]{40,900}?)(?:<\/|\.\s*(?:Explore|Project))/,
    ) ?? grab(/(Project DAAN, a philanthropic initiative[\s\S]{40,900}?)</)
  const impact = grabAll(html, /uppercase">\s*([^<]+?)\s*<\/h4>/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const info: GalleryInfo = {
    name: 'Amoha Galleria',
    shortName: 'Amoha',
    fullName: grab(/\(([^)]*Museum of Heritage[^)]*)\)/),
    tagline,
    address,
    email: grab(/E:\s*([\w.+-]+@[\w.-]+)/),
    phone: grab(/M:\s*([\d\s+-]{8,20})/),
    website: grab(/W:\s*([\w.-]+)/),
    logo,
    vision: grab(/Vision:<\/strong>\s*([^<]+)/),
    project,
    projectSubtitle: grab(/(DAAN:\s*Donate An Artwork for Need)/i),
    daanLogo,
    impact,
    exhibitionImages,
    spaceImages,
    amohaImages,
    mediaImages,
  }

  const title = grab(/Exhibition Title:\s*([^<]+)</)?.replace(
    /^Exhibition Title:\s*/,
    '',
  )

  if (!title) return { info, show: null }

  const preview = grab(/Exhibition preview time and date:<\/p><p>([^<]+)</)
  const timing = grab(/Daily Exhibition timing:<\/p><p>([^<]+)</)
  const { opens, closes } = parseRun(timing, preview)

  return {
    info,
    show: {
      title,
      tagline,
      preview,
      timing,
      opens,
      closes,
      images: exhibitionImages,
    },
  }
}

/* ------------------------------------------------------------- normalizing */

function buildCatalogue(
  groups: { _id: string[]; arts: RawArt[] }[],
  home: Homepage,
  now: Date,
): Catalogue {
  const raw = groups.flatMap((group) =>
    (group.arts ?? []).map((art) => ({
      art,
      category: group._id?.[0]?.trim() || 'Uncategorised',
    })),
  )

  /* ---- artists, keyed by the uploading account -------------------- */
  const artistBuckets = new Map<
    string,
    { ids: Set<string>; name: string; rows: RawArt[]; categories: Set<string> }
  >()

  for (const { art, category } of raw) {
    const name = art.username?.trim()
    const key = name ? slugify(name) : COLLECTION_SLUG
    if (!artistBuckets.has(key)) {
      artistBuckets.set(key, {
        ids: new Set(),
        name: name || COLLECTION_NAME,
        rows: [],
        categories: new Set(),
      })
    }
    const bucket = artistBuckets.get(key)!
    bucket.ids.add(art.userid)
    bucket.rows.push(art)
    bucket.categories.add(category)
  }

  const artists: Artist[] = [...artistBuckets.entries()]
    .map(([slug, bucket]) => {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
      const nameKey = norm(bucket.name)
      /** Some accounts fill "biodata" with nothing but their own name / labels. */
      const usefulBio = (html: string | null | undefined) =>
        toParagraphs(html).filter((p) => {
          const n = norm(p)
          if (p.length < 3 || n === nameKey) return false
          if (['na', 'none', 'nil', 'test', 'artist'].includes(n)) return false
          if (
            /^(biography|biografia|bio|about|about\s*the\s*artist|curriculum\s*vitae|c\.?v\.?|profile|statement)$/i.test(
              p.trim(),
            )
          ) {
            return false
          }
          return true
        })

      const withBio = bucket.rows.find((r) => usefulBio(r.biodata).length > 0)
      const bio = usefulBio(withBio?.biodata)
      const portrait = resolveMedia(
        bucket.rows.find((r) => r.profileimage)?.profileimage,
      )
      const location =
        bucket.rows.find((r) => r.location?.trim())?.location?.trim() ??
        bucket.rows.find((r) => r.address?.trim())?.address?.trim() ??
        null
      const disciplines = [...bucket.categories].sort()
      const attributed = slug !== COLLECTION_SLUG
      /** Prefer a substantive paragraph over a short location line. */
      const shortSource =
        bio.find((p) => p.length >= 48) ?? bio.find((p) => p.length >= 20) ?? bio[0]

      return {
        slug,
        id: [...bucket.ids][0],
        name: bucket.name,
        attributed,
        portrait,
        location,
        bio,
        short: shortSource
          ? truncate(shortSource, 220)
          : attributed
            ? `${bucket.rows.length} ${bucket.rows.length === 1 ? 'work' : 'works'} in the Amoha Galleria catalogue.`
            : 'Works held and presented directly by Amoha Galleria.',
        disciplines,
        discipline: disciplines[0] ?? 'Art',
        workCount: bucket.rows.length,
      }
    })
    .sort((a, b) => {
      if (a.attributed !== b.attributed) return a.attributed ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  const artistBySlug = new Map(artists.map((a) => [a.slug, a]))

  /* ---- artworks --------------------------------------------------- */
  const usedSlugs = new Set<string>()
  const artworks: Artwork[] = raw
    .filter(({ art }) => art.imageurl && art.show !== false)
    .map(({ art, category }) => {
      const title = decode(art.title ?? '') || 'Untitled'
      const artistSlug = art.username?.trim()
        ? slugify(art.username.trim())
        : COLLECTION_SLUG

      let slug = slugify(title)
      if (usedSlugs.has(slug)) slug = `${slug}-${art.artId.slice(-6)}`
      usedSlugs.add(slug)

      const about = toParagraphs(art.aboutart)
      const opens = isRealDate(art.startdate) ? art.startdate! : ''
      const closes = isRealDate(art.enddate) ? art.enddate! : ''
      const image = resolveMedia(art.imageurl)

      if (!image) return null

      return {
        slug,
        id: art.artId,
        title,
        artistSlug,
        artistName: artistBySlug.get(artistSlug)?.name ?? COLLECTION_NAME,
        category,
        image,
        year: opens ? opens.slice(0, 4) : '',
        opens,
        closes,
        dateLabel: rangeLabel(opens, closes),
        location: art.location?.trim() || art.address?.trim() || null,
        about,
        summary: about[0] ? truncate(about[0], 220) : '',
      }
    })
    .filter((work): work is Artwork => work !== null)
    .sort((a, b) => (b.opens || '').localeCompare(a.opens || ''))

  /* Sync artist portraits / counts to reachable media only. */
  const worksBySlug = new Map<string, Artwork[]>()
  for (const work of artworks) {
    const list = worksBySlug.get(work.artistSlug) ?? []
    list.push(work)
    worksBySlug.set(work.artistSlug, list)
  }
  for (const artist of artists) {
    const works = worksBySlug.get(artist.slug) ?? []
    artist.workCount = works.length
    if (!artist.portrait) {
      artist.portrait = works[0]?.image ?? null
    }
    if (artist.attributed && artist.workCount > 0 && !artist.bio[0]) {
      artist.short = `${artist.workCount} ${
        artist.workCount === 1 ? 'work' : 'works'
      } in the Amoha Galleria catalogue.`
    }
  }

  /* ---- their one real exhibition ---------------------------------- */
  const today = now.toISOString().slice(0, 10)
  const exhibitions: Exhibition[] = []

  if (home.show) {
    const { title, tagline, preview, timing, opens, closes, images } = home.show

    // Works whose own listed run overlaps the exhibition dates.
    const inShow = artworks.filter((work) => {
      if (!opens || !work.opens) return false
      const workCloses = work.closes || work.opens
      return work.opens <= closes && workCloses >= opens
    })

    const status = exhibitionStatus(opens, closes, today)

    exhibitions.push({
      slug: slugify(title),
      title,
      tagline,
      status,
      opens,
      closes,
      dateLabel: rangeLabel(opens, closes),
      preview,
      timing,
      venue: [],
      images,
      image: images[0] ?? inShow[0]?.image ?? artworks[0]?.image ?? null,
      artistSlugs: [...new Set(inShow.map((w) => w.artistSlug))],
      workSlugs: inShow.map((w) => w.slug),
    })
  }

  // Live catalogue window: when works are dated as currently on view and no
  // curated Current show exists, surface them as the live programme entry.
  const liveWorks = artworks.filter((work) =>
    isDateLive(work.opens, work.closes || work.opens, today),
  )
  if (liveWorks.length > 0 && !exhibitions.some((e) => e.status === 'Current')) {
    const opens = liveWorks
      .map((w) => w.opens)
      .filter(Boolean)
      .sort()[0]
    const closes = liveWorks
      .map((w) => w.closes || w.opens)
      .filter(Boolean)
      .sort()
      .at(-1)!
    exhibitions.unshift({
      slug: 'on-view-now',
      title: 'On view now',
      tagline:
        'Selected works from the Amoha Galleria catalogue currently listed for viewing.',
      status: 'Current',
      opens,
      closes,
      dateLabel: rangeLabel(opens, closes),
      preview: null,
      timing: null,
      venue: [],
      images: [],
      image: liveWorks[0]?.image ?? null,
      artistSlugs: [...new Set(liveWorks.map((w) => w.artistSlug))],
      workSlugs: liveWorks.map((w) => w.slug),
    })
  }

  exhibitions.sort(compareExhibitions)

  return {
    artworks,
    artists,
    exhibitions,
    categories: [...new Set(raw.map((r) => r.category))].sort(),
    countries: [
      ...new Set(
        artworks
          .map((w) => w.location)
          .filter((c): c is string => !!c && c.length > 1),
      ),
    ].sort(),
    fetchedAt: now.toISOString(),
    ok: artworks.length > 0,
  }
}

/* --------------------------------------------------------------- exported */

const EMPTY_INFO: GalleryInfo = {
  name: 'Amoha Galleria',
  shortName: 'Amoha',
  fullName: null,
  tagline: null,
  address: [],
  email: null,
  phone: null,
  website: null,
  logo: null,
  vision: null,
  project: null,
  projectSubtitle: null,
  daanLogo: null,
  impact: [],
  exhibitionImages: [],
  spaceImages: [],
  amohaImages: [],
  mediaImages: [],
}

const EMPTY: Catalogue = {
  artworks: [],
  artists: [],
  exhibitions: [],
  categories: [],
  countries: [],
  fetchedAt: new Date(0).toISOString(),
  ok: false,
}

/**
 * Their catalogue payload is larger than Next's data cache allows, so the
 * normalized result is memoised for REVALIDATE seconds and shared via
 * globalThis so One's per-route loader chunks reuse the same warm cache.
 * In-flight requests are deduped so a cold start only fetches once.
 */
async function load() {
  const [payload, html] = await Promise.all([
    fetchJson<{ data?: { _id: string[]; arts: RawArt[] }[] }>(
      source.catalogueEndpoint,
    ),
    fetchText(`${SOURCE}/`),
  ])

  const home = parseHomepage(html)
  const catalogue = payload?.data?.length
    ? buildCatalogue(payload.data, home, new Date())
    : EMPTY

  return { catalogue, info: home.info }
}

async function getAll() {
  const rt = amohaRuntime()
  if (
    rt.cached &&
    rt.cached.version === CACHE_VERSION &&
    Date.now() - rt.cached.at < REVALIDATE * 1000
  ) {
    return rt.cached
  }

  if (!rt.inflight) {
    rt.inflight = load()
      .then((next) => {
        // Keep the last good copy if the upstream site is briefly down.
        if (next.catalogue.ok || !rt.cached) {
          rt.cached = { at: Date.now(), version: CACHE_VERSION, ...next }
        }
        return { catalogue: rt.cached!.catalogue, info: rt.cached!.info }
      })
      .finally(() => {
        rt.inflight = null
      })
  }

  return rt.inflight
}

export async function getCatalogue(): Promise<Catalogue> {
  return (await getAll()).catalogue
}

export async function getGalleryInfo(): Promise<GalleryInfo> {
  return (await getAll()).info ?? EMPTY_INFO
}

/* ------------------------------------------------------- lookup helpers */

export function findArtist(catalogue: Catalogue, slug: string) {
  return catalogue.artists.find((a) => a.slug === slug)
}

export function findArtwork(catalogue: Catalogue, slug: string) {
  return catalogue.artworks.find((w) => w.slug === slug)
}

export function findExhibition(catalogue: Catalogue, slug: string) {
  return catalogue.exhibitions.find((e) => e.slug === slug)
}

export function worksByArtist(catalogue: Catalogue, slug: string) {
  return catalogue.artworks.filter((w) => w.artistSlug === slug)
}

export function worksInExhibition(catalogue: Catalogue, show: Exhibition) {
  const set = new Set(show.workSlugs)
  return catalogue.artworks.filter((w) => set.has(w.slug))
}

export function exhibitionsByArtist(catalogue: Catalogue, slug: string) {
  return catalogue.exhibitions.filter((e) => e.artistSlugs.includes(slug))
}

export function exhibitionForWork(catalogue: Catalogue, slug: string) {
  return catalogue.exhibitions.find((e) => e.workSlugs.includes(slug))
}

/** ISO date today in UTC (YYYY-MM-DD). */
export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function isDateLive(opens: string, closes: string, today = todayISO()) {
  if (!opens) return false
  const end = closes || opens
  return opens <= today && end >= today
}

export function exhibitionStatus(
  opens: string,
  closes: string,
  today = todayISO(),
): Exhibition['status'] {
  if (opens && opens > today) return 'Upcoming'
  if (isDateLive(opens, closes, today)) return 'Current'
  return 'Past'
}

export function exhibitionStatusLabel(status: Exhibition['status']) {
  if (status === 'Current') return 'On view'
  if (status === 'Upcoming') return 'Upcoming'
  return 'Past'
}

export function exhibitionStatusTone(status: Exhibition['status']) {
  if (status === 'Current') return 'live'
  if (status === 'Upcoming') return 'upcoming'
  return 'past'
}

function compareExhibitions(a: Exhibition, b: Exhibition) {
  const rank: Record<Exhibition['status'], number> = {
    Current: 0,
    Upcoming: 1,
    Past: 2,
  }
  const byStatus = rank[a.status] - rank[b.status]
  if (byStatus !== 0) return byStatus
  if (a.status === 'Past') {
    return (b.closes || b.opens || '').localeCompare(a.closes || a.opens || '')
  }
  return (a.opens || '').localeCompare(b.opens || '')
}

/** Split the programme into live, upcoming and past buckets. */
export function partitionExhibitions(exhibitions: Exhibition[]) {
  const live: Exhibition[] = []
  const upcoming: Exhibition[] = []
  const past: Exhibition[] = []

  for (const show of [...exhibitions].sort(compareExhibitions)) {
    if (show.status === 'Current') live.push(show)
    else if (show.status === 'Upcoming') upcoming.push(show)
    else past.push(show)
  }

  return { live, upcoming, past }
}

/** The show to lead with: on view, else upcoming, else the latest past. */
export function leadExhibition(catalogue: Catalogue) {
  const { live, upcoming, past } = partitionExhibitions(catalogue.exhibitions)
  return live[0] ?? upcoming[0] ?? past[0]
}
