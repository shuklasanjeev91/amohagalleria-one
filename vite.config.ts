import { tamaguiPlugin } from '@tamagui/vite-plugin'
import { one } from 'one/vite'
import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    one({
      web: {
        defaultRenderMode: 'ssg',
        deploy: 'vercel',
        sitemap: {
          baseUrl: process.env.VITE_SITE_URL || process.env.ONE_SERVER_URL || 'https://www.amohagalleria.com',
          priority: 0.8,
          changefreq: 'weekly',
          exclude: ['/studio/*', '/login', '/register', '/_sitemap'],
        },
      },
      build: {
        server: { unified: true },
      },
      ...(process.env.TEST_METRO && {
        native: {
          bundler: 'metro',
        },
      }),
    }),
    tamaguiPlugin({
      config: './tamagui.config.ts',
      components: ['tamagui'],
      // Fully disable static extraction — Tamagui's bundler still crashes on
      // TypeScript 7 (no `typescript.sys.fileExists`). Runtime styles are fine.
      disable: true,
      disableExtraction: true,
      disableDebugAttr: true,
      disableDidYouKnow: true,
      disableWatchTamaguiConfig: true,
    }),
  ],

  optimizeDeps: {
    include: [
      '@tamagui/core',
      '@tamagui/config',
      '@tamagui/config/v5',
      'tamagui',
    ],
  },

  build: {
    cssTarget: 'safari15',
  },
} satisfies UserConfig)
