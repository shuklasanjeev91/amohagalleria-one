import { getCatalogue, type Catalogue } from './amoha'
import { runtimeBag } from './runtimeCache'
import { fetchPublishedCatalogue, mergeCatalogue } from './studio'

const MERGE_TTL_MS = 60_000

type MergeRuntime = {
  cache: { at: number; value: Catalogue } | null
  inflight: Promise<Catalogue> | null
}

function mergeRuntime(): MergeRuntime {
  const bag = runtimeBag()
  if (!bag.merge) {
    bag.merge = { cache: null, inflight: null } satisfies MergeRuntime
  }
  return bag.merge as MergeRuntime
}

/** amoha.com catalogue merged with published Supabase studio works/artists. */
export async function getMergedCatalogue(): Promise<Catalogue> {
  const rt = mergeRuntime()
  if (rt.cache && Date.now() - rt.cache.at < MERGE_TTL_MS) {
    return rt.cache.value
  }
  if (rt.inflight) return rt.inflight

  rt.inflight = (async () => {
    const remote = await getCatalogue()
    try {
      const studio = await fetchPublishedCatalogue()
      const value =
        !studio.artworks.length && !studio.artists.length
          ? remote
          : mergeCatalogue(remote, studio)
      rt.cache = { at: Date.now(), value }
      return value
    } catch {
      rt.cache = { at: Date.now(), value: remote }
      return remote
    } finally {
      rt.inflight = null
    }
  })()

  return rt.inflight
}

export function invalidateMergedCatalogue() {
  const rt = mergeRuntime()
  rt.cache = null
  rt.inflight = null
}

/** Warm the shared cache early so the first tab click does not wait on amoha. */
export function warmCatalogueCache() {
  void getMergedCatalogue()
}
