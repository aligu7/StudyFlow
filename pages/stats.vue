<template>
  <div class="p-6 lg:p-8 space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold">Statistics</h1>
      <p class="text-gray-400">Track your productivity progress</p>
    </div>

    <!-- Overview Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-timer" class="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div class="text-3xl font-bold">{{ statsStore.totalSessions }}</div>
        <div class="text-sm text-gray-400">Total Sessions</div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div class="text-3xl font-bold">{{ formatDuration(statsStore.totalTimeSpent) }}</div>
        <div class="text-sm text-gray-400">Total Focus Time</div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-flame" class="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <div class="text-3xl font-bold">{{ statsStore.currentStreak }}</div>
        <div class="text-sm text-gray-400">Day Streak</div>
      </div>
      
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <UIcon name="i-lucide-trophy" class="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div class="text-3xl font-bold">{{ statsStore.longestStreak }}</div>
        <div class="text-sm text-gray-400">Best Streak</div>
      </div>
    </div>

    <!-- Today's Summary -->
    <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h3 class="font-semibold mb-4">Today</h3>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-gray-800/50 rounded-xl p-4">
          <div class="text-2xl font-bold text-emerald-400">{{ todayStats.session_count }}</div>
          <div class="text-sm text-gray-400">Focus Sessions</div>
        </div>
        <div class="bg-gray-800/50 rounded-xl p-4">
          <div class="text-2xl font-bold text-cyan-400">{{ formatDuration(todayStats.focus_seconds) }}</div>
          <div class="text-sm text-gray-400">Focus Time</div>
        </div>
        <div class="bg-gray-800/50 rounded-xl p-4">
          <div class="text-2xl font-bold text-purple-400">{{ formatDuration(statsStore.averageDailyFocusTime) }}</div>
          <div class="text-sm text-gray-400">Avg Daily Focus</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Weekly Sessions & Focus Chart -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 class="font-semibold mb-4">This Week</h3>
        <div class="h-64">
          <Bar ref="barChartRef" :data="barChartData" :options="barOptions" />
        </div>
      </div>
      
      <!-- Average Daily Focus -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 class="font-semibold mb-4">Daily Focus Average</h3>
        <div class="h-64 flex items-center justify-center">
          <div class="relative">
            <Doughnut :data="focusGoalData" :options="doughnutOptions" />
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl font-bold text-emerald-400">{{ formatDuration(statsStore.averageDailyFocusTime) }}</div>
                <div class="text-sm text-gray-400">Avg / Day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- GitHub-style Activity Heatmap -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">Activity Heatmap</h3>
          <div class="flex items-center gap-2 text-sm text-gray-400">
            <span>Less</span>
            <div class="flex gap-1">
              <div class="w-3.5 h-3.5 rounded-sm bg-gray-800 border border-gray-700"></div>
              <div class="w-3.5 h-3.5 rounded-sm bg-emerald-900/80"></div>
              <div class="w-3.5 h-3.5 rounded-sm bg-emerald-700"></div>
              <div class="w-3.5 h-3.5 rounded-sm bg-emerald-500"></div>
              <div class="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
            </div>
            <span>More</span>
          </div>
        </div>

        <!-- Month labels -->
        <div class="flex" :style="{ paddingLeft: '36px' }">
          <div
            v-for="(month, idx) in heatmapMonths"
            :key="idx"
            class="text-xs text-gray-500"
            :style="{ width: month.width + 'px', minWidth: month.width + 'px' }"
          >
            {{ month.label }}
          </div>
        </div>

        <!-- Heatmap grid: weekday labels + squares -->
        <div ref="heatmapContainerRef" class="flex gap-1">
          <!-- Weekday labels -->
          <div class="flex flex-col gap-1 mr-0.5" :style="{ width: '28px', flexShrink: 0 }">
            <div v-for="(label, idx) in heatmapDayLabels" :key="idx" class="text-xs text-gray-500 flex items-center" :style="{ height: SQUARE_SIZE + 'px' }">
              {{ label }}
            </div>
          </div>

          <!-- Week columns -->
          <div class="flex gap-1 flex-1 overflow-hidden">
            <div v-for="(week, wIdx) in heatmapWeeks" :key="wIdx" class="flex flex-col gap-1">
              <div
                v-for="(day, dIdx) in week"
                :key="dIdx"
                class="rounded-sm transition-colors cursor-default"
                :class="day.empty ? 'bg-transparent' : getHeatmapColor(day.focus_seconds)"
                :style="{ width: SQUARE_SIZE + 'px', height: SQUARE_SIZE + 'px' }"
                @mouseenter="showHeatmapTooltip($event, day)"
                @mouseleave="hideHeatmapTooltip"
              ></div>
            </div>
          </div>
        </div>

        <!-- Custom tooltip -->
        <Teleport to="body">
          <div
            v-if="heatmapTooltip.visible"
            class="fixed z-50 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-sm pointer-events-none"
            :style="{ 
              left: heatmapTooltip.x + 'px', 
              top: heatmapTooltip.y + 'px',
              transform: 'translateY(-100%)',
              marginTop: '-8px',
              maxWidth: '280px' 
            }"
          >
            <div class="font-medium text-gray-200">{{ heatmapTooltip.date }}</div>
            <div class="text-gray-400 mt-0.5">{{ heatmapTooltip.focusText }}</div>
            <div class="text-gray-400">{{ heatmapTooltip.sessionText }}</div>
            
            <!-- Task breakdown -->
            <div v-if="heatmapTooltip.tasks.length > 0" class="mt-2 pt-2 border-t border-gray-700 space-y-1">
              <div
                v-for="task in heatmapTooltip.tasks"
                :key="task.todo_id"
                class="flex items-start justify-between gap-3 text-xs"
              >
                <span class="text-gray-300 truncate flex-1" :title="task.todo_title">
                  • {{ task.todo_title.length > 28 ? task.todo_title.substring(0, 28) + '...' : task.todo_title }}
                </span>
                <span class="text-emerald-400 font-medium whitespace-nowrap">
                  {{ formatDuration(task.seconds) }}
                </span>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">Recent Activity</h3>
        <div v-if="statsStore.recentActivity.length > 0">
          <button
            v-if="!confirmClearAll"
            @click="confirmClearAll = true"
            class="text-sm text-red-400/60 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
          <div v-else class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Are you sure?</span>
            <button
              @click="handleClearAll"
              :disabled="clearingAll"
              class="text-sm text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
            >
              {{ clearingAll ? 'Clearing...' : 'Yes' }}
            </button>
            <button
              @click="confirmClearAll = false"
              class="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              No
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <div
          v-for="activity in statsStore.recentActivity"
          :key="activity.id"
          class="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl group"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-500/20">
            <UIcon name="i-lucide-timer" class="w-5 h-5 text-cyan-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ activity.title }}</div>
            <div class="text-sm text-gray-400">{{ activity.description }}</div>
          </div>
          <div class="text-sm text-gray-500 flex-shrink-0">
            {{ formatRelativeTime(activity.date) }}
          </div>
          <button
            @click="handleRemoveActivity(activity)"
            :disabled="removing === activity.id"
            class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
          >
            <UIcon v-if="removing !== activity.id" name="i-lucide-x" class="w-4 h-4" />
            <UIcon v-else name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
          </button>
        </div>
        
        <div v-if="statsStore.recentActivity.length === 0" class="text-center py-8 text-gray-500">
          No recent activity
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js'
import { useStatsStore } from '~/stores/stats'
import { useSettingsStore } from '~/stores/settings'
import { formatDuration, getLocalDateString } from '~/utils/date'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const statsStore = useStatsStore()
const settingsStore = useSettingsStore()

