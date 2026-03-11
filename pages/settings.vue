<template>
  <div class="p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-gray-400">Customize your experience</p>
    </div>

    <!-- Settings Sections -->
    <div class="max-w-2xl space-y-6">
      <!-- Categories -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-tag" class="w-5 h-5 text-emerald-400" />
          Categories
        </h3>

        <!-- Loading -->
        <div v-if="categoriesStore.loading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-emerald-400" />
        </div>

        <div v-else class="space-y-3">
          <!-- Category List -->
          <div
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/50 group"
          >
            <!-- Editing mode -->
            <template v-if="editingCategoryId === cat.id">
              <input
                v-model="editForm.icon"
                class="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg text-center text-lg focus:outline-none focus:border-emerald-500"
                placeholder="icon"
                maxlength="2"
              />
              <input
                v-model="editForm.name"
                class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Category name"
                @keyup.enter="saveEdit(cat.id)"
              />
              <select
                v-model="editForm.color"
                class="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <option v-for="c in colorOptions" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
              <button
                @click="saveEdit(cat.id)"
                class="p-2 hover:bg-emerald-600/20 rounded-lg transition-colors"
              >
                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-400" />
              </button>
              <button
                @click="cancelEdit"
                class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 text-gray-400" />
              </button>
            </template>

            <!-- Display mode -->
            <template v-else>
              <span class="w-10 h-10 flex items-center justify-center text-lg">{{ cat.icon || 'icon' }}</span>
              <span class="flex-1 font-medium">{{ cat.name }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="cat.color"
              >
                {{ cat.value }}
              </span>
              <button
                @click="startEdit(cat)"
                class="p-2 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <UIcon name="i-lucide-pencil" class="w-4 h-4 text-gray-400" />
              </button>
              <button
                @click="handleDeleteCategory(cat.id)"
                class="p-2 hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                :disabled="deletingCategoryId === cat.id"
              >
                <UIcon
                  :name="deletingCategoryId === cat.id ? 'i-lucide-loader-2' : 'i-lucide-trash-2'"
                  class="w-4 h-4 text-red-400"
                  :class="{ 'animate-spin': deletingCategoryId === cat.id }"
                />
              </button>
            </template>
          </div>

          <!-- Add New Category -->
          <div class="border-t border-gray-800 pt-3 mt-3">
            <div v-if="showAddForm" class="flex items-center gap-3">
              <input
                v-model="newForm.icon"
                class="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg text-center text-lg focus:outline-none focus:border-emerald-500"
                placeholder="icon"
                maxlength="2"
              />
              <input
                v-model="newForm.name"
                ref="newNameInput"
                class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Category name"
                @keyup.enter="addNewCategory"
              />
              <select
                v-model="newForm.color"
                class="bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
              >
                <option v-for="c in colorOptions" :key="c.value" :value="c.value">
                  {{ c.label }}
                </option>
              </select>
              <button
                @click="addNewCategory"
                :disabled="!newForm.name.trim() || addingCategory"
                class="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <UIcon
                  :name="addingCategory ? 'i-lucide-loader-2' : 'i-lucide-plus'"
                  class="w-4 h-4"
                  :class="{ 'animate-spin': addingCategory }"
                />
              </button>
              <button
                @click="showAddForm = false"
                class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <button
              v-else
              @click="openAddForm"
              class="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-keyboard" class="w-5 h-5 text-pink-400" />
          Keyboard Shortcuts
        </h3>
        
        <div class="space-y-2">
          <div v-for="shortcut in shortcuts" :key="shortcut.key" class="flex items-center justify-between py-2">
            <span class="text-gray-400">{{ shortcut.action }}</span>
            <kbd class="px-2 py-1 bg-gray-800 rounded text-sm font-mono">{{ shortcut.key }}</kbd>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-gray-400" />
          About
        </h3>
        
        <div class="space-y-2 text-gray-400">
          <p><strong>StudyFlow</strong> - Your productivity companion</p>
          <p class="text-sm">Version 1.0.0</p>
          <p class="text-sm">Built with Nuxt 3, Nuxt UI, and Supabase</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCategoriesStore } from '~/stores/categories'
import type { Category } from '~/stores/categories'

const categoriesStore = useCategoriesStore()

const editingCategoryId = ref<string | null>(null)
const deletingCategoryId = ref<string | null>(null)
const showAddForm = ref(false)
const addingCategory = ref(false)
const newNameInput = ref<HTMLInputElement | null>(null)

const editForm = reactive({
  name: '',
  icon: '',
  color: '',
})

const newForm = reactive({
  name: '',
  icon: '',
  color: 'bg-gray-500/20 text-gray-400',
})

const colorOptions = [
  { label: 'Purple', value: 'bg-purple-500/20 text-purple-400' },
  { label: 'Blue', value: 'bg-blue-500/20 text-blue-400' },
  { label: 'Pink', value: 'bg-pink-500/20 text-pink-400' },
  { label: 'Green', value: 'bg-green-500/20 text-green-400' },
  { label: 'Amber', value: 'bg-amber-500/20 text-amber-400' },
  { label: 'Cyan', value: 'bg-cyan-500/20 text-cyan-400' },
  { label: 'Red', value: 'bg-red-500/20 text-red-400' },
  { label: 'Gray', value: 'bg-gray-500/20 text-gray-400' },
]

const shortcuts = [
  { key: 'T', action: 'Go to Timer' },
  { key: 'D', action: 'Go to Dashboard' },
  { key: 'S', action: 'Go to Statistics' },
]

const startEdit = (cat: Category) => {
  editingCategoryId.value = cat.id
  editForm.name = cat.name
  editForm.icon = cat.icon
  editForm.color = cat.color
}

const cancelEdit = () => {
  editingCategoryId.value = null
}

const saveEdit = async (id: string) => {
  if (!editForm.name.trim()) return
  try {
    await categoriesStore.updateCategory(id, {
      name: editForm.name.trim(),
      icon: editForm.icon,
      color: editForm.color,
    })
    editingCategoryId.value = null
  } catch (e) {
    console.error('Failed to update category:', e)
  }
}

const handleDeleteCategory = async (id: string) => {
  deletingCategoryId.value = id
  try {
    await categoriesStore.deleteCategory(id)
  } catch (e) {
    console.error('Failed to delete category:', e)
  } finally {
    deletingCategoryId.value = null
  }
}

const openAddForm = () => {
  showAddForm.value = true
  newForm.name = ''
  newForm.icon = ''
  newForm.color = 'bg-gray-500/20 text-gray-400'
  nextTick(() => {
    newNameInput.value?.focus()
  })
}

const addNewCategory = async () => {
  if (!newForm.name.trim() || addingCategory.value) return
  addingCategory.value = true
  try {
    await categoriesStore.addCategory(newForm.name.trim(), newForm.icon, newForm.color)
    newForm.name = ''
    newForm.icon = ''
    newForm.color = 'bg-gray-500/20 text-gray-400'
    showAddForm.value = false
  } catch (e) {
    console.error('Failed to add category:', e)
  } finally {
    addingCategory.value = false
  }
}
</script>
