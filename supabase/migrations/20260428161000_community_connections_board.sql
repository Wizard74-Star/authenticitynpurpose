-- Community connection board:
-- location + interest matching, threaded replies, and moderation workflow.

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

CREATE INDEX IF NOT EXISTS idx_connection_posts_location ON public.connection_posts(location);
CREATE INDEX IF NOT EXISTS idx_connection_posts_status_created ON public.connection_posts(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_posts_interests_gin ON public.connection_posts USING gin(interests);
CREATE INDEX IF NOT EXISTS idx_connection_replies_post_id ON public.connection_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_connection_replies_status_created ON public.connection_replies(moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_connection_user_moderation_removed ON public.connection_user_moderation(is_removed) WHERE is_removed = true;

ALTER TABLE public.connection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_user_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_moderation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved connection_posts" ON public.connection_posts;
CREATE POLICY "Anyone can read approved connection_posts"
  ON public.connection_posts FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can insert connection_posts" ON public.connection_posts;
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

DROP POLICY IF EXISTS "Users can update own pending connection_posts" ON public.connection_posts;
CREATE POLICY "Users can update own pending connection_posts"
  ON public.connection_posts FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'pending');

DROP POLICY IF EXISTS "Users can delete own pending connection_posts" ON public.connection_posts;
CREATE POLICY "Users can delete own pending connection_posts"
  ON public.connection_posts FOR DELETE
  USING (auth.uid() = user_id AND moderation_status = 'pending');

DROP POLICY IF EXISTS "Anyone can read approved connection_replies" ON public.connection_replies;
CREATE POLICY "Anyone can read approved connection_replies"
  ON public.connection_replies FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can insert connection_replies" ON public.connection_replies;
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

DROP POLICY IF EXISTS "Users can update own pending connection_replies" ON public.connection_replies;
CREATE POLICY "Users can update own pending connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (auth.uid() = user_id AND moderation_status = 'pending')
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'pending');

DROP POLICY IF EXISTS "Users can delete own pending connection_replies" ON public.connection_replies;
CREATE POLICY "Users can delete own pending connection_replies"
  ON public.connection_replies FOR DELETE
  USING (auth.uid() = user_id AND moderation_status = 'pending');

DROP POLICY IF EXISTS "Users can read own moderation status" ON public.connection_user_moderation;
CREATE POLICY "Users can read own moderation status"
  ON public.connection_user_moderation FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read moderation events tied to them" ON public.connection_moderation_events;
CREATE POLICY "Users can read moderation events tied to them"
  ON public.connection_moderation_events FOR SELECT
  USING (auth.uid() = acted_on_user_id OR auth.uid() = acted_by);

DROP POLICY IF EXISTS "Admins can read all connection_posts" ON public.connection_posts;
CREATE POLICY "Admins can read all connection_posts"
  ON public.connection_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can read all connection_replies" ON public.connection_replies;
CREATE POLICY "Admins can read all connection_replies"
  ON public.connection_replies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can read all connection_user_moderation" ON public.connection_user_moderation;
CREATE POLICY "Admins can read all connection_user_moderation"
  ON public.connection_user_moderation FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can read all connection_moderation_events" ON public.connection_moderation_events;
CREATE POLICY "Admins can read all connection_moderation_events"
  ON public.connection_moderation_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can moderate connection_posts" ON public.connection_posts;
CREATE POLICY "Admins can moderate connection_posts"
  ON public.connection_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can moderate connection_replies" ON public.connection_replies;
CREATE POLICY "Admins can moderate connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can manage connection_user_moderation" ON public.connection_user_moderation;
CREATE POLICY "Admins can manage connection_user_moderation"
  ON public.connection_user_moderation FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

DROP POLICY IF EXISTS "Admins can manage connection_moderation_events" ON public.connection_moderation_events;
CREATE POLICY "Admins can manage connection_moderation_events"
  ON public.connection_moderation_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))));

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
  DROP TRIGGER IF EXISTS set_connection_posts_updated_at ON public.connection_posts;
  CREATE TRIGGER set_connection_posts_updated_at
    BEFORE UPDATE ON public.connection_posts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  DROP TRIGGER IF EXISTS set_connection_user_moderation_updated_at ON public.connection_user_moderation;
  CREATE TRIGGER set_connection_user_moderation_updated_at
    BEFORE UPDATE ON public.connection_user_moderation
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
END
$$;