const SQUARE_SIZE = 14
const SQUARE_GAP = 4 // gap-1 = 4px in Tailwind
const COL_WIDTH = SQUARE_SIZE + SQUARE_GAP
const LABEL_WIDTH = 32 // weekday labels column

const confirmClearAll = ref(false)
const clearingAll = ref(false)
const removing = ref<string | null>(null)
const barChartRef = ref<any>(null)
const heatmapContainerRef = ref<HTMLElement | null>(null)
const heatmapWeekCount = ref(52) // default, recalculated on mount

// Heatmap tooltip state
const heatmapTooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  focusText: '',
  sessionText: '',
  tasks: [] as { todo_title: string; seconds: number }[],
})

// Today's stats computed from dailyStats
const todayStats = computed(() => {
  const today = getLocalDateString()
  const stat = statsStore.dailyStats.find(s => s.date === today)
  return {
    focus_seconds: stat?.focus_seconds || 0,
    session_count: stat?.session_count || 0,
  }
})

// ─── Bar chart: Sessions + Focus minutes ───────────────────────────────

const barChartData = computed(() => {
  const data = statsStore.weeklyChartData
  return {
    labels: data.labels,
    datasets: [
      {
        label: 'Sessions',
        data: data.sessionData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
        barThickness: 20,
        hidden: !settingsStore.settings.chart_visible_datasets.sessions,
      },
      {
        label: 'Focus (hr)',
        data: data.focusData,
        backgroundColor: 'rgba(6, 182, 212, 0.6)',
        borderRadius: 8,
        barThickness: 20,
        hidden: !settingsStore.settings.chart_visible_datasets.focus,
      },
    ]
  }
})

