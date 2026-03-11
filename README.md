# StudyFlow - Your Personal Productivity Companion

A modern, fast productivity app for studying and working built with Nuxt 3, Nuxt UI, and Supabase.

## Features

### Core Features
- **Daily Todo Cards**: Organize tasks by day with beautiful card layouts
- **Focus Timer**: Integrated timer with todo selection
- **Progress Statistics**: Charts and analytics for your productivity
- **Supabase Backend**: All data stored in your Supabase database

### Extra Features
- **Pomodoro Mode**: Built-in Pomodoro timer
- **Keyboard Shortcuts**: Press T for timer, D for dashboard, S for stats
- **Quick Timer**: Always visible timer in sidebar
- **Categories**: Organize tasks with categories (Study, Work, Personal, etc.)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Supabase account

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and run it
4. Go to **Project Settings > API**
5. Copy your **Project URL** and **anon public key**

### 2. Configure Environment

Edit `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies

```bash
cd studyflow
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### 5. Build for Production

```bash
pnpm build
```

Then run the production build:

```bash
node .output/server/index.mjs
```

## Project Structure

```
studyflow/
├── pages/
│   ├── index.vue       # Dashboard
│   ├── todos.vue       # Todo cards page
│   ├── timer.vue       # Timer page
│   ├── stats.vue       # Statistics & charts
│   └── settings.vue    # App settings
├── composables/
│   ├── useTodos.ts     # Todo management
│   ├── useTimer.ts     # Timer functionality
│   ├── useStats.ts     # Statistics & analytics
│   ├── useSettings.ts  # App settings
│   └── useAuth.ts      # Authentication
├── layouts/
│   └── default.vue     # Main layout with sidebar
├── utils/
│   └── supabase.ts    # Supabase client
└── supabase-schema.sql # Database schema
```

## Keyboard Shortcuts

- `T` - Go to Timer page
- `D` - Go to Dashboard
- `S` - Go to Statistics

## Tech Stack

- **Framework**: Nuxt 3
- **UI Library**: Nuxt UI 3
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js + vue-chartjs
- **Icons**: Lucide Icons
