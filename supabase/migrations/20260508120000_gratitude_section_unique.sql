-- One appreciation row per user, date, and section.

UPDATE public.manifestation_gratitude_entries
SET section_key = 'general'
WHERE section_key IS NULL;

ALTER TABLE public.manifestation_gratitude_entries
  ALTER COLUMN section_key SET DEFAULT 'general';

CREATE UNIQUE INDEX IF NOT EXISTS idx_manifestation_gratitude_user_date_section_unique
  ON public.manifestation_gratitude_entries (user_id, date, section_key);
