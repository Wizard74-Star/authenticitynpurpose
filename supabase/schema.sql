-- =============================================================================
-- Goals App - Supabase (PostgreSQL) Schema (single file)
-- =============================================================================
-- This file is the only SQL file: full schema plus all migrations in one place.
-- (Previously separate files: apply_manifestation_schema.sql, migrations/*.sql
--  have been consolidated here and removed.)
--
-- Contents: core tables, forum, subscriptions, manifestation goals/todos,
-- goal_notes (with phase), invite_codes, admins, calendar_events, progress_photos,
-- and idempotent ALTERs for existing databases.
--
-- How to run:
--   1. Open your Supabase project → SQL Editor.
--   2. Paste this entire file and click "Run".
--   3. Auth is handled by Supabase Auth (auth.users). All app data is in public.
--
-- Storage (create in Dashboard → Storage):
--   - Bucket "progress-photos" (public) for progress photos.
--   - Bucket "construction-receipts" (optional) for expense receipts.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- For admin user seed: password hashing (crypt / gen_salt)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CORE USER DATA (goals, habits, journal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  progress integer NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  mood integer CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. FORUM (categories, threads, replies, upvotes)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.forum_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.thread_upvotes (
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.forum_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community connection board with location + interest matching and moderation pipeline
CREATE TABLE IF NOT EXISTS public.connection_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  location text NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'removed')),
  moderation_reason text,
  removed_at timestamptz,
  removed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.connection_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES public.connection_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id uuid REFERENCES public.connection_replies(id) ON DELETE CASCADE,
  content text NOT NULL,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'removed')),
  moderation_reason text,
  removed_at timestamptz,
  removed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.connection_user_moderation (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  strike_count integer NOT NULL DEFAULT 0 CHECK (strike_count >= 0),
  is_removed boolean NOT NULL DEFAULT false,
  removal_reason text,
  removed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.connection_moderation_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_table text NOT NULL CHECK (target_table IN ('connection_posts', 'connection_replies', 'connection_user_moderation')),
  target_id uuid,
  action text NOT NULL CHECK (action IN ('approved', 'removed', 'strike_added', 'user_removed')),
  reason text,
  acted_by uuid REFERENCES auth.users(id),
  acted_on_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. SUBSCRIPTIONS (Stripe payment integration - monthly & annual plans)
-- =============================================================================
-- Populated by Stripe webhooks (api/webhooks) from events:
--   customer.subscription.created, customer.subscription.updated,
--   customer.subscription.deleted, invoice.payment_failed
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'trialing', 'canceled', 'past_due', 'unpaid',
    'incomplete', 'incomplete_expired', 'paused'
  )),
  plan_name text,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_price_id text,
  trial_start bigint,
  trial_end bigint,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean DEFAULT false,
  plan_amount integer,
  plan_currency text,
  plan_interval text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Indexes for Stripe webhook and customer lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- =============================================================================
-- 3b. INVITE CODES (single-use or multi-use; redeem for lifetime access)
-- =============================================================================
-- Codes are created by admins (see public.admins). uses_remaining = 1 for
-- single-use; once used, the code is invalid. created_by set when generated.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  label text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_lifetime boolean NOT NULL DEFAULT true,
  uses_remaining integer,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invite_code_redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code_id uuid NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invite_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_assigned_to ON public.invite_codes(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invite_code_redemptions_invite_code_id ON public.invite_code_redemptions(invite_code_id);

-- =============================================================================
-- 3c. ADMINS (who can access /admin and create invite codes)
-- =============================================================================
-- Admin list is in public.admins; the login account is seeded below in auth.users.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- Seed default admin email (who can access /admin)
INSERT INTO public.admins (email) VALUES ('admin@gad.com')
ON CONFLICT (email) DO NOTHING;

-- Seed admin auth user (admin@gad.com / PaulandLucas) so admin can log in without creating in Dashboard.
-- Only runs if no user with this email exists. Requires pgcrypto (enabled above).
DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gad.com') THEN
    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt('PaulandLucas', gen_salt('bf'));

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@gad.com',
      v_encrypted_pw,
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_user_id,
      format('{"sub": "%s", "email": "admin@gad.com"}', v_user_id)::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- Fix existing auth.users rows with NULL token columns (avoids 500 on signInWithPassword)
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE email = 'admin@gad.com'
  AND (confirmation_token IS NULL OR recovery_token IS NULL OR email_change_token_new IS NULL OR email_change IS NULL);

-- =============================================================================
-- 3d. PROFILES (display name, timezone — used by Settings and TimezoneContext)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  timezone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 4. REMINDERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reminder_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  goal_deadline_enabled boolean NOT NULL DEFAULT true,
  goal_deadline_timing integer NOT NULL DEFAULT 24,
  habit_checkin_enabled boolean NOT NULL DEFAULT true,
  habit_checkin_time time NOT NULL DEFAULT '09:00:00',
  family_activity_enabled boolean NOT NULL DEFAULT true,
  family_activity_timing integer NOT NULL DEFAULT 2,
  smart_reminders_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT true,
  email_address text DEFAULT '',
  fcm_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('goal_deadline', 'habit_checkin', 'family_activity', 'smart_reminder', 'event_reminder')),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('goal', 'habit', 'family_goal', 'family_activity', 'calendar_event')),
  reminder_time timestamptz NOT NULL,
  channels text[] DEFAULT '{}',
  frequency text,
  message text NOT NULL,
  is_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. GOAL COLLABORATION (collaborators, invitations, activity, tasks, comments, likes)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.goal_collaborators (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  email text,
  name text,
  UNIQUE (goal_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.goal_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_email text DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goal_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, user_id)
);

-- =============================================================================
-- 6. ONBOARDING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  step_1_set_goal boolean NOT NULL DEFAULT false,
  step_2_create_task boolean NOT NULL DEFAULT false,
  step_3_habit_checkin boolean NOT NULL DEFAULT false,
  step_4_explore_analytics boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. VIDEO CALLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.video_calls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  room_id text NOT NULL,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_call_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id uuid NOT NULL REFERENCES public.video_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. WHITEBOARD
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.whiteboard_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Whiteboard Session',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whiteboard_elements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.whiteboard_sessions(id) ON DELETE CASCADE,
  element_type text NOT NULL,
  element_data jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. COLLABORATION MESSAGES & TEAM ACTIVITY
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.collaboration_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 10. FAMILY GROUPS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.family_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  email text,
  UNIQUE (family_group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.family_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value integer NOT NULL DEFAULT 100,
  current_value integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'points',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  points integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assigned_name text,
  completed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text DEFAULT 'trophy',
  earned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_member_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  goals_contributed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_group_id, user_id)
);

-- =============================================================================
-- 11. FITNESS, CONSTRUCTION BUDGET, PROGRESS PHOTOS, MANIFESTATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fitness_daily_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  calories integer NOT NULL DEFAULT 0,
  distance numeric(10,2) NOT NULL DEFAULT 0,
  active_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.construction_budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, phase)
);

CREATE TABLE IF NOT EXISTS public.construction_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text,
  date date NOT NULL,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manifestation_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  timeline text NOT NULL DEFAULT '30' CHECK (timeline IN ('30', '60', '90', '1year', '5year')),
  progress integer NOT NULL DEFAULT 0,
  image_url text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  target_date date,
  steps jsonb DEFAULT '[]',
  budget integer NOT NULL DEFAULT 0,
  spent integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.manifestation_todos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 0,
  scheduled_date date DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  time_slot text
);

CREATE TABLE IF NOT EXISTS public.manifestation_gratitude_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  section_key text,
  section_label text
);
CREATE INDEX IF NOT EXISTS idx_manifestation_gratitude_user_date_section
  ON public.manifestation_gratitude_entries(user_id, date, section_key);

CREATE TABLE IF NOT EXISTS public.manifestation_journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  image_url text,
  mood text NOT NULL DEFAULT 'good' CHECK (mood IN ('great', 'good', 'okay', 'tough')),
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manifestation_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- CALENDAR EVENTS (Step 1: Time-Based Goals)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.manifestation_goals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'missed')),
  color text NOT NULL DEFAULT '#2c9d73',
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_goal_id ON public.calendar_events(goal_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);

-- =============================================================================
-- INDEXES (for common filters and joins)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON public.goals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_privacy ON public.goals(privacy) WHERE privacy = 'public';

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON public.forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id ON public.forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_upvotes_user_id ON public.thread_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_posts_location ON public.connection_posts(location);
CREATE INDEX IF NOT EXISTS idx_connection_posts_status_created ON public.connection_posts(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_posts_interests_gin ON public.connection_posts USING gin(interests);
CREATE INDEX IF NOT EXISTS idx_connection_replies_post_id ON public.connection_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_connection_replies_status_created ON public.connection_replies(moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_connection_user_moderation_removed ON public.connection_user_moderation(is_removed) WHERE is_removed = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON public.reminders(reminder_time) WHERE is_sent = false;
CREATE INDEX IF NOT EXISTS idx_reminder_preferences_user_id ON public.reminder_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_goal_collaborators_goal_id ON public.goal_collaborators(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_activity_goal_id ON public.goal_activity(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal_id ON public.goal_tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_comments_goal_id ON public.goal_comments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_likes_goal_id ON public.goal_likes(goal_id);

CREATE INDEX IF NOT EXISTS idx_video_calls_goal_id ON public.video_calls(goal_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_call_id ON public.video_call_participants(call_id);

CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_goal_id ON public.whiteboard_sessions(goal_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_session_id ON public.whiteboard_elements(session_id);

CREATE INDEX IF NOT EXISTS idx_collaboration_messages_goal_id ON public.collaboration_messages(goal_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_logs_goal_id ON public.team_activity_logs(goal_id);

CREATE INDEX IF NOT EXISTS idx_family_members_family_group_id ON public.family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_goals_family_group_id ON public.family_goals(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_tasks_family_group_id ON public.family_tasks(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_achievements_family_group_id ON public.family_achievements(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_member_progress_family_group_id ON public.family_member_progress(family_group_id);

CREATE INDEX IF NOT EXISTS idx_fitness_daily_activity_user_date ON public.fitness_daily_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_construction_budgets_user_id ON public.construction_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_construction_expenses_user_id ON public.construction_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_goal ON public.progress_photos(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_goals_user_id ON public.manifestation_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_todos_user_id ON public.manifestation_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_todos_completed_at ON public.manifestation_todos(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_manifestation_gratitude_user_id ON public.manifestation_gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestation_journal_user_id ON public.manifestation_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);

-- =============================================================================
-- RPC: decrement (used by Forums for upvote toggle)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.decrement(
  row_id uuid,
  table_name text,
  column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = GREATEST(0, %I - 1) WHERE id = $1',
    table_name,
    column_name,
    column_name
  )
  USING row_id;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS and policies so users only access their own or permitted data.
-- =============================================================================

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_member_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifestation_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Forum categories: read-only for all authenticated
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Goals: own rows by user_id; public goals readable by all
CREATE POLICY "Users can CRUD own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read public goals"
  ON public.goals FOR SELECT
  USING (privacy = 'public');

-- Habits, journal: own only
CREATE POLICY "Users can CRUD own habits"
  ON public.habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own journal_entries"
  ON public.journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions, reminder_preferences, reminders, onboarding: own only
CREATE POLICY "Users can CRUD own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own reminder_preferences"
  ON public.reminder_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own onboarding_progress"
  ON public.onboarding_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Forum categories: all authenticated can read
CREATE POLICY "Authenticated can read forum_categories"
  ON public.forum_categories FOR SELECT
  TO authenticated
  USING (true);

-- Forum threads: read by all; insert/update/delete own
CREATE POLICY "Anyone can read forum_threads"
  ON public.forum_threads FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert forum_threads"
  ON public.forum_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forum_threads"
  ON public.forum_threads FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own forum_threads"
  ON public.forum_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Thread upvotes: authenticated insert/delete own
CREATE POLICY "Authenticated can manage own thread_upvotes"
  ON public.thread_upvotes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Forum replies: read all; insert own
CREATE POLICY "Anyone can read forum_replies"
  ON public.forum_replies FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert forum_replies"
  ON public.forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Community connections: everyone can read approved content;
-- authors can always see and manage their own submissions.
CREATE POLICY "Anyone can read approved connection_posts"
  ON public.connection_posts FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Authenticated can insert connection_posts"
  ON public.connection_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND moderation_status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.connection_user_moderation m
      WHERE m.user_id = auth.uid()
        AND m.is_removed = true
    ) IS NOT TRUE
  );
CREATE POLICY "Users can update own pending connection_posts"
  ON public.connection_posts FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'pending');
CREATE POLICY "Users can delete own pending connection_posts"
  ON public.connection_posts FOR DELETE
  USING (auth.uid() = user_id AND moderation_status = 'pending');

CREATE POLICY "Anyone can read approved connection_replies"
  ON public.connection_replies FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Authenticated can insert connection_replies"
  ON public.connection_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND moderation_status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.connection_posts p
      WHERE p.id = post_id
        AND p.moderation_status = 'approved'
    )
    AND EXISTS (
      SELECT 1
      FROM public.connection_user_moderation m
      WHERE m.user_id = auth.uid()
        AND m.is_removed = true
    ) IS NOT TRUE
  );
CREATE POLICY "Users can update own pending connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'pending');
CREATE POLICY "Users can delete own pending connection_replies"
  ON public.connection_replies FOR DELETE
  USING (auth.uid() = user_id AND moderation_status = 'pending');

CREATE POLICY "Users can read own moderation status"
  ON public.connection_user_moderation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read moderation events tied to them"
  ON public.connection_moderation_events FOR SELECT
  USING (auth.uid() = acted_on_user_id OR auth.uid() = acted_by);

CREATE POLICY "Admins can read all connection_posts"
  ON public.connection_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can read all connection_replies"
  ON public.connection_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can read all connection_user_moderation"
  ON public.connection_user_moderation FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can read all connection_moderation_events"
  ON public.connection_moderation_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

CREATE POLICY "Admins can moderate connection_posts"
  ON public.connection_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can moderate connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can manage connection_user_moderation"
  ON public.connection_user_moderation FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));
CREATE POLICY "Admins can manage connection_moderation_events"
  ON public.connection_moderation_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

-- Goal collaborators, invitations, activity, tasks, comments, likes: access if owner or collaborator
-- Simplified: allow all for goal-related tables and enforce in app or add stricter policies
CREATE POLICY "Users can read goal_collaborators for goals they belong to"
  ON public.goal_collaborators FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = goal_collaborators.goal_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Goal owners can insert goal_collaborators"
  ON public.goal_collaborators FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))));
CREATE POLICY "Goal owners/collaborators can update goal_collaborators"
  ON public.goal_collaborators FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Goal owners can delete goal_collaborators"
  ON public.goal_collaborators FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()));

CREATE POLICY "Users can read goal_invitations for their goals"
  ON public.goal_invitations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid()) OR inviter_id = auth.uid());
CREATE POLICY "Goal owners can insert goal_invitations"
  ON public.goal_invitations FOR INSERT
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can read goal_activity for goals they collaborate on"
  ON public.goal_activity FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = goal_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Collaborators can insert goal_activity"
  ON public.goal_activity FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read goal_tasks for goals they collaborate on"
  ON public.goal_tasks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = goal_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Collaborators can manage goal_tasks"
  ON public.goal_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = goal_id AND c.user_id = auth.uid())
  )
  WITH CHECK (true);

CREATE POLICY "Anyone can read goal_comments"
  ON public.goal_comments FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert goal_comments"
  ON public.goal_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read goal_likes"
  ON public.goal_likes FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can insert goal_likes"
  ON public.goal_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal_likes"
  ON public.goal_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Video calls, whiteboard, collaboration_messages, team_activity_logs: goal collaborators
CREATE POLICY "Collaborators can manage video_calls"
  ON public.video_calls FOR ALL
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);
CREATE POLICY "Collaborators can manage video_call_participants"
  ON public.video_call_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.video_calls v JOIN public.goals g ON g.id = v.goal_id WHERE v.id = call_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);

CREATE POLICY "Collaborators can manage whiteboard_sessions"
  ON public.whiteboard_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);
CREATE POLICY "Collaborators can manage whiteboard_elements"
  ON public.whiteboard_elements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.whiteboard_sessions w JOIN public.goals g ON g.id = w.goal_id WHERE w.id = session_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);

CREATE POLICY "Collaborators can manage collaboration_messages"
  ON public.collaboration_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);
CREATE POLICY "Collaborators can manage team_activity_logs"
  ON public.team_activity_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.goal_collaborators c WHERE c.goal_id = g.id AND c.user_id = auth.uid()))))
  WITH CHECK (true);

-- Family: members can read/write their group data
CREATE POLICY "Users can CRUD own family_groups"
  ON public.family_groups FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members can read family_groups they belong to"
  ON public.family_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_groups.id AND fm.user_id = auth.uid()));

CREATE POLICY "Members can read family_members of their group"
  ON public.family_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.family_groups fg WHERE fg.id = family_group_id AND fg.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_members.family_group_id AND fm.user_id = auth.uid())
  );
CREATE POLICY "Owners can insert family_members"
  ON public.family_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_groups fg WHERE fg.id = family_group_id AND fg.owner_id = auth.uid()));
CREATE POLICY "Owners can delete family_members"
  ON public.family_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.family_groups fg WHERE fg.id = family_group_id AND fg.owner_id = auth.uid()));

CREATE POLICY "Members can manage family_goals"
  ON public.family_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_goals.family_group_id AND fm.user_id = auth.uid()))
  WITH CHECK (true);
CREATE POLICY "Members can manage family_tasks"
  ON public.family_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_tasks.family_group_id AND fm.user_id = auth.uid()))
  WITH CHECK (true);
CREATE POLICY "Members can read family_achievements"
  ON public.family_achievements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_achievements.family_group_id AND fm.user_id = auth.uid()));
CREATE POLICY "Members can insert family_achievements"
  ON public.family_achievements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_achievements.family_group_id AND fm.user_id = auth.uid()));
CREATE POLICY "Members can manage family_member_progress"
  ON public.family_member_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_group_id = family_member_progress.family_group_id AND fm.user_id = auth.uid()))
  WITH CHECK (true);

-- Fitness, construction, progress_photos, manifestation: own only
CREATE POLICY "Users can CRUD own fitness_daily_activity"
  ON public.fitness_daily_activity FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own construction_budgets"
  ON public.construction_budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own construction_expenses"
  ON public.construction_expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own progress_photos"
  ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own manifestation_goals"
  ON public.manifestation_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own manifestation_todos"
  ON public.manifestation_todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own manifestation_gratitude_entries"
  ON public.manifestation_gratitude_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own manifestation_journal_entries"
  ON public.manifestation_journal_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own manifestation_stats"
  ON public.manifestation_stats FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own calendar_events"
  ON public.calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Invite codes: influencers read only codes assigned to them; create/update/delete via API (service role)
CREATE POLICY "Users can read invite_codes assigned to them"
  ON public.invite_codes FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can read own invite_code_redemptions"
  ON public.invite_code_redemptions FOR SELECT
  USING (user_id = auth.uid());

-- Admins: authenticated users can only check if their own email is in the table (for /admin access)
DROP POLICY IF EXISTS "Users can check if they are admin" ON public.admins;
CREATE POLICY "Users can check if they are admin"
  ON public.admins FOR SELECT
  TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')));

-- =============================================================================
-- TRIGGER: updated_at for goals, habits, journal_entries
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS set_goals_updated_at ON public.goals;
  CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_habits_updated_at ON public.habits;
  CREATE TRIGGER set_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_journal_entries_updated_at ON public.journal_entries;
  CREATE TRIGGER set_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_forum_threads_updated_at ON public.forum_threads;
  CREATE TRIGGER set_forum_threads_updated_at BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_connection_posts_updated_at ON public.connection_posts;
  CREATE TRIGGER set_connection_posts_updated_at BEFORE UPDATE ON public.connection_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_connection_user_moderation_updated_at ON public.connection_user_moderation;
  CREATE TRIGGER set_connection_user_moderation_updated_at BEFORE UPDATE ON public.connection_user_moderation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
  CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_calendar_events_updated_at ON public.calendar_events;
  CREATE TRIGGER set_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_invite_codes_updated_at ON public.invite_codes;
  CREATE TRIGGER set_invite_codes_updated_at BEFORE UPDATE ON public.invite_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
  CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
END
$$;

-- =============================================================================
-- GRANTS (required for Supabase API: anon, authenticated, service_role)
-- RLS policies restrict which rows anon/authenticated see; service_role bypasses RLS.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Future tables/sequences/functions get the same privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- =============================================================================
-- STRIPE MIGRATION (run if subscriptions table already existed with old schema)
-- Expands status CHECK to support all Stripe subscription lifecycle states
-- =============================================================================
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN (
  'active', 'trialing', 'canceled', 'past_due', 'unpaid',
  'incomplete', 'incomplete_expired', 'paused'
));

-- =============================================================================
-- EVENT REMINDERS MIGRATION
-- Extend reminders table to support calendar_event reminders
-- =============================================================================
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_type_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_type_check
  CHECK (type IN ('goal_deadline', 'habit_checkin', 'family_activity', 'smart_reminder', 'event_reminder'));

ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_entity_type_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_entity_type_check
  CHECK (entity_type IN ('goal', 'habit', 'family_goal', 'family_activity', 'calendar_event', 'manifestation_goal', 'manifestation_todo', 'manifestation_step'));

-- =============================================================================
-- MANIFESTATION GOALS/TODOS EXTENSION (Demo-style: steps, target_date, budget, notes)
-- =============================================================================
ALTER TABLE public.manifestation_goals
  ADD COLUMN IF NOT EXISTS target_date date,
  ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS budget integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent integer NOT NULL DEFAULT 0;

-- Goal status: active (default), paused, completed
ALTER TABLE public.manifestation_goals ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed'));

ALTER TABLE public.manifestation_todos
  ADD COLUMN IF NOT EXISTS time_slot text,
  ADD COLUMN IF NOT EXISTS group_name text;

-- Goal notes (for Detail page: notes per goal with date; phase 1–4 for organizing by project phase)
CREATE TABLE IF NOT EXISTS public.goal_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES public.manifestation_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  phase smallint NOT NULL DEFAULT 1 CHECK (phase >= 1 AND phase <= 4)
);
CREATE INDEX IF NOT EXISTS idx_goal_notes_goal_id ON public.goal_notes(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_notes_user_id ON public.goal_notes(user_id);
ALTER TABLE public.goal_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own goal_notes" ON public.goal_notes;
CREATE POLICY "Users can CRUD own goal_notes"
  ON public.goal_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add phase to goal_notes if table existed before phases (1–4) were added
ALTER TABLE public.goal_notes ADD COLUMN IF NOT EXISTS phase smallint NOT NULL DEFAULT 1;

-- Gratitude journal sections (10 default + custom)
ALTER TABLE public.manifestation_gratitude_entries ADD COLUMN IF NOT EXISTS section_key text;
ALTER TABLE public.manifestation_gratitude_entries ADD COLUMN IF NOT EXISTS section_label text;
ALTER TABLE public.manifestation_gratitude_entries ALTER COLUMN content SET DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_manifestation_gratitude_user_date_section
  ON public.manifestation_gratitude_entries(user_id, date, section_key);

-- Progress photos: allow linking to manifestation_goals (goal_id stays for legacy goals)
ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS manifestation_goal_id uuid REFERENCES public.manifestation_goals(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_progress_photos_manifestation_goal ON public.progress_photos(manifestation_goal_id) WHERE manifestation_goal_id IS NOT NULL;
