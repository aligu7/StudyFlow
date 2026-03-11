-- StudyFlow Database Schema for Supabase with RLS
-- Run this SQL in your Supabase project's SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    category TEXT,
    priority INTEGER DEFAULT 0,
    recurrence TEXT,
    recurrence_days INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timer sessions table
CREATE TABLE IF NOT EXISTS timer_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_elapsed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (per user)
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    key TEXT NOT NULL,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, key)
);

-- Daily goals table
CREATE TABLE IF NOT EXISTS daily_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_todos INTEGER DEFAULT 5,
    completed_todos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID DEFAULT auth.uid() NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT DEFAULT '',
    color TEXT DEFAULT 'bg-gray-500/20 text-gray-400',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, value)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_todo_id ON timer_sessions(todo_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos
CREATE POLICY "Users can select their own todos" ON todos FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own todos" ON todos FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own todos" ON todos FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own todos" ON todos FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for timer_sessions
CREATE POLICY "Users can select their own sessions" ON timer_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own sessions" ON timer_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own sessions" ON timer_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own sessions" ON timer_sessions FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for settings
CREATE POLICY "Users can select their own settings" ON settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own settings" ON settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own settings" ON settings FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for daily_goals
CREATE POLICY "Users can select their own goals" ON daily_goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own goals" ON daily_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own goals" ON daily_goals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own goals" ON daily_goals FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for categories
CREATE POLICY "Users can select their own categories" ON categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (user_id = auth.uid());

-- Create a view for daily stats (per user)
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
    user_id,
    date,
    COUNT(*) as total_todos,
    COUNT(*) FILTER (WHERE completed = true) as completed_todos,
    ROUND(COUNT(*) FILTER (WHERE completed = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as completion_rate
FROM todos
GROUP BY user_id, date
ORDER BY date DESC;

-- Create a view for weekly stats (per user)
CREATE OR REPLACE VIEW weekly_stats AS
SELECT 
    user_id,
    date_trunc('week', date) as week_start,
    COUNT(*) as total_todos,
    COUNT(*) FILTER (WHERE completed = true) as completed_todos,
    COALESCE(SUM(duration_seconds), 0) as total_seconds
FROM todos
LEFT JOIN timer_sessions ON todos.id = timer_sessions.todo_id
GROUP BY user_id, date_trunc('week', date)
ORDER BY week_start DESC;
