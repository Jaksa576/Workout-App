update public.workout_sessions sessions
set phase_id_at_completion = templates.phase_id
from public.workout_templates templates
where sessions.workout_template_id = templates.id
  and sessions.phase_id_at_completion is null;
