<template>
  <div class="p-6 lg:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Tasks</h1>
        <p class="text-gray-400">Manage your daily tasks</p>
      </div>
      <div class="flex gap-3">
        <div class="flex bg-gray-900 rounded-xl p-1">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="activeFilter === filter.value ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'"
          >
            {{ filter.label }}
          </button>
        </div>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
        >
          <UIcon name="i-lucide-plus" class="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="todosStore.loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-400" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTodos.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-inbox" class="w-10 h-10 text-gray-600" />
      </div>
      <h3 class="text-xl font-semibold mb-2">No tasks found</h3>
      <p class="text-gray-400 mb-6">
        {{ activeFilter === 'all' ? 'Create your first task to get started' : `No ${activeFilter} tasks` }}
      </p>
      <button
        @click="showAddModal = true"
        class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
      >
        Add Task
      </button>
    </div>

    <!-- Todo Cards by Date -->
    <div v-else class="space-y-6">
      <div
        v-for="(dateGroup, date) in groupedByDate"
        :key="date"
        class="space-y-3"
      >
        <!-- Date Header -->
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold">{{ formatDateHeader(date as string) }}</h3>
          <div class="flex-1 h-px bg-gray-800"></div>
          <span class="text-sm text-gray-500">
            {{ dateGroup.length }} {{ dateGroup.length === 1 ? 'task' : 'tasks' }}
          </span>
        </div>
        
        <!-- Cards Grid -->
        <div class="grid gap-3">
          <div
            v-for="todo in dateGroup"
            :key="todo.id"
            class="group bg-gray-900 hover:bg-gray-800 rounded-xl p-4 border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer"
            @click="openEditModal(todo)"
          >
            <div class="flex items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">
                    {{ todo.title }}
                  </span>
                </div>
                <div v-if="todo.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
                  {{ todo.description }}
                </div>
                <div class="flex items-center gap-3 mt-2">
                  <span 
                    v-if="todo.category" 
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="categoriesStore.getCategoryColor(todo.category)"
                  >
                    {{ categoriesStore.getCategoryIcon(todo.category) }} {{ todo.category }}
                  </span>
                  <span
                    v-if="todo.recurrence"
                    class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center gap-1"
                  >
                    <UIcon name="i-lucide-repeat" class="w-3 h-3" />
                    {{ todo.recurrence === 'daily' ? 'Daily' : formatRecurrenceDays(todo.recurrence_days) }}
                  </span>
                  <span class="text-xs text-gray-600">
                    {{ formatTime(todo.created_at) }}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click.stop="openEditModal(todo)"
                  class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <UIcon name="i-lucide-pencil" class="w-4 h-4 text-gray-400" />
                </button>
                <button
                  @click.stop="confirmDelete(todo)"
                  class="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <UIcon name="i-lucide-trash-2" class="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div v-if="showAddModal || editingTodo" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" @click.self="closeModal">
        <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-800 overflow-visible">
          <h3 class="text-xl font-bold mb-4">
            {{ editingTodo ? 'Edit Task' : 'Add New Task' }}
          </h3>
          <form @submit.prevent="saveTodo">
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2">Title</label>
                <UInput
                  v-model="todoForm.title"
                  placeholder="What do you want to accomplish?"
                  size="lg"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2">Description (optional)</label>
                <UTextarea
                  v-model="todoForm.description"
                  placeholder="Add more details..."
                  :rows="5"
                  class="w-full"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                  <label class="block text-sm text-gray-400 mb-2">Category</label>
                  <select
                    v-model="todoForm.category"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-white appearance-none cursor-pointer"
                  >
                    <option value="">No category</option>
                    <option v-for="cat in categoriesStore.categories" :key="cat.value" :value="cat.value">
                      {{ cat.icon ? cat.icon + ' ' : '' }}{{ cat.name }}
                    </option>
                  </select>
                  <UIcon name="i-lucide-chevron-down" class="absolute right-3 top-[38px] w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-2">Repeat</label>
                  <select
                    v-model="todoForm.recurrence"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-white appearance-none cursor-pointer"
                  >
                    <option value="">One-time task</option>
                    <option value="daily">Every day</option>
                    <option value="weekly">Specific days</option>
                  </select>
                </div>
              </div>
              <!-- Day Picker (shown when recurrence is 'weekly') -->
              <div v-if="todoForm.recurrence === 'weekly'" class="flex flex-wrap gap-2">
                <button
                  v-for="(day, index) in dayNames"
                  :key="index"
                  type="button"
                  @click="toggleDay(index)"
                  class="w-10 h-10 rounded-lg text-sm font-medium transition-colors"
                  :class="todoForm.recurrenceDays.includes(index)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                >
                  {{ day }}
                </button>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium transition-colors"
              >
                {{ editingTodo ? 'Save Changes' : 'Add Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deletingTodo" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-800">
          <div class="text-center">
            <div class="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-alert-triangle" class="w-7 h-7 text-red-400" />
            </div>
            <h3 class="text-xl font-bold mb-2">Delete Task?</h3>
            <p class="text-gray-400 mb-6">This action cannot be undone.</p>
          </div>
          <div class="flex gap-3">
            <button
              @click="deletingTodo = null"
              class="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              @click="deleteTodoConfirmed"
              class="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useTodosStore } from '~/stores/todos'
import { useCategoriesStore } from '~/stores/categories'
import type { Todo } from '~/stores/todos'
import { getLocalDateString } from '~/utils/date'

const todosStore = useTodosStore()
const categoriesStore = useCategoriesStore()

const showAddModal = ref(false)
const editingTodo = ref<Todo | null>(null)
const deletingTodo = ref<Todo | null>(null)
const activeFilter = ref('all')

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]

const todoForm = reactive({
  title: '',
  description: '',
  date: getLocalDateString(),
  category: '',
  recurrence: '' as '' | 'daily' | 'weekly',
  recurrenceDays: [] as number[],
})

const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const toggleDay = (day: number) => {
  const idx = todoForm.recurrenceDays.indexOf(day)
  if (idx === -1) {
    todoForm.recurrenceDays.push(day)
  } else {
    todoForm.recurrenceDays.splice(idx, 1)
  }
}

const filteredTodos = computed(() => {
  const today = getLocalDateString()
  const todayDow = new Date().getDay()
  
  switch (activeFilter.value) {
    case 'today':
      return todosStore.todos.filter(t => {
        if (t.date === today) return true
        if (t.recurrence === 'daily') return true
        if (t.recurrence === 'weekly') {
          const days: number[] = t.recurrence_days || []
          return days.includes(todayDow)
        }
        return false
      })
    case 'upcoming':
      return todosStore.todos.filter(t => t.date >= today)
    default:
      return todosStore.todos
  }
})

const groupedByDate = computed(() => {
  const groups: Record<string, Todo[]> = {}
  
  filteredTodos.value.forEach(todo => {
    if (!groups[todo.date]) {
      groups[todo.date] = []
    }
    groups[todo.date].push(todo)
  })
  
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  
  const result: Record<string, Todo[]> = {}
  sortedKeys.forEach(key => {
    result[key] = groups[key].sort((a, b) => (b.priority || 0) - (a.priority || 0))
  })
  
  return result
})

const formatDateHeader = (date: string) => {
  const today = getLocalDateString()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getLocalDateString(tomorrow)
  
  if (date === today) return 'Today'
  if (date === tomorrowStr) return 'Tomorrow'
  
  const parts = date.split('-')
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatRecurrenceDays = (days: number[] | null | undefined) => {
  if (!days || days.length === 0) return ''
  if (days.length === 7) return 'Daily'
  const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  return days.sort().map(d => names[d]).join(', ')
}

const openEditModal = (todo: Todo) => {
  editingTodo.value = todo
  todoForm.title = todo.title
  todoForm.description = todo.description || ''
  todoForm.date = todo.date
  todoForm.category = todo.category || ''
  todoForm.recurrence = (todo.recurrence as '' | 'daily' | 'weekly') || ''
  todoForm.recurrenceDays = todo.recurrence_days ? [...todo.recurrence_days] : []
}

const closeModal = () => {
  showAddModal.value = false
  editingTodo.value = null
  todoForm.title = ''
  todoForm.description = ''
  todoForm.date = getLocalDateString()
  todoForm.category = ''
  todoForm.recurrence = ''
  todoForm.recurrenceDays = []
}

const saveTodo = async () => {
  if (!todoForm.title.trim()) return
  
  const recurrenceData: any = {}
  if (todoForm.recurrence) {
    recurrenceData.recurrence = todoForm.recurrence
    recurrenceData.recurrence_days = todoForm.recurrence === 'weekly'
      ? todoForm.recurrenceDays.sort()
      : todoForm.recurrence === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : []
  } else {
    recurrenceData.recurrence = null
    recurrenceData.recurrence_days = null
  }

  if (editingTodo.value) {
    await todosStore.updateTodo(editingTodo.value.id, {
      title: todoForm.title,
      description: todoForm.description || undefined,
      date: todoForm.date,
      category: todoForm.category || undefined,
      ...recurrenceData,
    })
  } else {
    await todosStore.addTodo(todoForm.title, todoForm.date, todoForm.category || undefined, recurrenceData)
  }
  
  closeModal()
}

const confirmDelete = (todo: Todo) => {
  deletingTodo.value = todo
}

const deleteTodoConfirmed = async () => {
  if (deletingTodo.value) {
    await todosStore.deleteTodo(deletingTodo.value.id)
    deletingTodo.value = null
  }
}

// Todos already initialized by layout. Re-fetch only if empty.
onMounted(async () => {
  if (todosStore.todos.length === 0) {
    await todosStore.fetchTodos()
  }
})
</script>
