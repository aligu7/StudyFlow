<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="text-center">
      <div class="mb-8">
        <h1 class="text-5xl font-bold text-white mb-2">StudyFlow</h1>
        <p class="text-gray-400 text-lg">Focus. Track. Improve.</p>
      </div>

      <button
        @click="handleSignIn"
        :disabled="loading"
        class="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5" />
        {{ loading ? 'Signing in...' : 'Continue with Google' }}
      </button>

      <p v-if="error" class="mt-4 text-red-400 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const router = useRouter()
const { signInWithGoogle, initAuth, isAuthenticated } = useAuth()

const loading = ref(false)
const error = ref('')

const handleSignIn = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await signInWithGoogle()
  } catch (e: any) {
    error.value = e.message || 'Failed to sign in'
    loading.value = false
  }
}

// Handle OAuth callback - if URL has hash params, Supabase will process them
// and trigger onAuthStateChange, which will set isAuthenticated to true
onMounted(async () => {
  // Check if this is an OAuth callback (has hash parameters)
  const hasHashParams = window.location.hash.includes('access_token')
  
  if (hasHashParams) {
    loading.value = true
  }
  
  // Initialize auth (will process any tokens in the URL)
  await initAuth()
  
  // If already authenticated (from callback or existing session), redirect to home
  if (isAuthenticated.value) {
    router.push('/')
  } else {
    loading.value = false
  }
})

// Watch for auth state changes (e.g., after OAuth callback is processed)
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    router.push('/')
  }
})
</script>
