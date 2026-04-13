ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_entity_type_check;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_entity_type_check
  CHECK (entity_type IN (
    'goal',
    'habit',
    'family_goal',
    'family_activity',
    'calendar_event',
    'manifestation_goal',
    'manifestation_todo',
    'manifestation_step'
  ));
