-- Support multi-location selection (countries/regions/custom text)
-- for community connection posts.

ALTER TABLE public.connection_posts
  ADD COLUMN IF NOT EXISTS location_tags text[] NOT NULL DEFAULT '{}';

UPDATE public.connection_posts
SET location_tags = ARRAY[location]
WHERE (location_tags IS NULL OR array_length(location_tags, 1) IS NULL)
  AND COALESCE(location, '') <> '';

CREATE INDEX IF NOT EXISTS idx_connection_posts_location_tags_gin
  ON public.connection_posts USING gin(location_tags);
