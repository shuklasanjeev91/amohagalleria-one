import { Link } from 'one'
import { Linking, Platform } from 'react-native'
import type { GalleryInfo } from '~/lib/amoha'
import { SOCIAL_LINKS } from '~/lib/seo'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { Container, LabelCaps, Muted } from './primitives'

const links = [
  { href: '/exhibitions', label: 'Exhibitions' },
  { href: '/artists', label: 'Artists' },
  { href: '/works', label: 'Works' },
  { href: '/contact', label: 'Contact' },
]

export function SiteFooter({ info }: { info: GalleryInfo }) {
  const intro = [info.fullName, info.tagline].filter(Boolean).join('. ')

  return (
    <YStack
      width="100%"
      {...(Platform.OS === 'web'
        ? { className: 'g-site-footer' }
        : {
            marginTop: 96,
            borderTopWidth: 1,
            borderTopColor: '$borderColor',
            backgroundColor: '$background',
          })}
    >
      <Container
        className="g-container"
        paddingVertical={64}
        $gtMd={{ paddingVertical: 96 }}
        width="100%"
        maxWidth="100%"
      >
        <YStack
          gap={48}
          width="100%"
          $gtMd={{ gap: 64 }}
          $gtLg={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 80,
          }}
        >
          <YStack flex={1} maxWidth="100%" $gtLg={{ maxWidth: 480 }} gap={20}>
            {info.logo ? (
              <YStack height={52} width={200} position="relative">
                <GalleryImage
                  src={info.logo}
                  alt={info.name}
                  fill
                  objectFit="contain"
                />
              </YStack>
            ) : (
              <Text
                fontFamily="$heading"
                fontSize={34}
                lineHeight={38}
                letterSpacing={-0.5}
                $gtMd={{ fontSize: 40, lineHeight: 44 }}
              >
                {info.name}
              </Text>
            )}
            {intro ? (
              <Muted fontSize={15} lineHeight={24} maxWidth="100%" $gtLg={{ maxWidth: 420 }}>
                {intro}
              </Muted>
            ) : null}
          </YStack>

          <YStack
            gap={40}
            width="100%"
            $gtSm={{ flexDirection: 'row', gap: 64, width: 'auto' }}
            $gtLg={{ gap: 80 }}
          >
            <YStack gap={10}>
              <LabelCaps color="$accent" marginBottom={6}>
                Gallery
              </LabelCaps>
              {links.map((l) => (
                <Link key={l.href} href={l.href as any}>
                  <Text
                    fontSize={14}
                    lineHeight={26}
                    hoverStyle={{ color: '$accent' }}
                    pressStyle={{ opacity: 0.7 }}
                    cursor="pointer"
                  >
                    {l.label}
                  </Text>
                </Link>
              ))}
            </YStack>

            <YStack gap={10}>
              <LabelCaps color="$accent" marginBottom={6}>
                Contact
              </LabelCaps>
              {info.email ? (
                <Text
                  fontSize={14}
                  lineHeight={26}
                  cursor="pointer"
                  hoverStyle={{ color: '$accent' }}
                  onPress={() => Linking.openURL(`mailto:${info.email}`)}
                >
                  {info.email}
                </Text>
              ) : null}
              {info.phone ? (
                <Text
                  fontSize={14}
                  lineHeight={26}
                  cursor="pointer"
                  hoverStyle={{ color: '$accent' }}
                  onPress={() =>
                    Linking.openURL(`tel:${info.phone!.replace(/\s/g, '')}`)
                  }
                >
                  {info.phone}
                </Text>
              ) : null}
              {info.website ? (
                <Text
                  fontSize={14}
                  lineHeight={26}
                  color="$color11"
                  marginTop={8}
                  cursor="pointer"
                  hoverStyle={{ color: '$accent' }}
                  onPress={() =>
                    Linking.openURL(
                      `https://${info.website!.replace(/^https?:\/\//, '')}`,
                    )
                  }
                >
                  {info.website}
                </Text>
              ) : null}
            </YStack>

            <YStack gap={10}>
              <LabelCaps color="$accent" marginBottom={6}>
                Follow
              </LabelCaps>
              {SOCIAL_LINKS.map((s) =>
                Platform.OS === 'web' ? (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="g-footer-social"
                  >
                    {s.label}
                  </a>
                ) : (
                  <Text
                    key={s.id}
                    fontSize={14}
                    lineHeight={26}
                    cursor="pointer"
                    hoverStyle={{ color: '$accent' }}
                    onPress={() => Linking.openURL(s.href)}
                  >
                    {s.label}
                  </Text>
                ),
              )}
            </YStack>
          </YStack>
        </YStack>

        <XStack
          marginTop={72}
          paddingTop={28}
          borderTopWidth={1}
          borderTopColor="$borderColor"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={12}
        >
          <LabelCaps>
            © {new Date().getFullYear()} {info.name}
          </LabelCaps>
          {Platform.OS === 'web' ? (
            <LabelCaps>Adishakti Museum of Heritage & Arts</LabelCaps>
          ) : null}
        </XStack>
      </Container>
    </YStack>
  )
}
