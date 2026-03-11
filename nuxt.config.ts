import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  ui: {
    global: true,
    icons: ['heroicons', 'lucide'],
  },

  app: {
    head: {
      title: 'StudyFlow - Productivity App',
      meta: [
        { name: 'description', content: 'Your personal study productivity companion' }
      ],
    },
  },

  compatibilityDate: '2024-11-01',
})