// Default legend click handler from Chart.js
const defaultLegendClick = ChartJS.defaults.plugins.legend.onClick

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#9ca3af',
      },
      onClick(e: any, legendItem: any, legend: any) {
        // Call the default Chart.js toggle behavior first
        defaultLegendClick.call(legend, e, legendItem, legend)

        // Read the current visibility state from the chart instance
        const chart = legend.chart
        const sessionsVisible = chart.isDatasetVisible(0)
        const focusVisible = chart.isDatasetVisible(1)

        // Persist to Supabase
        settingsStore.updateSetting('chart_visible_datasets', {
          sessions: sessionsVisible,
          focus: focusVisible,
        })
      },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#e5e7eb',
      bodyColor: '#d1d5db',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      bodySpacing: 2,
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          
          if (label.includes('Focus')) {
            // Convert hours back to seconds for formatting
            const seconds = value * 3600
            return `${label}: ${formatDuration(seconds)}`
          }
          return `${label}: ${value}`
        },
        afterLabel: function(context: any) {
          // Only show task breakdown for Focus dataset
          if (!context.dataset.label.includes('Focus')) return []
          
          // Get the date index (which day of the week)
          const dateIndex = context.dataIndex
          const dates = statsStore.weeklyChartData.labels
          
          // Calculate the actual date for this day
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() - (6 - dateIndex))
          const dateStr = getLocalDateString(targetDate)
          
          // Find the stat for this day
          const dayStat = statsStore.dailyStats.find(s => s.date === dateStr)
          if (!dayStat || !dayStat.tasks || dayStat.tasks.length === 0) {
            return []
          }
          
          // Build compact task list (no empty line before)
          const lines: string[] = []
          dayStat.tasks.forEach(task => {
            const duration = formatDuration(task.seconds)
            // Truncate long task names
            const taskName = task.todo_title.length > 25 
              ? task.todo_title.substring(0, 25) + '...'
              : task.todo_title
            lines.push(`  • ${taskName}  ${duration}`)
          })
          
          return lines
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#9ca3af'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#9ca3af',
        stepSize: 0.5
      }
    }
  }
}

// ─── Doughnut: Average daily focus time ────────────────────────────────

const focusGoalData = computed(() => {
  const avgMinutes = Math.round(statsStore.averageDailyFocusTime / 60)
  const goalMinutes = 240 // 4 hours goal
  const percentage = Math.min(Math.round((avgMinutes / goalMinutes) * 100), 100)
  return {
    labels: ['Focus', 'Remaining'],
    datasets: [{
      data: [percentage, 100 - percentage],
      backgroundColor: ['#10b981', '#374151'],
      borderWidth: 0,
      cutout: '75%',
    }]
  }
})

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  }
}

// ─── GitHub-style Heatmap ──────────────────────────────────────────────

interface HeatmapDay {
  date: string
  focus_seconds: number
  session_count: number
  empty: boolean
}

// Build heatmap data as weeks (columns) of 7 days (rows)
const heatmapWeeks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate how many days back we need for heatmapWeekCount full columns
  const totalDays = heatmapWeekCount.value * 7
  const rawStart = new Date(today)
  rawStart.setDate(rawStart.getDate() - totalDays)
  // Align to the Sunday on or before rawStart
  const startDow = rawStart.getDay()
  const start = new Date(rawStart)
  start.setDate(start.getDate() - startDow)

  // Build a lookup map from dailyStats
  const statsMap = new Map<string, { focus_seconds: number; session_count: number }>()
  statsStore.dailyStats.forEach(s => {
    statsMap.set(s.date, { focus_seconds: s.focus_seconds, session_count: s.session_count })
  })

  const weeks: HeatmapDay[][] = []
  const current = new Date(start)

  while (current <= today) {
    const week: HeatmapDay[] = []
    for (let d = 0; d < 7; d++) {
      if (current > today) {
        week.push({ date: '', focus_seconds: 0, session_count: 0, empty: true })
      } else {
        const dateStr = getLocalDateString(current)
        const stat = statsMap.get(dateStr)
        week.push({
          date: dateStr,
          focus_seconds: stat?.focus_seconds || 0,
          session_count: stat?.session_count || 0,
          empty: false,
        })
      }
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
})

