-- Community board: synthetic seed personas, posts, replies, and flags for later removal.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seed_account boolean NOT NULL DEFAULT false;

ALTER TABLE public.connection_posts
  ADD COLUMN IF NOT EXISTS is_synthetic boolean NOT NULL DEFAULT false;

ALTER TABLE public.connection_replies
  ADD COLUMN IF NOT EXISTS is_synthetic boolean NOT NULL DEFAULT false;

ALTER TABLE public.connection_categories
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

UPDATE public.connection_categories
SET is_system = true
WHERE lower(trim(name)) = 'all';

INSERT INTO public.connection_categories (name, is_system)
SELECT v.name, true
FROM (
  VALUES
    ('Spiritual'),
    ('Healthy living'),
    ('Recovery'),
    ('Awakening'),
    ('Quantum mysticism')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.connection_categories c
  WHERE lower(trim(c.name)) = lower(trim(v.name))
);

UPDATE public.connection_categories
SET is_system = true
WHERE lower(trim(name)) IN (
  'spiritual',
  'healthy living',
  'recovery',
  'awakening',
  'quantum mysticism',
  'all'
);

DROP POLICY IF EXISTS "Authenticated users can view connection_categories" ON public.connection_categories;
CREATE POLICY "Authenticated users can view connection_categories"
  ON public.connection_categories FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      created_by = auth.uid()
      OR is_system = true
      OR lower(trim(name)) = 'all'
    )
  );

-- Seed personas (fixed UUIDs; not intended for login).
DO $$
DECLARE
  v_pw text := crypt('community-seed-no-login', gen_salt('bf'));
  persona record;
BEGIN
  FOR persona IN
    SELECT *
    FROM (
      VALUES
        ('f47ac10b-58cc-4372-a567-0e02b2c3d601'::uuid, 'community-seed-riversong@seed.authenticitynpurpose.local', 'RiverSong'),
        ('f47ac10b-58cc-4372-a567-0e02b2c3d602'::uuid, 'community-seed-maya@seed.authenticitynpurpose.local', 'MayaInRecovery'),
        ('f47ac10b-58cc-4372-a567-0e02b2c3d603'::uuid, 'community-seed-leo@seed.authenticitynpurpose.local', 'LeoAwakens'),
        ('f47ac10b-58cc-4372-a567-0e02b2c3d604'::uuid, 'community-seed-sage@seed.authenticitynpurpose.local', 'SageWell'),
        ('f47ac10b-58cc-4372-a567-0e02b2c3d605'::uuid, 'community-seed-nova@seed.authenticitynpurpose.local', 'NovaMystic'),
        ('f47ac10b-58cc-4372-a567-0e02b2c3d606'::uuid, 'community-seed-ember@seed.authenticitynpurpose.local', 'EmberHope')
    ) AS t(id, email, display_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = persona.id) THEN
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      )
      VALUES (
        persona.id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        persona.email,
        v_pw,
        now(),
        '', '', '', '',
        '{"provider":"email","providers":["email"],"is_seed_account":true}',
        jsonb_build_object('community_display_name', persona.display_name),
        now() - interval '90 days',
        now()
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      )
      VALUES (
        persona.id,
        persona.id,
        format('{"sub": "%s", "email": "%s"}', persona.id, persona.email)::jsonb,
        'email',
        persona.id::text,
        now(),
        now() - interval '90 days',
        now()
      );
    END IF;

    INSERT INTO public.profiles (id, username, community_display_name, is_seed_account, timezone, updated_at)
    VALUES (
      persona.id,
      lower(persona.display_name),
      persona.display_name,
      true,
      'America/New_York',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      community_display_name = EXCLUDED.community_display_name,
      is_seed_account = true,
      updated_at = now();
  END LOOP;
END $$;

-- Approved seed posts (idempotent by title + author).
INSERT INTO public.connection_posts (
  user_id, title, body, location, location_tags, interests, moderation_status, is_synthetic, created_at
)
SELECT
  seed.user_id,
  seed.title,
  seed.body,
  seed.location,
  seed.location_tags,
  seed.interests,
  seed.moderation_status,
  seed.is_synthetic,
  seed.created_at
FROM (VALUES
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d601'::uuid,
    'Morning gratitude practice',
    'I have been starting each day with five minutes of quiet gratitude before my phone. It has softened my whole outlook. Anyone else building a simple spiritual rhythm?',
    'United States - Colorado',
    ARRAY['United States - Colorado']::text[],
    ARRAY['Spiritual']::text[],
    'approved',
    true,
    now() - interval '12 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d606'::uuid,
    'Prayer without performance',
    'Looking for people who pray or meditate without trying to look spiritual online. Just honest connection with something bigger. No debating beliefs — only sharing what helps.',
    'United States - Texas',
    ARRAY['United States - Texas']::text[],
    ARRAY['Spiritual', 'Recovery']::text[],
    'approved',
    true,
    now() - interval '9 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d604'::uuid,
    'Walking as my wellness anchor',
    'Twenty minutes after lunch, most days. Not heroic — just consistent. My mood and sleep both improved. What is one healthy habit you actually kept?',
    'United States - Oregon',
    ARRAY['United States - Oregon']::text[],
    ARRAY['Healthy living']::text[],
    'approved',
    true,
    now() - interval '8 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d604'::uuid,
    'Hydration and boundaries',
    'Cutting back evening scrolling and drinking more water sounded small — it changed my energy. Sharing in case it helps someone else start gentle.',
    'Canada',
    ARRAY['Canada']::text[],
    ARRAY['Healthy living']::text[],
    'approved',
    true,
    now() - interval '5 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d602'::uuid,
    'One year — still taking it day by day',
    'Grateful for another year of choosing recovery. This community feels like a place to celebrate progress without comparison. What are you proud of this week?',
    'United States - Florida',
    ARRAY['United States - Florida']::text[],
    ARRAY['Recovery']::text[],
    'approved',
    true,
    now() - interval '11 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d602'::uuid,
    'Sponsor check-ins matter',
    'Weekly calls with my sponsor keep me honest and kind to myself. If you are looking for accountability, you are welcome to connect here.',
    'United States - Ohio',
    ARRAY['United States - Ohio']::text[],
    ARRAY['Recovery']::text[],
    'approved',
    true,
    now() - interval '4 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d603'::uuid,
    'Noticing old stories',
    'Lately I catch the stories I tell about myself before they run the day. Still learning. Anyone else in an awakening season that feels messy but real?',
    'United States - California',
    ARRAY['United States - California']::text[],
    ARRAY['Awakening']::text[],
    'approved',
    true,
    now() - interval '10 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d603'::uuid,
    'Letting go of who I thought I had to be',
    'Less performing, more listening — to myself and others. Curious how you practice self-honesty without being hard on yourself.',
    'United Kingdom',
    ARRAY['United Kingdom']::text[],
    ARRAY['Awakening']::text[],
    'approved',
    true,
    now() - interval '6 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d605'::uuid,
    'Wonder without needing proof',
    'I enjoy quantum mysticism as a lens for awe, not argument. Meditation plus reading has been enough for me. What drew you to this intersection?',
    'United States - New Mexico',
    ARRAY['United States - New Mexico']::text[],
    ARRAY['Quantum mysticism']::text[],
    'approved',
    true,
    now() - interval '7 days'
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d605'::uuid,
    'Entanglement as a metaphor for connection',
    'I do not need to win debates — I like ideas that remind me we are linked. Happy to share book recommendations if anyone wants them.',
    'Australia',
    ARRAY['Australia']::text[],
    ARRAY['Quantum mysticism', 'Spiritual']::text[],
    'approved',
    true,
    now() - interval '3 days'
  )
) AS seed(user_id, title, body, location, location_tags, interests, moderation_status, is_synthetic, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.connection_posts p
  WHERE p.is_synthetic AND p.title = seed.title AND p.user_id = seed.user_id
);

