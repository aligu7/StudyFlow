export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, loading, initAuth } = useAuth()

  if (to.path === '/login') {
    return
  }

  if (loading.value) {
    await initAuth()
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
