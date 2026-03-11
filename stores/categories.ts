import { defineStore } from 'pinia'
import { supabase } from '~/utils/supabase'

export interface Category {
  id: string
  name: string
  value: string
  icon: string
  color: string
  created_at: string
  updated_at: string
}

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Study', value: 'study', icon: '\u{1F4DA}', color: 'bg-purple-500/20 text-purple-400' },
  { name: 'Work', value: 'work', icon: '\u{1F4BC}', color: 'bg-blue-500/20 text-blue-400' },
  { name: 'Personal', value: 'personal', icon: '\u{1F3E0}', color: 'bg-pink-500/20 text-pink-400' },
  { name: 'Health', value: 'health', icon: '\u{1F4AA}', color: 'bg-green-500/20 text-green-400' },
  { name: 'Other', value: 'other', icon: '\u{1F4CC}', color: 'bg-gray-500/20 text-gray-400' },
]

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
    loading: false,
    error: null as string | null,
    _initialized: false,
  }),

  actions: {
    async fetchCategories() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error
        this.categories = data || []
      } catch (e: any) {
        this.error = e.message
        console.error('Error fetching categories:', e)
      } finally {
        this.loading = false
      }
    },

    async seedDefaults() {
      try {
        const { error } = await supabase
          .from('categories')
          .insert(DEFAULT_CATEGORIES)

        if (error) throw error
        await this.fetchCategories()
      } catch (e: any) {
        console.error('Error seeding default categories:', e)
      }
    },

    async init() {
      if (this._initialized) return
      this._initialized = true
      await this.fetchCategories()
      if (this.categories.length === 0) {
        await this.seedDefaults()
      }
    },

    async addCategory(name: string, icon: string = '', color: string = 'bg-gray-500/20 text-gray-400') {
      const value = name.toLowerCase().replace(/\s+/g, '-')
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({ name, value, icon, color })
          .select()
          .single()

        if (error) throw error
        if (data) {
          this.categories.push(data)
        }
        return data
      } catch (e: any) {
        this.error = e.message
        console.error('Error adding category:', e)
        throw e
      }
    },

    async updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) {
      try {
        const updateData: any = { ...updates, updated_at: new Date().toISOString() }
        if (updates.name) {
          updateData.value = updates.name.toLowerCase().replace(/\s+/g, '-')
        }

        const { data, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const index = this.categories.findIndex(c => c.id === id)
        if (index !== -1 && data) {
          this.categories[index] = data
        }
        return data
      } catch (e: any) {
        this.error = e.message
        console.error('Error updating category:', e)
        throw e
      }
    },

    async deleteCategory(id: string) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)

        if (error) throw error

        this.categories = this.categories.filter(c => c.id !== id)
      } catch (e: any) {
        this.error = e.message
        console.error('Error deleting category:', e)
        throw e
      }
    },

    getCategoryByValue(value: string): Category | undefined {
      return this.categories.find(c => c.value === value)
    },

    getCategoryColor(value: string): string {
      const cat = this.getCategoryByValue(value)
      return cat?.color || 'bg-gray-500/20 text-gray-400'
    },

    getCategoryIcon(value: string): string {
      const cat = this.getCategoryByValue(value)
      return cat?.icon || ''
    },
  },
})
