import { defineStore } from 'pinia'
import { useSupabase } from '~/utils/supabase'
import { getLocalTodayStart, getLocalTodayEnd, getLocalDateString, splitSessionAcrossDays } from '~/utils/date'
import type { Todo } from './todos'

const supabase = useSupabase()

export interface TimerSession {
  id: string
  todo_id: string
  started_at: string
  ended_at?: string
  duration_seconds: number
  is_paused: boolean
  paused_elapsed: number
}

// Keep interval outside the store — Pinia state must be serializable
let intervalId: ReturnType<typeof setInterval> | null = null

export const useTimerStore = defineStore('timer', {
  state: () => ({
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    selectedTodo: null as Todo | null,
    sessionStart: null as string | null,
    currentSessionId: null as string | null,
    todaySessions: 0,
    todayStudyTime: 0,
    _initialized: false,
  }),

  getters: {
    formattedTime(state) {
      const hours = Math.floor(state.currentTime / 3600)
      const minutes = Math.floor((state.currentTime % 3600) / 60)
      const seconds = state.currentTime % 60

      return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        display: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      }
    },
  },

  actions: {
    // ── Start a new timer session ──────────────────────────────
    async startTimer(todo?: Todo) {
      if (todo) {
        this.selectedTodo = todo
      }

      if (!this.selectedTodo) {
        throw new Error('Please select a todo first')
      }

      const now = new Date().toISOString()
      this.isRunning = true
      this.isPaused = false
      this.sessionStart = now

      // Create session record in Supabase with active state
      try {
        const { data, error } = await supabase
          .from('timer_sessions')
          .insert({
            todo_id: this.selectedTodo.id,
            started_at: now,
            is_paused: false,
            paused_elapsed: 0,
          })
          .select()
          .single()

        if (error) throw error
        this.currentSessionId = data?.id || null
      } catch (e) {
        console.error('Error creating session:', e)
      }

      this._startTicking()
    },

    // ── Pause ──────────────────────────────────────────────────
    async pauseTimer() {
      this._stopTicking()
      this.isPaused = true
      this.isRunning = false

      // Persist paused state + accumulated seconds to DB
      if (this.currentSessionId) {
        try {
          await supabase
            .from('timer_sessions')
            .update({
              is_paused: true,
              paused_elapsed: this.currentTime,
            })
            .eq('id', this.currentSessionId)
        } catch (e) {
          console.error('Error persisting pause state:', e)
        }
      }
    },

    // ── Resume from pause ──────────────────────────────────────
    async resumeTimer() {
      this.isPaused = false
      this.isRunning = true

      // Update DB: store new started_at anchor + clear paused flag
      // New anchor = now - paused_elapsed, so elapsed calc stays correct
      const newAnchor = new Date(Date.now() - this.currentTime * 1000).toISOString()
      this.sessionStart = newAnchor

      if (this.currentSessionId) {
        try {
          await supabase
            .from('timer_sessions')
            .update({
              is_paused: false,
              paused_elapsed: this.currentTime,
              started_at: newAnchor,
            })
            .eq('id', this.currentSessionId)
        } catch (e) {
          console.error('Error persisting resume state:', e)
        }
      }

      this._startTicking()
    },

    // ── Stop and finalize session ──────────────────────────────
    async stopTimer() {
      this._stopTicking()
      const finalTime = this.currentTime

      // Save completed session to database
      if (this.currentSessionId) {
        try {
          await supabase
            .from('timer_sessions')
            .update({
              ended_at: new Date().toISOString(),
              duration_seconds: finalTime,
              is_paused: false,
              paused_elapsed: 0,
            })
            .eq('id', this.currentSessionId)
        } catch (e) {
          console.error('Error saving session:', e)
        }
      }

      // Update today's stats locally
      if (finalTime > 0) {
        this.todaySessions++
        this.todayStudyTime += finalTime
      }

      this.isRunning = false
      this.isPaused = false
      this.currentTime = 0
      this.currentSessionId = null
      this.sessionStart = null

      return finalTime
    },

    // ── Reset (discard without saving) ─────────────────────────
    async resetTimer() {
      this._stopTicking()

      // Delete the active session from DB since user discarded it
      if (this.currentSessionId) {
        try {
          await supabase
            .from('timer_sessions')
            .delete()
            .eq('id', this.currentSessionId)
        } catch (e) {
          console.error('Error deleting session:', e)
        }
      }

      this.isRunning = false
      this.isPaused = false
      this.currentTime = 0
      this.currentSessionId = null
      this.sessionStart = null
    },

    selectTodo(todo: Todo) {
      this.selectedTodo = todo
    },

    async getTodoTime(todoId: string) {
      try {
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('duration_seconds')
          .eq('todo_id', todoId)
          .not('ended_at', 'is', null)

        if (error) throw error

        return (data || []).reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
      } catch (e) {
        console.error('Error getting todo time:', e)
        return 0
      }
    },

    async loadTodayStats() {
      try {
        // Fetch sessions that overlap with today:
        // started before end of today AND ended after start of today
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('started_at, ended_at, duration_seconds')
          .lte('started_at', getLocalTodayEnd())
          .gte('ended_at', getLocalTodayStart())
          .not('ended_at', 'is', null)

        if (error) throw error

        const sessions = data || []
        const today = getLocalDateString()

        let todaySeconds = 0
        let todayCount = 0

        sessions.forEach((session: any) => {
          const duration = session.duration_seconds || 0
          if (duration <= 0) return

          // Split across days and only take today's portion
          const daySplit = splitSessionAcrossDays(
            session.started_at,
            session.ended_at,
            duration,
          )

          if (daySplit[today]) {
            todaySeconds += daySplit[today]
          }

          // Count session if it ended today
          const endDate = getLocalDateString(new Date(session.ended_at))
          if (endDate === today) {
            todayCount++
          }
        })

        this.todaySessions = todayCount
        this.todayStudyTime = todaySeconds
      } catch (e) {
        console.error('Error loading today stats:', e)
      }
    },

    // ── Restore active session on page load / refresh ──────────
    async _restoreActiveSession() {
      try {
        // Find any session that hasn't ended (still active)
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('*, todos(id, title, description, date, category, priority)')
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (!data) return // No active session — nothing to restore

        // Staleness check: if the session is older than MAX_SESSION_AGE,
        // it's an orphan from a crash/closed tab — auto-close it
        const MAX_SESSION_AGE = 12 * 60 * 60 // 12 hours in seconds
        const startedAt = new Date(data.started_at).getTime()
        const ageSeconds = Math.floor((Date.now() - startedAt) / 1000)

        if (ageSeconds > MAX_SESSION_AGE) {
          await this._closeOrphanedSessions()
          return
        }

        // For paused sessions, also check if paused_elapsed is unreasonably large
        // (shouldn't exceed the age of the session)
        if (data.is_paused && (data.paused_elapsed || 0) > MAX_SESSION_AGE) {
          await this._closeOrphanedSessions()
          return
        }

        this.currentSessionId = data.id
        this.sessionStart = data.started_at

        // Restore the linked todo
        if (data.todos) {
          this.selectedTodo = data.todos as unknown as Todo
        }

        if (data.is_paused) {
          // Session was paused — restore from saved elapsed time
          this.isPaused = true
          this.isRunning = false
          this.currentTime = data.paused_elapsed || 0
        } else {
          // Session is running — compute elapsed from started_at anchor
          const elapsed = Math.floor((Date.now() - startedAt) / 1000)
          this.currentTime = Math.max(elapsed, 0)
          this.isRunning = true
          this.isPaused = false
          this._startTicking()
        }
      } catch (e) {
        console.error('Error restoring active session:', e)
      }
    },

    // ── Close all orphaned sessions (ended_at IS NULL) ─────────
    async _closeOrphanedSessions() {
      try {
        await supabase
          .from('timer_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: 0,
            is_paused: false,
            paused_elapsed: 0,
          })
          .is('ended_at', null)
      } catch (e) {
        console.error('Error closing orphaned sessions:', e)
      }
    },

    // ── Internal: start the 1s tick interval ───────────────────
    _startTicking() {
      if (intervalId) {
        clearInterval(intervalId)
      }
      intervalId = setInterval(() => {
        this.currentTime++
      }, 1000)
    },

    // ── Internal: stop the tick interval ───────────────────────
    _stopTicking() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },

    // ── Init (called once from layout) ─────────────────────────
    async init() {
      if (this._initialized) return
      this._initialized = true
      // Restore any active session first, then load today's completed stats
      await this._restoreActiveSession()
      await this.loadTodayStats()
    },
  },
})
