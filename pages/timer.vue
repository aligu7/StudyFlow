<template>
  <div class="relative">
    <!-- Timer Fullscreen Mode -->
    <div
      v-if="timerFullscreen"
      class="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
    >
      <!-- Exit fullscreen button -->
      <button
        @click="timerFullscreen = false"
        class="absolute top-6 right-6 p-3 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
      >
        <UIcon name="i-lucide-minimize-2" class="w-6 h-6" />
      </button>

      <!-- Current Todo -->
      <div v-if="timerStore.selectedTodo" class="text-center mb-10">
        <div class="text-sm text-gray-500 mb-2">Working on</div>
        <div class="text-2xl font-semibold text-emerald-400">
          {{ timerStore.selectedTodo.title }}
        </div>
        <div v-if="timerStore.selectedTodo.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
          {{ timerStore.selectedTodo.description }}
        </div>
      </div>

      <!-- Big Timer Circle -->
      <div class="relative w-95 h-95 sm:w-120 sm:h-120 mb-10">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none" stroke="currentColor" stroke-width="1.5"
            class="text-gray-800"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"
            class="text-emerald-500 transition-all duration-500"
            :stroke-dasharray="283"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-6xl sm:text-7xl font-mono font-bold tracking-wider">
            {{ timerStore.formattedTime.display }}
          </div>
          <div class="text-gray-500 mt-3 text-lg">
            {{ statusText }}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-6">
        <button
          v-if="!timerStore.isRunning && !timerStore.isPaused"
          @click="startTimer"
          :disabled="!timerStore.selectedTodo"
          class="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <UIcon name="i-lucide-play" class="w-10 h-10" />
        </button>
        <button
          v-if="timerStore.isRunning"
          @click="timerStore.pauseTimer()"
          class="w-20 h-20 bg-amber-600 hover:bg-amber-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <UIcon name="i-lucide-pause" class="w-10 h-10" />
        </button>
        <button
          v-if="timerStore.isPaused"
          @click="timerStore.resumeTimer()"
          class="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <UIcon name="i-lucide-play" class="w-10 h-10" />
        </button>
        <button
          v-if="timerStore.isRunning || timerStore.isPaused"
          @click="stopAndSave"
          class="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
        >
          <UIcon name="i-lucide-square" class="w-10 h-10" />
        </button>
      </div>
    </div>

    <!-- Normal Page -->
    <div v-show="!timerFullscreen" class="p-6 lg:p-8 space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Focus Timer</h1>
          <p class="text-gray-400">Stay focused and track your time</p>
        </div>
        <button
          @click="timerFullscreen = true"
          class="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          title="Timer fullscreen"
        >
          <UIcon name="i-lucide-maximize-2" class="w-5 h-5" />
        </button>
      </div>

      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Timer Display -->
        <div class="space-y-6">
          <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700">
            <!-- Current Todo -->
            <div v-if="timerStore.selectedTodo" class="text-center mb-8">
              <div class="text-sm text-gray-400 mb-2">Working on</div>
              <div class="text-xl font-semibold text-emerald-400">
                {{ timerStore.selectedTodo.title }}
              </div>
              <div v-if="timerStore.selectedTodo.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                {{ timerStore.selectedTodo.description }}
              </div>
            </div>
            <div v-else class="text-center mb-8">
              <div class="text-sm text-gray-500">Select a task from the list to begin</div>
            </div>
            
            <!-- Timer Circle -->
            <div class="relative w-85 h-85 mx-auto mb-8">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none" stroke="currentColor" stroke-width="2"
                  class="text-gray-800"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round"
                  class="text-emerald-500 transition-all duration-500"
                  :stroke-dasharray="283"
                  :stroke-dashoffset="progressOffset"
                />
              </svg>
              
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="text-5xl font-mono font-bold tracking-wider">
                  {{ timerStore.formattedTime.display }}
                </div>
                <div class="text-gray-400 mt-2">
                  {{ statusText }}
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-4">
              <button
                v-if="!timerStore.isRunning && !timerStore.isPaused"
                @click="startTimer"
                :disabled="!timerStore.selectedTodo"
                class="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-105"
              >
                <UIcon name="i-lucide-play" class="w-8 h-8" />
              </button>
              
              <button
                v-if="timerStore.isRunning"
                @click="timerStore.pauseTimer()"
                class="w-16 h-16 bg-amber-600 hover:bg-amber-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
              >
                <UIcon name="i-lucide-pause" class="w-8 h-8" />
              </button>
              
              <button
                v-if="timerStore.isPaused"
                @click="timerStore.resumeTimer()"
                class="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
              >
                <UIcon name="i-lucide-play" class="w-8 h-8" />
              </button>
              
              <button
                v-if="timerStore.isRunning || timerStore.isPaused"
                @click="stopAndSave"
                class="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all hover:scale-105"
              >
                <UIcon name="i-lucide-square" class="w-8 h-8" />
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center justify-center gap-4 mt-8">
              <button
                @click="timerStore.resetTimer()"
                class="text-gray-400 hover:text-white text-sm flex items-center gap-2"
              >
                <UIcon name="i-lucide-rotate-ccw" class="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <!-- Session Stats -->
          <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 class="font-semibold mb-4">Today's Sessions</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-gray-800 rounded-xl">
                <div class="text-2xl font-bold text-emerald-400">{{ timerStore.todaySessions }}</div>
                <div class="text-sm text-gray-400">Sessions</div>
              </div>
              <div class="text-center p-4 bg-gray-800 rounded-xl">
                <div class="text-2xl font-bold text-cyan-400">{{ formatDuration(timerStore.todayStudyTime) }}</div>
                <div class="text-sm text-gray-400">Total Time</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Todo Selector -->
        <div class="space-y-6">
          <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 class="font-semibold mb-4">Select a Task</h3>
            
            <!-- Search -->
            <div class="relative mb-4">
              <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks..."
                class="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                :disabled="isSessionActive"
              />
            </div>

            <!-- Todo List -->
            <div class="space-y-2 max-h-96 overflow-y-auto" :class="{ 'opacity-50': isSessionActive }">
              <div
                v-for="todo in filteredTodos"
                :key="todo.id"
                @click="selectTodoItem(todo)"
                class="flex items-center gap-3 p-3 rounded-xl transition-colors"
                :class="[
                  timerStore.selectedTodo?.id === todo.id 
                    ? 'bg-emerald-600/20 border border-emerald-500/50' 
                    : 'bg-gray-800 hover:bg-gray-750 border border-transparent',
                  isSessionActive ? 'cursor-not-allowed' : 'cursor-pointer'
                ]"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">
                    {{ todo.title }}
                    <div v-if="todo.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                      {{ todo.description }}
                    </div>
                  </div>
                  <div class="text-xs text-gray-500">{{ formatDate(todo.date) }}</div>
                </div>
                <span v-if="todo.category" class="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                  {{ todo.category }}
                </span>
              </div>
              
              <div v-if="filteredTodos.length === 0" class="text-center py-8 text-gray-500">
                No tasks found
              </div>
            </div>

            <!-- Locked notice -->
            <div v-if="isSessionActive" class="mt-3 text-xs text-amber-400/70 flex items-center gap-1.5">
              <UIcon name="i-lucide-lock" class="w-3.5 h-3.5" />
              Task selection locked during active session
            </div>
          </div>

          <!-- Quick Add -->
          <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h3 class="font-semibold mb-4">Quick Add Task</h3>
            <form @submit.prevent="quickAddTodo" class="flex gap-3">
              <UInput
                v-model="quickAddTitle"
                placeholder="New task..."
                class="flex-1"
              />
              <button
                type="submit"
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimerStore } from '~/stores/timer'
import { useTodosStore } from '~/stores/todos'
import { getLocalDateString, formatDuration } from '~/utils/date'

