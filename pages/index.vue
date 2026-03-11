<template>
  <div class="p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">
          Good {{ greeting }}!
        </h1>
        <p class="text-gray-400 mt-1">{{ formattedDate }}</p>
      </div>
      <div class="flex gap-3">
        <button
          @click="navigateTo('/timer')"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
        >
          <UIcon name="i-lucide-play" class="w-5 h-5" />
          <span>Start Focus</span>
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-timer" class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ timerStore.todaySessions }}</div>
            <div class="text-sm text-gray-400">Today's Sessions</div>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ formatDuration(timerStore.todayStudyTime) }}</div>
            <div class="text-sm text-gray-400">Focus Time</div>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-flame" class="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ statsStore.currentStreak }}</div>
            <div class="text-sm text-gray-400">Day Streak</div>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-book-open" class="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ todosStore.todayTodos.length }}</div>
            <div class="text-sm text-gray-400">Today's Tasks</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Today's Focus -->
    <div class="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-2xl p-6 border border-emerald-800/30">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="text-emerald-400" />
          Today's Focus
        </h2>
        <NuxtLink to="/todos" class="text-emerald-400 hover:text-emerald-300 text-sm">
          View all
        </NuxtLink>
      </div>
      
      <div v-if="todosStore.todayTodos.length === 0" class="text-center py-8">
        <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-plus" class="w-8 h-8 text-gray-500" />
        </div>
        <p class="text-gray-400 mb-4">No tasks for today yet</p>
        <button
          @click="navigateTo('/todos')"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
        >
          Add Your First Task
        </button>
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="todo in todosStore.todayTodos.slice(0, 5)"
          :key="todo.id"
          class="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
          @click="navigateTo('/timer')"
        >
          <span class="flex-1">
            {{ todo.title }}
          </span>
          <span v-if="todo.category" class="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400">
            {{ todo.category }}
          </span>
        </div>
        
        <button
          v-if="todosStore.todayTodos.length > 5"
          @click="navigateTo('/todos')"
          class="w-full py-2 text-gray-400 hover:text-gray-300 text-sm"
        >
          +{{ todosStore.todayTodos.length - 5 }} more tasks
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        to="/timer"
        class="group bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-emerald-500/50 transition-all"
      >
        <div class="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UIcon name="i-lucide-timer" class="w-6 h-6 text-emerald-400" />
        </div>
        <h3 class="font-semibold mb-1">Focus Timer</h3>
        <p class="text-sm text-gray-400">Start a focused work session</p>
      </NuxtLink>
      
      <NuxtLink
        to="/stats"
        class="group bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-cyan-500/50 transition-all"
      >
        <div class="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UIcon name="i-lucide-bar-chart-3" class="w-6 h-6 text-cyan-400" />
        </div>
        <h3 class="font-semibold mb-1">Statistics</h3>
        <p class="text-sm text-gray-400">Track your progress</p>
      </NuxtLink>
      
      <NuxtLink
        to="/todos"
        class="group bg-gray-900 hover:bg-gray-800 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/50 transition-all"
      >
        <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <UIcon name="i-lucide-list-todo" class="w-6 h-6 text-purple-400" />
        </div>
        <h3 class="font-semibold mb-1">All Tasks</h3>
        <p class="text-sm text-gray-400">Manage your tasks</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStatsStore } from '~/stores/stats'
import { formatDuration } from '~/utils/date'

const todosStore = useTodosStore()
const timerStore = useTimerStore()
const statsStore = useStatsStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Fetch stats on mount (layout handles todos/settings/categories/timer init)
onMounted(async () => {
  await statsStore.fetchDailyStats(30)
})
</script>
