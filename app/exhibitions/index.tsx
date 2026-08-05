import { useLoader } from 'one'
import { PageHeader } from '~/components/gallery/PageHeader'
import { ExhibitionProgramme } from '~/components/gallery/ExhibitionProgramme'
import { SeoHead } from '~/components/gallery/SeoHead'
import { YStack } from 'tamagui'
import { partitionExhibitions } from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'

export async function loader() {
  const catalogue = await getMergedCatalogue()
  const programme = partitionExhibitions(catalogue.exhibitions)
  return {
    shows: catalogue.exhibitions,
    programme,
  }
}

export default function ExhibitionsPage() {
  const { shows, programme } = useLoader(loader)

  const lede =
    programme.live.length > 0
      ? `${programme.live.length} exhibition${programme.live.length === 1 ? '' : 's'} currently on view${
          programme.past.length
            ? `, with ${programme.past.length} in the archive.`
            : '.'
        }`
      : programme.upcoming.length > 0
        ? `${programme.upcoming.length} upcoming exhibition${programme.upcoming.length === 1 ? '' : 's'} announced. Browse past presentations in the archive.`
        : programme.past.length > 0
          ? `No live exhibition at the moment. ${programme.past.length} past presentation${programme.past.length === 1 ? '' : 's'} in the archive.`
          : 'No exhibition is currently announced by the gallery.'

  return (
    <YStack width="100%">
      <SeoHead
        title="Exhibitions"
        description="Current, upcoming and archived exhibitions at Amoha Galleria."
        path="/exhibitions"
      />
      <PageHeader eyebrow="Programme" title="Exhibitions" lede={lede} />
      <ExhibitionProgramme shows={shows} />
    </YStack>
  )
}