const todosStore = useTodosStore()
const timerStore = useTimerStore()

const searchQuery = ref('')
const quickAddTitle = ref('')
const timerFullscreen = ref(false)

const isSessionActive = computed(() => timerStore.isRunning && !timerStore.isPaused)

const filteredTodos = computed(() => {
  const todos = todosStore.todos
  if (!searchQuery.value) return todos
  
  const query = searchQuery.value.toLowerCase()
  return todos.filter(t => 
    t.title.toLowerCase().includes(query) ||
    t.category?.toLowerCase().includes(query)
  )
})

const progressOffset = computed(() => {
  const maxTime = 60 * 60
  const progress = Math.min(timerStore.currentTime / maxTime, 1)
  return 283 * (1 - progress)
})

const statusText = computed(() => {
  if (timerStore.isRunning) return 'Focusing...'
  if (timerStore.isPaused) return 'Paused'
  if (timerStore.currentTime > 0) return 'Completed'
  return 'Ready'
})

const selectTodoItem = (todo: Todo) => {
  if (isSessionActive.value) return
  timerStore.selectTodo(todo)
}

const startTimer = async () => {
  await timerStore.startTimer()
}

const stopAndSave = async () => {
  await timerStore.stopTimer()
}

const quickAddTodo = async () => {
  if (!quickAddTitle.value.trim()) return
  await todosStore.addTodo(quickAddTitle.value.trim())
  quickAddTitle.value = ''
}

const formatDate = (date: string) => {
  const today = getLocalDateString()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)
  
  if (date === today) return 'Today'
  if (date === tomorrowStr) return 'Tomorrow'
  
  const parts = date.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Escape key exits timer fullscreen
onMounted(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && timerFullscreen.value) {
      timerFullscreen.value = false
    }
  }
  window.addEventListener('keydown', handleKey)
  onUnmounted(() => window.removeEventListener('keydown', handleKey))
})

onMounted(async () => {
  if (todosStore.todos.length === 0) {
    await todosStore.fetchTodos()
  }
})
</script>
