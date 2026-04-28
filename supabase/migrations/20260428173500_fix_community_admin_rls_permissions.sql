-- Fix RLS policy permission error:
-- "permission denied for table users"
-- Avoid auth.users in policy expressions; use JWT email claim + public.admins.

DROP POLICY IF EXISTS "Admins can read all connection_posts" ON public.connection_posts;
CREATE POLICY "Admins can read all connection_posts"
  ON public.connection_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can read all connection_replies" ON public.connection_replies;
CREATE POLICY "Admins can read all connection_replies"
  ON public.connection_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can read all connection_user_moderation" ON public.connection_user_moderation;
CREATE POLICY "Admins can read all connection_user_moderation"
  ON public.connection_user_moderation FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can read all connection_moderation_events" ON public.connection_moderation_events;
CREATE POLICY "Admins can read all connection_moderation_events"
  ON public.connection_moderation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can moderate connection_posts" ON public.connection_posts;
CREATE POLICY "Admins can moderate connection_posts"
  ON public.connection_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can moderate connection_replies" ON public.connection_replies;
CREATE POLICY "Admins can moderate connection_replies"
  ON public.connection_replies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can manage connection_user_moderation" ON public.connection_user_moderation;
CREATE POLICY "Admins can manage connection_user_moderation"
  ON public.connection_user_moderation FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Admins can manage connection_moderation_events" ON public.connection_moderation_events;
CREATE POLICY "Admins can manage connection_moderation_events"
  ON public.connection_moderation_events FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE lower(a.email) = lower((auth.jwt() ->> 'email'))
    )
  );
