import { defineStore } from 'pinia'
import { supabase } from '~/utils/supabase'
import { getLocalDateString } from '~/utils/date'

export interface Todo {
  id: string
  user_id?: string
  title: string
  description?: string
  date: string
  category?: string
  priority?: number
  recurrence?: string | null
  recurrence_days?: number[] | null
  created_at: string
  updated_at: string
}

export const useTodosStore = defineStore('todos', {
  state: () => ({
    todos: [] as Todo[],
    loading: false,
    error: null as string | null,
    _initialized: false,
  }),

  getters: {
    groupedTodos(state): Record<string, Todo[]> {
      const groups: Record<string, Todo[]> = {}
      state.todos.forEach(todo => {
        const date = todo.date
        if (!groups[date]) groups[date] = []
        groups[date].push(todo)
      })
      Object.keys(groups).forEach(date => {
        groups[date].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      })
      return groups
    },

    todayTodos(state): Todo[] {
      const today = getLocalDateString()
      const todayDow = new Date().getDay()
      return state.todos.filter(t => {
        if (t.date === today) return true
        if (t.recurrence === 'daily') return true
        if (t.recurrence === 'weekly') {
          return (t.recurrence_days || []).includes(todayDow)
        }
        return false
      })
    },
  },

  actions: {
    async fetchTodos() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('date', { ascending: false })
          .order('priority', { ascending: false })

        if (error) throw error
        this.todos = data || []
      } catch (e: any) {
        this.error = e.message
        console.error('Error fetching todos:', e)
      } finally {
        this.loading = false
      }
    },

    async init() {
      if (this._initialized) return
      this._initialized = true
      await this.fetchTodos()
    },

    async addTodo(
      title: string,
      date?: string,
      category?: string,
      recurrenceData?: { recurrence?: string | null; recurrence_days?: number[] | null },
    ) {
      const todoDate = date || getLocalDateString()
      try {
        const { data, error } = await supabase
          .from('todos')
          .insert({
            title,
            date: todoDate,
            category,
            ...(recurrenceData || {}),
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          this.todos.unshift(data)
        }
        return data
      } catch (e: any) {
        this.error = e.message
        console.error('Error adding todo:', e)
        throw e
      }
    },

    async updateTodo(id: string, updates: Partial<Todo>) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const index = this.todos.findIndex(t => t.id === id)
        if (index !== -1 && data) {
          this.todos[index] = data
        }
        return data
      } catch (e: any) {
        this.error = e.message
        console.error('Error updating todo:', e)
        throw e
      }
    },

    async deleteTodo(id: string) {
      try {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id)

        if (error) throw error

        this.todos = this.todos.filter(t => t.id !== id)
      } catch (e: any) {
        this.error = e.message
        console.error('Error deleting todo:', e)
        throw e
      }
    },

    getTodosByDate(date: string) {
      return this.todos.filter(t => t.date === date)
    },
  },
})
