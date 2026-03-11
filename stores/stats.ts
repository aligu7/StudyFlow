import { defineStore } from 'pinia'
import { useSupabase } from '~/utils/supabase'
import { getLocalDateString, splitSessionAcrossDays, formatDuration } from '~/utils/date'

const supabase = useSupabase()

export interface TaskBreakdown {
  todo_id: string
  todo_title: string
  seconds: number
}

export interface DailyStat {
  date: string
  focus_seconds: number
  session_count: number
  tasks: TaskBreakdown[]
}

export interface WeeklyStat {
  week_start: string
  total_seconds: number
  session_count: number
}

export const useStatsStore = defineStore('stats', {
  state: () => ({
    loading: false,
    error: null as string | null,
    dailyStats: [] as DailyStat[],
    weeklyStats: [] as WeeklyStat[],
    timerSessions: [] as any[],
  }),

  getters: {
    totalSessions(state): number {
      return state.dailyStats.reduce((acc, s) => acc + s.session_count, 0)
    },

    totalTimeSpent(state): number {
      return state.dailyStats.reduce((acc, s) => acc + s.focus_seconds, 0)
    },

    currentStreak(state): number {
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = getLocalDateString(checkDate)

        const dayStat = state.dailyStats.find(s => s.date === dateStr)

        if (dayStat && dayStat.session_count > 0) {
          streak++
        } else if (i > 0) {
          break
        }
      }

      return streak
    },

    longestStreak(state): number {
      let longest = 0
      let current = 0

      const sorted = [...state.dailyStats].sort((a, b) => a.date.localeCompare(b.date))

      sorted.forEach(day => {
        if (day.session_count > 0) {
          current++
          longest = Math.max(longest, current)
        } else {
          current = 0
        }
      })

      return longest
    },

    averageDailyFocusTime(state): number {
      const daysWithSessions = state.dailyStats.filter(s => s.session_count > 0)
      if (daysWithSessions.length === 0) return 0
      const totalSeconds = daysWithSessions.reduce((acc, s) => acc + s.focus_seconds, 0)
      return Math.round(totalSeconds / daysWithSessions.length)
    },

    weeklyChartData(state) {
      const last7Days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last7Days.push(getLocalDateString(date))
      }

      return {
        labels: last7Days.map(d => {
          const parts = d.split('-')
          const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          return date.toLocaleDateString('en-US', { weekday: 'short' })
        }),
        // Return hours (with 0.5 precision) instead of minutes
        focusData: last7Days.map(date => {
          const stat = state.dailyStats.find(s => s.date === date)
          return Math.round((stat?.focus_seconds || 0) / 1800) * 0.5 // 1800s = 0.5h
        }),
        sessionData: last7Days.map(date => {
          const stat = state.dailyStats.find(s => s.date === date)
          return stat?.session_count || 0
        }),
      }
    },

    todayFocusTime(state): number {
      const today = getLocalDateString()
      const stat = state.dailyStats.find(s => s.date === today)
      return stat?.focus_seconds || 0
    },

    todaySessionCount(state): number {
      const today = getLocalDateString()
      const stat = state.dailyStats.find(s => s.date === today)
      return stat?.session_count || 0
    },

    recentActivity(state) {
      const activities: any[] = []

      // Timer sessions only — no more completed-todo activities
      state.timerSessions
        .slice(0, 10)
        .forEach(s => {
          activities.push({
            id: `session-${s.id}`,
            type: 'session',
            title: s.todo_title || 'Focus session',
            description: `Studied for ${formatDuration(s.duration_seconds || 0)}`,
            date: s.ended_at,
          })
        })

      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8)
    },
  },

  actions: {
    async fetchDailyStats(days: number = 30) {
      this.loading = true
      this.error = null

      try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        const startDateStr = getLocalDateString(startDate)

        // Fetch sessions with todo information for task breakdown
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('started_at, ended_at, duration_seconds, todo_id, todos(id, title)')
          .gte('ended_at', `${startDateStr}T00:00:00`)
          .not('ended_at', 'is', null)

        if (error) throw error

        const stats: Record<string, DailyStat> = {}

        const ensureDate = (date: string) => {
          if (!stats[date]) {
            stats[date] = {
              date,
              focus_seconds: 0,
              session_count: 0,
              tasks: [],
            }
          }
        }

        ;(data || []).forEach((session: any) => {
          const duration = session.duration_seconds || 0
          if (duration <= 0) return

          const todoTitle = session.todos?.title || 'Unknown Task'
          const todoId = session.todo_id

          // Split this session's seconds across the days it spans
          const daySplit = splitSessionAcrossDays(
            session.started_at,
            session.ended_at,
            duration,
          )

          for (const [dateStr, seconds] of Object.entries(daySplit) as [string, number][]) {
            ensureDate(dateStr)
            stats[dateStr].focus_seconds += seconds

            // Add or update task breakdown for this day
            const existingTask = stats[dateStr].tasks.find(t => t.todo_id === todoId)
            if (existingTask) {
              existingTask.seconds += seconds
            } else {
              stats[dateStr].tasks.push({
                todo_id: todoId,
                todo_title: todoTitle,
                seconds,
              })
            }
          }

          // Session count goes to the day the session ended
          const endDate = getLocalDateString(new Date(session.ended_at))
          ensureDate(endDate)
          stats[endDate].session_count++
        })

        // Sort tasks by duration (descending) for each day
        Object.values(stats).forEach(stat => {
          stat.tasks.sort((a, b) => b.seconds - a.seconds)
        })

        this.dailyStats = Object.values(stats).sort((a, b) =>
          b.date.localeCompare(a.date),
        )
      } catch (e: any) {
        this.error = e.message
        console.error('Error fetching daily stats:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchWeeklyStats(weeks: number = 12) {
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('started_at, ended_at, duration_seconds')
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })

        if (error) throw error

        const stats: Record<string, WeeklyStat> = {}

        ;(data || []).forEach((session: any) => {
          const duration = session.duration_seconds || 0
          if (duration <= 0) return

          // Split this session's seconds across the days it spans
          const daySplit = splitSessionAcrossDays(
            session.started_at,
            session.ended_at,
            duration,
          )

          // Now attribute each day's portion to its corresponding week
          for (const [dateStr, seconds] of Object.entries(daySplit) as [string, number][]) {
            const parts = dateStr.split('-')
            const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
            const weekStart = new Date(date)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            const weekKey = getLocalDateString(weekStart)

            if (!stats[weekKey]) {
              stats[weekKey] = {
                week_start: weekKey,
                total_seconds: 0,
                session_count: 0,
              }
            }
            stats[weekKey].total_seconds += seconds
          }

          // Session count goes to the week the session ended
          const endDate = new Date(session.ended_at)
          const endWeekStart = new Date(endDate)
          endWeekStart.setDate(endWeekStart.getDate() - endWeekStart.getDay())
          const endWeekKey = getLocalDateString(endWeekStart)
          if (!stats[endWeekKey]) {
            stats[endWeekKey] = {
              week_start: endWeekKey,
              total_seconds: 0,
              session_count: 0,
            }
          }
          stats[endWeekKey].session_count++
        })

        this.weeklyStats = Object.values(stats)
          .sort((a, b) => b.week_start.localeCompare(a.week_start))
          .slice(0, weeks)
      } catch (e: any) {
        this.error = e.message
        console.error('Error fetching weekly stats:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchRecentSessions() {
      const { useTodosStore } = await import('./todos')
      const todosStore = useTodosStore()
      try {
        const { data, error } = await supabase
          .from('timer_sessions')
          .select('id, ended_at, duration_seconds, todo_id')
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })
          .limit(10)

        if (error) throw error

        this.timerSessions = (data || []).map(s => {
          const todo = todosStore.todos.find(t => t.id === s.todo_id)
          return {
            ...s,
            todo_title: todo?.title || 'Focus session',
          }
        })
      } catch (e) {
        console.error('Error fetching recent sessions:', e)
      }
    },

    async removeActivity(activity: any) {
      try {
        if (activity.type === 'session') {
          const sessionId = activity.id.replace('session-', '')
          await supabase.from('timer_sessions').delete().eq('id', sessionId)
          this.timerSessions = this.timerSessions.filter(s => s.id !== sessionId)
        }
        await this.fetchDailyStats(170)
      } catch (e) {
        console.error('Error removing activity:', e)
      }
    },

    async clearAllActivity() {
      const sessionIds: string[] = []

      this.recentActivity.forEach((a: any) => {
        if (a.type === 'session') {
          sessionIds.push(a.id.replace('session-', ''))
        }
      })

      if (sessionIds.length > 0) {
        await supabase.from('timer_sessions').delete().in('id', sessionIds)
        this.timerSessions = this.timerSessions.filter(s => !sessionIds.includes(s.id))
      }

      await this.fetchDailyStats(170)
    },
  },
})
