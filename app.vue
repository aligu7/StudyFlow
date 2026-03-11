<template>
  <div>
    <NuxtPage v-if="route.path === '/login'" />
    <UApp v-else-if="!loading">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
    <div v-else class="min-h-screen bg-gray-950 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { initAuth, isAuthenticated, loading } = useAuth()
const route = useRoute()

onMounted(async () => {
  await initAuth()
})

watch(() => route.path, async (newPath) => {
  if (newPath !== '/login' && !loading.value && !isAuthenticated.value) {
    navigateTo('/login')
  }
})
</script>
