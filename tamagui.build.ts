import type { TamaguiBuildOptions } from '@tamagui/vite-plugin'

export default {
  config: './tamagui.config.ts',
  components: ['tamagui'],
  // Runtime styles work without extraction. Extraction is disabled until
  // Tamagui supports TypeScript 7 (missing `typescript.sys` breaks bundling).
  disable: true,
  disableExtraction: true,
  disableDebugAttr: true,
  disableDidYouKnow: true,
  disableWatchTamaguiConfig: true,
} satisfies TamaguiBuildOptions
