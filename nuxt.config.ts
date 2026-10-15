import process from 'node:process'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@vercel/analytics'],
  extends: ['github:rhyden153/neogames-ui'],
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  // Each browser owns its simulation, including randomized initial conditions.
  ssr: false,
  nitro: { preset: 'static' },
  hooks: {
    'build:manifest'(manifest) {
      // Mission chunks should download on selection, not through speculative hints.
      for (const chunk of Object.values(manifest)) chunk.prefetch = false
    }
  },
  app: {
    head: {
      title: 'Orbital Lab',
      meta: [
        { name: 'description', content: 'An interactive orbital mechanics laboratory with N-body simulations and spacecraft mission replays.' },
        { name: 'theme-color', content: '#080c10' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  }
})