-- Seed replies on synthetic posts (idempotent by content prefix + post).
INSERT INTO public.connection_replies (post_id, user_id, content, moderation_status, is_synthetic, created_at)
SELECT p.id, r.user_id, r.content, 'approved', true, r.created_at
FROM (VALUES
  ('Morning gratitude practice', 'f47ac10b-58cc-4372-a567-0e02b2c3d606'::uuid, 'This is beautiful. I journal three things I am thankful for — it helps on hard days too.', now() - interval '11 days'),
  ('Morning gratitude practice', 'f47ac10b-58cc-4372-a567-0e02b2c3d603'::uuid, 'I needed this reminder. Stillness before noise has been a game changer for me.', now() - interval '10 days'),
  ('Prayer without performance', 'f47ac10b-58cc-4372-a567-0e02b2c3d601'::uuid, 'Yes — sincerity over show. Glad this space exists for that.', now() - interval '8 days'),
  ('Walking as my wellness anchor', 'f47ac10b-58cc-4372-a567-0e02b2c3d602'::uuid, 'Walking meetings saved my sanity during early recovery. Keep going!', now() - interval '7 days'),
  ('Walking as my wellness anchor', 'f47ac10b-58cc-4372-a567-0e02b2c3d605'::uuid, 'Consistency beats intensity. Proud of you for showing up.', now() - interval '6 days'),
  ('One year — still taking it day by day', 'f47ac10b-58cc-4372-a567-0e02b2c3d606'::uuid, 'Congratulations — that matters. Thanks for inspiring the rest of us.', now() - interval '10 days'),
  ('Sponsor check-ins matter', 'f47ac10b-58cc-4372-a567-0e02b2c3d604'::uuid, 'Accountability changed my life too. Reach out if you want to share what works.', now() - interval '3 days'),
  ('Noticing old stories', 'f47ac10b-58cc-4372-a567-0e02b2c3d605'::uuid, 'Messy and real is the only kind that lasts. You are not alone.', now() - interval '9 days'),
  ('Letting go of who I thought I had to be', 'f47ac10b-58cc-4372-a567-0e02b2c3d601'::uuid, 'Self-honesty with compassion — still learning that balance.', now() - interval '5 days'),
  ('Wonder without needing proof', 'f47ac10b-58cc-4372-a567-0e02b2c3d603'::uuid, 'Same here. Curiosity without combat feels peaceful.', now() - interval '6 days'),
  ('Wonder without needing proof', 'f47ac10b-58cc-4372-a567-0e02b2c3d601'::uuid, 'Would love those book recs when you have time.', now() - interval '5 days'),
  ('Entanglement as a metaphor for connection', 'f47ac10b-58cc-4372-a567-0e02b2c3d606'::uuid, 'Love this framing. Connection is the whole point.', now() - interval '2 days')
) AS r(post_title, user_id, content, created_at)
JOIN public.connection_posts p ON p.title = r.post_title AND p.is_synthetic
WHERE NOT EXISTS (
  SELECT 1 FROM public.connection_replies cr
  WHERE cr.post_id = p.id AND cr.is_synthetic AND cr.user_id = r.user_id AND cr.content = r.content
);