// Month labels positioned above the week columns
const heatmapMonths = computed(() => {
  const weeks = heatmapWeeks.value
  if (weeks.length === 0) return []

  const squareSize = SQUARE_SIZE
  const gap = SQUARE_GAP
  const colWidth = squareSize + gap

  const months: { label: string; width: number }[] = []
  let currentMonth = -1
  let currentWidth = 0

  weeks.forEach((week) => {
    // Use the first non-empty day in the week to determine the month
    const firstDay = week.find(d => !d.empty)
    if (!firstDay) return

    const parts = firstDay.date.split('-')
    const month = parseInt(parts[1])

    if (month !== currentMonth) {
      if (currentMonth !== -1) {
        months.push({
          label: new Date(parseInt(parts[0]), currentMonth - 1, 1).toLocaleString('en-US', { month: 'short' }),
          width: currentWidth,
        })
      }
      currentMonth = month
      currentWidth = colWidth
    } else {
      currentWidth += colWidth
    }
  })

  // Push the last month
  if (currentMonth !== -1) {
    const lastWeek = weeks[weeks.length - 1]
    const lastDay = lastWeek.find(d => !d.empty)
    if (lastDay) {
      const parts = lastDay.date.split('-')
      months.push({
        label: new Date(parseInt(parts[0]), currentMonth - 1, 1).toLocaleString('en-US', { month: 'short' }),
        width: currentWidth,
      })
    }
  }

  return months
})

// Day labels for rows: show Mon, Wed, Fri (indices 1, 3, 5 in Sun-based week)
const heatmapDayLabels = computed(() => {
  // Rows: Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6)
  return ['', 'Mon', '', 'Wed', '', 'Fri', '']
})

// Color based on focus_seconds (not session count) for more meaningful heatmap
const getHeatmapColor = (focusSeconds: number) => {
  if (focusSeconds === 0) return 'bg-gray-800 border border-gray-700/50'
  const minutes = focusSeconds / 60
  if (minutes < 15) return 'bg-emerald-900/80'
  if (minutes < 45) return 'bg-emerald-700'
  if (minutes < 90) return 'bg-emerald-500'
  return 'bg-emerald-400'
}

const TOOLTIP_WIDTH = 280

const showHeatmapTooltip = (event: MouseEvent, day: HeatmapDay) => {
  if (day.empty) return

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const viewportWidth = window.innerWidth
  
  // Center tooltip above the square, but clamp to viewport edges
  let x = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
  if (x < 8) x = 8
  if (x + TOOLTIP_WIDTH > viewportWidth - 8) x = viewportWidth - TOOLTIP_WIDTH - 8
  
  heatmapTooltip.x = x
  heatmapTooltip.y = rect.top

  // Format the date nicely
  const parts = day.date.split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  heatmapTooltip.date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  // Format focus time
  if (day.focus_seconds === 0) {
    heatmapTooltip.focusText = 'No focus time'
  } else {
    const hours = Math.floor(day.focus_seconds / 3600)
    const mins = Math.floor((day.focus_seconds % 3600) / 60)
    heatmapTooltip.focusText = hours > 0 ? `${hours}h ${mins}m focus time` : `${mins}m focus time`
  }

  heatmapTooltip.sessionText = day.session_count === 0
    ? 'No sessions'
    : `${day.session_count} session${day.session_count !== 1 ? 's' : ''}`

  // Get task breakdown for this day
  const dayStat = statsStore.dailyStats.find(s => s.date === day.date)
  heatmapTooltip.tasks = dayStat?.tasks || []

  heatmapTooltip.visible = true
}

const hideHeatmapTooltip = () => {
  heatmapTooltip.visible = false
}

// ─── Helpers ───────────────────────────────────────────────────────────

const formatRelativeTime = (date: string) => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Remove a single activity item
const handleRemoveActivity = async (activity: any) => {
  removing.value = activity.id
  try {
    await statsStore.removeActivity(activity)
  } finally {
    removing.value = null
  }
}

// Clear all visible activity items
const handleClearAll = async () => {
  clearingAll.value = true
  try {
    await statsStore.clearAllActivity()
  } finally {
    clearingAll.value = false
    confirmClearAll.value = false
  }
}

onMounted(async () => {
  // Ensure settings are loaded (for chart visibility prefs)
  await settingsStore.init()

  // Dynamically calculate how many weeks fit in the heatmap container
  await nextTick()
  if (heatmapContainerRef.value) {
    const containerWidth = heatmapContainerRef.value.clientWidth - LABEL_WIDTH - 8 // subtract labels + margin
    const weeks = Math.floor(containerWidth / COL_WIDTH)
    heatmapWeekCount.value = Math.max(weeks, 20) // minimum 20 weeks
  }

  const daysNeeded = heatmapWeekCount.value * 7 + 14 // extra buffer for alignment
  await Promise.all([
    statsStore.fetchDailyStats(daysNeeded),
    statsStore.fetchWeeklyStats(12),
  ])
  await statsStore.fetchRecentSessions()
})
</script>
