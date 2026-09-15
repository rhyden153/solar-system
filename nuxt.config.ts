import process from 'node:process'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
    ssr: false,
    nitro: { preset: 'static' },
    hooks: {
      'build:manifest'(manifest) {
        for (const chunk of Object.values(manifest)) chunk.prefetch = false
      }
    },
    app: {
      head: {
        title: 'Orbital Lab',
        meta: [{ name: 'description', content: 'An interactive orbital mechanics laboratory with N-body simulations and spacecraft mission replays.' }]
      }
    }
  })
=======
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
      meta: [{ name: 'description', content: 'An interactive orbital mechanics laboratory with N-body simulations and spacecraft mission replays.' }]
  })
})
>>>>>>> 2858807 (Updated for vercel deployment)
