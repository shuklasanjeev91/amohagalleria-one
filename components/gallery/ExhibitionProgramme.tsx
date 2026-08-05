import { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import type { Exhibition } from '~/lib/amoha'
import { partitionExhibitions } from '~/lib/amoha'
import { ExhibitionCard } from './ExhibitionCard'
import { Reveal } from './Reveal'
import { Container, LabelCaps, Muted, SerifHeading } from './primitives'

export type ProgrammeFilter = 'live' | 'upcoming' | 'past' | 'all'

const FILTERS: { id: ProgrammeFilter; label: string }[] = [
  { id: 'live', label: 'On view' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
]

export function ExhibitionProgramme({ shows }: { shows: Exhibition[] }) {
  const { live, upcoming, past } = useMemo(
    () => partitionExhibitions(shows),
    [shows],
  )

  const defaultFilter: ProgrammeFilter =
    live.length > 0 ? 'live' : upcoming.length > 0 ? 'upcoming' : 'past'

  const [filter, setFilter] = useState<ProgrammeFilter>(defaultFilter)

  const counts: Record<ProgrammeFilter, number> = {
    live: live.length,
    upcoming: upcoming.length,
    past: past.length,
    all: shows.length,
  }

  const visible =
    filter === 'live'
      ? live
      : filter === 'upcoming'
        ? upcoming
        : filter === 'past'
          ? past
          : shows

  const featured = filter === 'live' ? live[0] : filter === 'all' ? live[0] : null
  const list =
    featured && (filter === 'live' || filter === 'all')
      ? visible.filter((s) => s.slug !== featured.slug)
      : visible

  return (
    <YStack width="100%">
      <Container className="g-container" width="100%" maxWidth="100%">
        {Platform.OS === 'web' ? (
          <div className="g-ex-tabs" role="tablist" aria-label="Exhibition programme">
            {FILTERS.map((tab) => {
              const active = filter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`g-ex-tab ${active ? 'is-active' : ''}`}
                  onClick={() => setFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span className="g-ex-tab__count">{counts[tab.id]}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <XStack gap={12} flexWrap="wrap" marginBottom={32}>
            {FILTERS.map((tab) => {
              const active = filter === tab.id
              return (
                <YStack
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  paddingVertical={10}
                  paddingHorizontal={14}
                  borderWidth={1}
                  borderColor={active ? '$accent' : '$borderColor'}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <LabelCaps color={active ? '$accent' : '$color11'}>
                    {tab.label} · {counts[tab.id]}
                  </LabelCaps>
                </YStack>
              )
            })}
          </XStack>
        )}
      </Container>

      {filter === 'live' && live.length === 0 ? (
        <Container className="g-container" width="100%" maxWidth="100%" paddingVertical={48} $gtMd={{ paddingVertical: 72 }}>
          <Reveal>
            <YStack
              {...(Platform.OS === 'web' ? { className: 'g-ex-empty' } : null)}
              gap={20}
              maxWidth={560}
            >
              <LabelCaps color="$accent">Programme</LabelCaps>
              <SerifHeading size="large">No exhibition currently on view</SerifHeading>
              <Muted size="$4" lineHeight="$6">
                There is no live exhibition at Amoha Galleria right now. Browse the past
                programme archive, or visit the collection of works.
              </Muted>
              <XStack gap={24} flexWrap="wrap" marginTop={8}>
                {past.length > 0 ? (
                  <YStack onPress={() => setFilter('past')} cursor="pointer">
                    <Text
                      {...(Platform.OS === 'web'
                        ? { className: 'g-arrow g-label' }
                        : null)}
                      color="$color12"
                    >
                      View past exhibitions →
                    </Text>
                  </YStack>
                ) : null}
              </XStack>
            </YStack>
          </Reveal>
        </Container>
      ) : null}

      {filter === 'upcoming' && upcoming.length === 0 ? (
        <Container className="g-container" width="100%" maxWidth="100%" paddingVertical={48}>
          <Muted>No upcoming exhibitions are announced yet.</Muted>
        </Container>
      ) : null}

      {featured ? (
        <Container className="g-container" width="100%" maxWidth="100%" paddingTop={24} paddingBottom={16} $gtMd={{ paddingTop: 40 }}>
          <Reveal>
            <LabelCaps color="$accent" marginBottom={20}>
              Now on view
            </LabelCaps>
            <ExhibitionCard show={featured} index={0} featured />
          </Reveal>
        </Container>
      ) : null}

      {list.length > 0 ? (
        <Container className="g-container" width="100%" maxWidth="100%"
          paddingTop={featured ? 48 : 16}
          paddingBottom={80}
          $gtMd={{ paddingTop: featured ? 72 : 24, paddingBottom: 120 }}
        >
          {(filter === 'past' || (filter === 'all' && past.length > 0 && !featured)) && (
            <Reveal>
              <XStack
                alignItems="baseline"
                justifyContent="space-between"
                gap={16}
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                paddingBottom={18}
                marginBottom={36}
              >
                <SerifHeading size="medium">
                  {filter === 'past' ? 'Past exhibitions' : 'Programme'}
                </SerifHeading>
                <LabelCaps color="$color11">{list.length}</LabelCaps>
              </XStack>
            </Reveal>
          )}

          {Platform.OS === 'web' ? (
            <div className="g-ex-grid">
              {list.map((show, i) => (
                <Reveal key={show.slug} delay={Math.min(i, 6) * 70}>
                  <ExhibitionCard show={show} index={i + (featured ? 1 : 0)} />
                </Reveal>
              ))}
            </div>
          ) : (
            <YStack gap={48}>
              {list.map((show, i) => (
                <Reveal key={show.slug} delay={Math.min(i, 6) * 70}>
                  <ExhibitionCard show={show} index={i} />
                </Reveal>
              ))}
            </YStack>
          )}
        </Container>
      ) : null}
    </YStack>
  )
}
