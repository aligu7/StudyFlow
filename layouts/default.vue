<template>
  <div class="flex min-h-screen">
    <!-- Sidebar Navigation -->
    <aside
      class="bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-50 transition-all duration-300"
      :class="sidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo -->
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center gap-3" :class="{'justify-center': sidebarCollapsed}">
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-brain" class="w-6 h-6 text-white" />
          </div>
          <span
            v-if="!sidebarCollapsed"
            class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
          >
            StudyFlow
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
          :class="[
            $route.path === item.path 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
            sidebarCollapsed ? 'justify-center' : 'justify-start'
          ]"
        >
          <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!sidebarCollapsed" class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom section: Collapse toggle, Quick Timer, Fullscreen, Logout, Avatar -->
      <div class="border-t border-gray-800 mt-auto">
        <!-- Expanded mode: row layout -->
        <div v-if="!sidebarCollapsed" class="px-3 pt-3 flex items-center justify-between">
          <!-- Collapse/Expand toggle -->
          <button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="p-2 pb-1  text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <UIcon
              name="i-lucide-chevrons-left"
              class="w-4 h-4"
            />
          </button>

          <!-- Right side: Fullscreen + Logout + Avatar -->
          <div class="flex items-center gap-1">
            <!-- Fullscreen button -->
            <button
              @click="toggleBrowserFullscreen"
              class="p-2 pb-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              :title="isBrowserFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            >
              <UIcon
                :name="isBrowserFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
                class="w-4 h-4"
              />
            </button>

            <!-- Logout button -->
            <button
              @click="handleLogout"
              class="p-2 pb-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mr-2"
              title="Sign out"
            >
              <UIcon
                name="i-lucide-log-out"
                class="w-4 h-4"
              />
            </button>

            <!-- User avatar -->
            <div v-if="user" class="flex-shrink-0">
              <img
                v-if="user.user_metadata?.avatar_url"
                :src="user.user_metadata.avatar_url"
                :alt="user.email"
                class="w-7 h-7 rounded-full"
                :title="user.email"
              />
              <div
                v-else
                class="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold"
                :title="user.email"
              >
                {{ user.email?.charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Collapsed mode: vertical column (like nav items) -->
        <div v-else class="p-3 space-y-1">
          <!-- Expand toggle -->
          <button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="w-full flex items-center justify-center p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            title="Expand sidebar"
          >
            <UIcon
              name="i-lucide-chevrons-right"
              class="w-5 h-5"
            />
          </button>

          <!-- Quick Timer -->
          <NuxtLink
            to="/timer"
            class="w-full flex items-center justify-center p-3 rounded-xl transition-colors"
            :class="timerStore.isRunning ? 'bg-emerald-600/20 text-emerald-400' : timerStore.isPaused ? 'bg-amber-600/20 text-amber-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
            title="Focus Timer"
          >
            <UIcon name="i-lucide-timer" class="w-5 h-5" />
          </NuxtLink>

          <!-- Fullscreen -->
          <button
            @click="toggleBrowserFullscreen"
            class="w-full flex items-center justify-center p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            :title="isBrowserFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          >
            <UIcon
              :name="isBrowserFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
              class="w-5 h-5"
            />
          </button>

          <!-- Logout -->
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-center p-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Sign out"
          >
            <UIcon
              name="i-lucide-log-out"
              class="w-5 h-5"
            />
          </button>

          <!-- Avatar with margin top -->
          <div v-if="user" class="flex justify-center pt-2">
            <img
              v-if="user.user_metadata?.avatar_url"
              :src="user.user_metadata.avatar_url"
              :alt="user.email"
              class="w-8 h-8 rounded-full"
              :title="user.email"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold"
              :title="user.email"
            >
              {{ user.email?.charAt(0).toUpperCase() }}
            </div>
          </div>
        </div>

        <!-- Quick Timer — Expanded mode: shows session info + link to timer page -->
        <div v-if="!sidebarCollapsed" class="p-3">
          <NuxtLink
            to="/timer"
            class="block bg-gray-800/50 hover:bg-gray-800 rounded-xl p-3 transition-colors"
          >
            <div class="text-xs text-gray-500 mb-1">Focus Timer</div>
            <div
              class="text-xl font-mono text-left"
              :class="timerStore.isRunning ? 'text-emerald-400' : timerStore.isPaused ? 'text-amber-400' : 'text-gray-400'"
            >
              {{ timerStore.formattedTime.display }}
            </div>
            <div
              v-if="timerStore.selectedTodo && (timerStore.isRunning || timerStore.isPaused)"
              class="text-xs text-gray-400 truncate mt-1"
            >
              {{ timerStore.selectedTodo.title }}
            </div>
            <div
              v-if="timerStore.isRunning"
              class="text-xs text-emerald-400/70 mt-1.5 flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Focusing...
            </div>
            <div v-else-if="timerStore.isPaused" class="text-xs text-amber-400/70 mt-1.5">
              Paused
            </div>
            <div v-else class="text-xs text-gray-500 mt-1.5">
              Open Timer
            </div>
          </NuxtLink>
        </div>

        <!-- Small screen timer widget (mobile only) -->
        <div class="p-3 lg:hidden">
          <NuxtLink
            to="/timer"
            class="block bg-gray-800/50 hover:bg-gray-800 rounded-xl p-3 transition-colors"
          >
            <div
              class="text-xl font-mono text-center"
              :class="timerStore.isRunning ? 'text-emerald-400' : timerStore.isPaused ? 'text-amber-400' : 'text-gray-400'"
            >
              {{ timerStore.formattedTime.display }}
            </div>
            <div
              v-if="timerStore.isRunning"
              class="text-xs text-emerald-400/70 mt-1 text-center flex items-center justify-center gap-1"
            >
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Focusing...
            </div>
            <div v-else-if="timerStore.isPaused" class="text-xs text-amber-400/70 mt-1 text-center">
              Paused
            </div>
          </NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="flex-1 min-h-screen transition-all duration-300"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '~/stores/todos'
import { useTimerStore } from '~/stores/timer'
import { useSettingsStore } from '~/stores/settings'
import { useCategoriesStore } from '~/stores/categories'

const route = useRoute()
const { signOut, user } = useAuth()
const todosStore = useTodosStore()
const timerStore = useTimerStore()
const settingsStore = useSettingsStore()
const categoriesStore = useCategoriesStore()

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { path: '/todos', label: 'Todos', icon: 'i-lucide-check-square' },
  { path: '/timer', label: 'Timer', icon: 'i-lucide-timer' },
  { path: '/stats', label: 'Statistics', icon: 'i-lucide-bar-chart-3' },
  { path: '/settings', label: 'Settings', icon: 'i-lucide-settings' },
]

const sidebarCollapsed = ref(false)
const isBrowserFullscreen = ref(false)

const toggleBrowserFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (e) {
    console.error('Fullscreen toggle failed:', e)
  }
}

const handleLogout = async () => {
  await signOut()
  navigateTo('/login')
}

// Initialize all Pinia stores once on layout mount
onMounted(async () => {
  await Promise.all([
    todosStore.init(),
    settingsStore.init(),
    categoriesStore.init(),
    timerStore.init(),
  ])

  // Track browser fullscreen state
  const onFsChange = () => {
    isBrowserFullscreen.value = !!document.fullscreenElement
  }
  document.addEventListener('fullscreenchange', onFsChange)
  onUnmounted(() => document.removeEventListener('fullscreenchange', onFsChange))
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
    
    switch (e.key.toLowerCase()) {
      case 't':
        navigateTo('/timer')
        break
      case 'd':
        navigateTo('/')
        break
      case 's':
        navigateTo('/stats')
        break
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
})
</script>
