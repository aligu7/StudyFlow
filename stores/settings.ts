import { defineStore } from 'pinia'
import { supabase } from '~/utils/supabase'

export interface ChartVisibleDatasets {
  sessions: boolean
  focus: boolean
}

export interface Settings {
  timer_duration: { work: number; break: number }
  theme: 'light' | 'dark'
  sound_enabled: boolean
  pin_code: string | null
  chart_visible_datasets: ChartVisibleDatasets
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      timer_duration: { work: 25, break: 5 },
      theme: 'dark',
      sound_enabled: true,
      pin_code: null,
      chart_visible_datasets: { sessions: true, focus: true },
    } as Settings,
    loading: false,
    _initialized: false,
  }),

  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')

        if (error) throw error

        ;(data || []).forEach((item: any) => {
          // Handle previously double-encoded values (JSON.stringify'd into JSONB)
          let val = item.value
          if (typeof val === 'string') {
            try { val = JSON.parse(val) } catch {}
          }

          if (item.key === 'timer_duration') {
            this.settings.timer_duration = val
          } else if (item.key === 'theme') {
            this.settings.theme = val
          } else if (item.key === 'sound_enabled') {
            this.settings.sound_enabled = val
          } else if (item.key === 'pin_code') {
            this.settings.pin_code = val
          } else if (item.key === 'chart_visible_datasets') {
            this.settings.chart_visible_datasets = val
          }
        })

        if (typeof document !== 'undefined') {
          this.applyTheme(this.settings.theme)
        }
      } catch (e) {
        console.error('Error fetching settings:', e)
      } finally {
        this.loading = false
      }
    },

    async init() {
      if (this._initialized) return
      this._initialized = true
      await this.fetchSettings()
    },

    async updateSetting(key: keyof Settings, value: any) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert(
            {
              key,
              value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,key' },
          )

        if (error) throw error

        ;(this.settings as any)[key] = value

        if (key === 'theme') {
          this.applyTheme(value)
        }
      } catch (e) {
        console.error('Error updating setting:', e)
        throw e
      }
    },

    applyTheme(theme: 'light' | 'dark') {
      if (typeof document === 'undefined') return
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },

    toggleTheme() {
      const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark'
      this.updateSetting('theme', newTheme)
    },
  },
})
