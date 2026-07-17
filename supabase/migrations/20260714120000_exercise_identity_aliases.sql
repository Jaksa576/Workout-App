-- Issue #40 follow-up: additive canonical exercise identity and reviewed alias foundation.
-- Hosted status: not applied by Codex. Apply only through the normal Supabase migration flow.

create table if not exists public.exercise_identities (
  id text primary key,
  display_name text not null,
  normalized_lookup_key text not null,
  owner_scope text not null default 'system' check (owner_scope in ('system','user')),
  owner_user_id uuid references auth.users(id) on delete cascade,
  equipment_tags text[] not null default '{}',
  movement_pattern text,
  qualifier_text text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  superseded_by text references public.exercise_identities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_scope = 'system' and owner_user_id is null) or (owner_scope = 'user' and owner_user_id is not null)),
  check (superseded_by is null or superseded_by <> id)
);

create table if not exists public.exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_identity_id text not null references public.exercise_identities(id) on delete cascade,
  alias text not null,
  normalized_lookup_key text not null,
  owner_scope text not null default 'system' check (owner_scope in ('system','user')),
  owner_user_id uuid references auth.users(id) on delete cascade,
  reviewed boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_scope = 'system' and owner_user_id is null) or (owner_scope = 'user' and owner_user_id is not null))
);

alter table public.exercise_entries add column if not exists canonical_exercise_id text references public.exercise_identities(id) on delete set null;
alter table public.exercise_results add column if not exists canonical_exercise_id text references public.exercise_identities(id) on delete set null;

create unique index if not exists exercise_identities_system_lookup_unique on public.exercise_identities(normalized_lookup_key) where owner_scope = 'system' and active;
create index if not exists exercise_identities_user_lookup_idx on public.exercise_identities(owner_user_id, normalized_lookup_key) where owner_scope = 'user' and active;
create unique index if not exists exercise_aliases_system_reviewed_unique on public.exercise_aliases(normalized_lookup_key) where owner_scope = 'system' and reviewed;
create index if not exists exercise_aliases_user_reviewed_idx on public.exercise_aliases(owner_user_id, normalized_lookup_key) where owner_scope = 'user' and reviewed;
create index if not exists exercise_entries_canonical_exercise_id_idx on public.exercise_entries(canonical_exercise_id) where canonical_exercise_id is not null;
create index if not exists exercise_results_canonical_exercise_id_idx on public.exercise_results(canonical_exercise_id) where canonical_exercise_id is not null;

alter table public.exercise_identities enable row level security;
alter table public.exercise_aliases enable row level security;

drop policy if exists "exercise identities are service-role managed" on public.exercise_identities;
drop policy if exists "exercise aliases are service-role managed" on public.exercise_aliases;


insert into public.exercise_identities (id, display_name, normalized_lookup_key, owner_scope, equipment_tags, movement_pattern, qualifier_text, metadata)
values
  ('bodyweight-squat','Bodyweight squat','bodyweight squat','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"intro","cautionTags":["knee"],"traitTags":["bilateral","low_setup"],"preferenceTags":["bodyweight","lower body","squat"]}'::jsonb),
  ('box-squat','Box squat','box squat','system',array['Bodyweight','Bench']::text[],'squat','Bodyweight/Bench · bilateral · squat','{"category":"recovery","difficultyTier":"intro","cautionTags":["knee"],"traitTags":["bilateral","low_load"],"preferenceTags":["bodyweight","lower body","squat"]}'::jsonb),
  ('goblet-squat','Goblet squat','goblet squat','system',array['Dumbbells','Kettlebell']::text[],'squat','Dumbbells/Kettlebell · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":["knee","back"],"traitTags":["bilateral","loaded"],"preferenceTags":["dumbbells","kettlebell","lower body","squat"]}'::jsonb),
  ('barbell-back-squat','Barbell back squat','barbell back squat','system',array['Barbell']::text[],'squat','Barbell · bilateral · squat','{"category":"strength","difficultyTier":"intermediate","cautionTags":["knee","back","loaded_spine"],"traitTags":["bilateral","higher_load"],"preferenceTags":["barbell","lower body","squat"]}'::jsonb),
  ('romanian-deadlift','Romanian deadlift','romanian deadlift','system',array['Dumbbells','Barbell']::text[],'hinge','Dumbbells/Barbell · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":["back","hamstring"],"traitTags":["bilateral","loaded"],"preferenceTags":["dumbbells","barbell","hinge","posterior chain"]}'::jsonb),
  ('hip-hinge-drill','Hip hinge drill','hip hinge drill','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"recovery","difficultyTier":"intro","cautionTags":["back","hamstring"],"traitTags":["low_load","technique"],"preferenceTags":["bodyweight","hinge","posterior chain"]}'::jsonb),
  ('glute-bridge','Glute bridge','glute bridge','system',array['Bodyweight','Bands']::text[],'hinge','Bodyweight/Bands · bilateral · hinge','{"category":"recovery","difficultyTier":"intro","cautionTags":[],"traitTags":["low_load","posterior_chain"],"preferenceTags":["bodyweight","glutes","lower body"]}'::jsonb),
  ('reverse-lunge','Reverse lunge','reverse lunge','system',array['Bodyweight','Dumbbells']::text[],'lunge','Bodyweight/Dumbbells · same each side · lunge','{"category":"strength","difficultyTier":"foundation","cautionTags":["knee"],"traitTags":["unilateral","lower_body"],"preferenceTags":["bodyweight","dumbbells","lower body","lunge"]}'::jsonb),
  ('step-up','Step-up','step up','system',array['Bodyweight','Dumbbells','Bench']::text[],'lunge','Bodyweight/Dumbbells/Bench · same each side · lunge','{"category":"strength","difficultyTier":"foundation","cautionTags":["knee"],"traitTags":["unilateral","lower_body"],"preferenceTags":["bodyweight","dumbbells","lower body","running prep"]}'::jsonb),
  ('walking-lunge','Walking lunge','walking lunge','system',array['Bodyweight','Dumbbells']::text[],'lunge','Bodyweight/Dumbbells · same each side · lunge','{"category":"running_prep","difficultyTier":"foundation","cautionTags":["knee"],"traitTags":["unilateral","running_support"],"preferenceTags":["bodyweight","dumbbells","lower body","running prep"]}'::jsonb),
  ('incline-push-up','Incline push-up','incline push up','system',array['Bodyweight','Bench']::text[],'push','Bodyweight/Bench · bilateral · push','{"category":"strength","difficultyTier":"intro","cautionTags":["shoulder"],"traitTags":["upper_body","low_load"],"preferenceTags":["bodyweight","push","upper body"]}'::jsonb),
  ('push-up','Push-up','push up','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["upper_body","low_setup"],"preferenceTags":["bodyweight","push","upper body"]}'::jsonb),
  ('dumbbell-floor-press','Dumbbell floor press','dumbbell floor press','system',array['Dumbbells']::text[],'push','Dumbbells · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["upper_body","loaded"],"preferenceTags":["dumbbells","push","chest","upper body"]}'::jsonb),
  ('dumbbell-shoulder-press','Dumbbell shoulder press','dumbbell shoulder press','system',array['Dumbbells']::text[],'push','Dumbbells · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder","overhead"],"traitTags":["upper_body","loaded"],"preferenceTags":["dumbbells","push","shoulders","overhead"]}'::jsonb),
  ('band-row','Band row','band row','system',array['Bands']::text[],'pull','Bands · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":["shoulder"],"traitTags":["upper_body","low_load"],"preferenceTags":["bands","pull","upper body","back"]}'::jsonb),
  ('dumbbell-row','Dumbbell row','dumbbell row','system',array['Dumbbells','Bench']::text[],'pull','Dumbbells/Bench · same each side · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder","back"],"traitTags":["upper_body","loaded"],"preferenceTags":["dumbbells","pull","upper body","back"]}'::jsonb),
  ('farmer-carry','Farmer carry','farmer carry','system',array['Dumbbells','Kettlebell']::text[],'carry','Dumbbells/Kettlebell · bilateral · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":["back"],"traitTags":["loaded","core","grip"],"preferenceTags":["dumbbells","kettlebell","carry","core"]}'::jsonb),
  ('dead-bug','Dead bug','dead bug','system',array['Bodyweight']::text[],'core','Bodyweight · same each side · core','{"category":"core","difficultyTier":"intro","cautionTags":[],"traitTags":["core","low_load"],"preferenceTags":["bodyweight","core"]}'::jsonb),
  ('side-plank','Side plank','side plank','system',array['Bodyweight']::text[],'core','Bodyweight · same each side · core','{"category":"core","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["core","lateral"],"preferenceTags":["bodyweight","core"]}'::jsonb),
  ('bird-dog','Bird dog','bird dog','system',array['Bodyweight']::text[],'core','Bodyweight · bilateral · core','{"category":"core","difficultyTier":"intro","cautionTags":[],"traitTags":["core","low_load"],"preferenceTags":["bodyweight","core","back-friendly"]}'::jsonb),
  ('dumbbell-lateral-raise','Dumbbell lateral raise','dumbbell lateral raise','system',array['Dumbbells']::text[],'push','Dumbbells · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":["shoulder"],"traitTags":["upper_body","accessory"],"preferenceTags":["dumbbells","shoulders","hypertrophy"]}'::jsonb),
  ('dumbbell-curl','Dumbbell curl','dumbbell curl','system',array['Dumbbells']::text[],'pull','Dumbbells · bilateral · pull','{"category":"strength","difficultyTier":"intro","cautionTags":[],"traitTags":["upper_body","accessory"],"preferenceTags":["dumbbells","arms","hypertrophy"]}'::jsonb),
  ('calf-raise','Calf raise','calf raise','system',array['Bodyweight','Dumbbells']::text[],'calf','Bodyweight/Dumbbells · bilateral · calf','{"category":"running_prep","difficultyTier":"intro","cautionTags":["ankle"],"traitTags":["lower_body","running_support"],"preferenceTags":["bodyweight","dumbbells","calves","running prep"]}'::jsonb),
  ('tibialis-raise','Tibialis raise','tibialis raise','system',array['Bodyweight']::text[],'calf','Bodyweight · bilateral · calf','{"category":"running_prep","difficultyTier":"intro","cautionTags":["ankle"],"traitTags":["lower_body","running_support"],"preferenceTags":["bodyweight","shin","running prep"]}'::jsonb),
  ('hip-flexor-rockback','Hip flexor rockback','hip flexor rockback','system',array['Bodyweight']::text[],'mobility','Bodyweight · same each side · mobility','{"category":"mobility","difficultyTier":"intro","cautionTags":[],"traitTags":["mobility","low_load"],"preferenceTags":["bodyweight","mobility","hips"]}'::jsonb),
  ('thoracic-rotation','Thoracic rotation','thoracic rotation','system',array['Bodyweight']::text[],'mobility','Bodyweight · same each side · mobility','{"category":"mobility","difficultyTier":"intro","cautionTags":[],"traitTags":["mobility","upper_body"],"preferenceTags":["bodyweight","mobility","upper back"]}'::jsonb),
  ('ankle-rock','Ankle rock','ankle rock','system',array['Bodyweight']::text[],'mobility','Bodyweight · same each side · mobility','{"category":"mobility","difficultyTier":"intro","cautionTags":["ankle"],"traitTags":["mobility","running_support"],"preferenceTags":["bodyweight","mobility","ankle","running prep"]}'::jsonb),
  ('brisk-walk','Brisk walk','brisk walk','system',array['Bodyweight']::text[],'walk','Bodyweight · bilateral · walk','{"category":"cardio","difficultyTier":"intro","cautionTags":[],"traitTags":["cardio","low_setup","low_impact"],"preferenceTags":["cardio","walking","outdoors","bodyweight"]}'::jsonb),
  ('low-impact-cardio-march','Low-impact cardio march','low impact cardio march','system',array['Bodyweight']::text[],'walk','Bodyweight · bilateral · walk','{"category":"cardio","difficultyTier":"intro","cautionTags":[],"traitTags":["cardio","low_setup","low_impact"],"preferenceTags":["cardio","bodyweight","home"]}'::jsonb),
  ('run-walk-intervals','Run/walk intervals','run walk intervals','system',array['Bodyweight']::text[],'run','Bodyweight · bilateral · run','{"category":"cardio","difficultyTier":"intro","cautionTags":["impact","knee","ankle"],"traitTags":["running","interval","cardio"],"preferenceTags":["running","cardio","outdoors"]}'::jsonb),
  ('easy-run','Easy run','easy run','system',array['Bodyweight']::text[],'run','Bodyweight · bilateral · run','{"category":"cardio","difficultyTier":"foundation","cautionTags":["impact","knee","ankle"],"traitTags":["running","cardio"],"preferenceTags":["running","cardio","outdoors"]}'::jsonb),
  ('stride-drills','Stride drills','stride drills','system',array['Bodyweight']::text[],'run','Bodyweight · bilateral · run','{"category":"running_prep","difficultyTier":"foundation","cautionTags":["impact","knee","ankle","hamstring"],"traitTags":["running","speed","athletic"],"preferenceTags":["running","cardio","sport"]}'::jsonb),
  ('lateral-lunge','Lateral lunge','lateral lunge','system',array['Bodyweight','Dumbbells']::text[],'lateral','Bodyweight/Dumbbells · same each side · lateral','{"category":"athletic","difficultyTier":"foundation","cautionTags":["knee"],"traitTags":["unilateral","lateral","athletic"],"preferenceTags":["sport","lateral","lower body"]}'::jsonb),
  ('lateral-shuffle','Lateral shuffle','lateral shuffle','system',array['Bodyweight']::text[],'lateral','Bodyweight · bilateral · lateral','{"category":"athletic","difficultyTier":"foundation","cautionTags":["knee","ankle","impact"],"traitTags":["lateral","athletic","cardio"],"preferenceTags":["sport","lateral","agility"]}'::jsonb),
  ('skater-hop','Skater hop','skater hop','system',array['Bodyweight']::text[],'power','Bodyweight · same each side · power','{"category":"athletic","difficultyTier":"intermediate","cautionTags":["knee","ankle","impact"],"traitTags":["unilateral","lateral","power","athletic"],"preferenceTags":["sport","lateral","jumping","power"]}'::jsonb),
  ('front-squat','Front squat','front squat','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('dumbbell-squat','Dumbbell squat','dumbbell squat','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('leg-press','Leg press','leg press','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('leg-extension','Leg extension','leg extension','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('split-squat','Split squat','split squat','system',array['Bodyweight']::text[],'lunge','Bodyweight · bilateral · lunge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('bulgarian-split-squat','Bulgarian split squat','bulgarian split squat','system',array['Bodyweight']::text[],'lunge','Bodyweight · bilateral · lunge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('forward-lunge','Forward lunge','forward lunge','system',array['Bodyweight']::text[],'lunge','Bodyweight · bilateral · lunge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('conventional-deadlift','Conventional deadlift','conventional deadlift','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('trap-bar-deadlift','Trap-bar deadlift','trap bar deadlift','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('dumbbell-romanian-deadlift','Dumbbell Romanian deadlift','dumbbell romanian deadlift','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('hip-thrust','Hip thrust','hip thrust','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('back-extension','Back extension','back extension','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('seated-leg-curl','Seated leg curl','seated leg curl','system',array['Bodyweight']::text[],'hinge','Bodyweight · bilateral · hinge','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('barbell-bench-press','Barbell bench press','barbell bench press','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('dumbbell-bench-press','Dumbbell bench press','dumbbell bench press','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('incline-dumbbell-press','Incline dumbbell press','incline dumbbell press','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('machine-chest-press','Machine chest press','machine chest press','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('barbell-overhead-press','Barbell overhead press','barbell overhead press','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('triceps-pushdown','Triceps pushdown','triceps pushdown','system',array['Bodyweight']::text[],'push','Bodyweight · bilateral · push','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('seated-cable-row','Seated cable row','seated cable row','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('chest-supported-row','Chest-supported row','chest supported row','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('barbell-row','Barbell row','barbell row','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('lat-pulldown','Lat pulldown','lat pulldown','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('pull-up','Pull-up','pull up','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('assisted-pull-up','Assisted pull-up','assisted pull up','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('face-pull','Face pull','face pull','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('reverse-fly','Reverse fly','reverse fly','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('suitcase-carry','Suitcase carry','suitcase carry','system',array['Bodyweight']::text[],'carry','Bodyweight · bilateral · carry','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('plank','Plank','plank','system',array['Bodyweight']::text[],'core','Bodyweight · bilateral · core','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('pallof-press','Pallof press','pallof press','system',array['Bodyweight']::text[],'core','Bodyweight · bilateral · core','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('inverted-row','Inverted row','inverted row','system',array['Bodyweight']::text[],'pull','Bodyweight · bilateral · pull','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('wall-sit','Wall sit','wall sit','system',array['Bodyweight']::text[],'squat','Bodyweight · bilateral · squat','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('calf-stretch','Calf stretch','calf stretch','system',array['Bodyweight']::text[],'mobility','Bodyweight · bilateral · mobility','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('shoulder-wall-slide','Shoulder wall slide','shoulder wall slide','system',array['Bodyweight']::text[],'mobility','Bodyweight · bilateral · mobility','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('marching-drill','Marching drill','marching drill','system',array['Bodyweight']::text[],'run','Bodyweight · bilateral · run','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb),
  ('pogo-hop','Pogo hop','pogo hop','system',array['Bodyweight']::text[],'power','Bodyweight · bilateral · power','{"category":"strength","difficultyTier":"foundation","cautionTags":[],"traitTags":[],"preferenceTags":[]}'::jsonb)
on conflict (id) do update set
  display_name = excluded.display_name,
  normalized_lookup_key = excluded.normalized_lookup_key,
  equipment_tags = excluded.equipment_tags,
  movement_pattern = excluded.movement_pattern,
  qualifier_text = excluded.qualifier_text,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.exercise_aliases (exercise_identity_id, alias, normalized_lookup_key, owner_scope, reviewed)
values
  ('push-up','push up','push up','system',true),
  ('push-up','pushup','pushup','system',true),
  ('push-up','press up','press up','system',true),
  ('push-up','push ups','push ups','system',true),
  ('romanian-deadlift','rdl','rdl','system',true),
  ('romanian-deadlift','romanian dead lift','romanian dead lift','system',true),
  ('romanian-deadlift','romanian deadlifts','romanian deadlifts','system',true),
  ('bodyweight-squat','bodyweight squat','bodyweight squat','system',true),
  ('bodyweight-squat','air squat','air squat','system',true),
  ('bodyweight-squat','bodyweight squats','bodyweight squats','system',true),
  ('goblet-squat','goblet squats','goblet squats','system',true),
  ('goblet-squat','kb goblet squat','kb goblet squat','system',true),
  ('goblet-squat','db goblet squat','db goblet squat','system',true),
  ('dumbbell-row','db row','db row','system',true),
  ('dumbbell-row','dumbbell row','dumbbell row','system',true),
  ('dumbbell-row','one arm dumbbell row','one arm dumbbell row','system',true),
  ('dumbbell-row','single arm dumbbell row','single arm dumbbell row','system',true),
  ('dumbbell-bench-press','db bench press','db bench press','system',true),
  ('dumbbell-bench-press','dumbbell bench','dumbbell bench','system',true),
  ('dumbbell-bench-press','db bench','db bench','system',true),
  ('dumbbell-bench-press','dumbbell chest press','dumbbell chest press','system',true),
  ('barbell-bench-press','bb bench press','bb bench press','system',true),
  ('barbell-bench-press','bench press','bench press','system',true),
  ('barbell-bench-press','barbell bench','barbell bench','system',true),
  ('dumbbell-romanian-deadlift','db rdl','db rdl','system',true),
  ('dumbbell-romanian-deadlift','dumbbell rdl','dumbbell rdl','system',true),
  ('dumbbell-romanian-deadlift','dumbbell romanian deadlifts','dumbbell romanian deadlifts','system',true),
  ('barbell-overhead-press','bb overhead press','bb overhead press','system',true),
  ('barbell-overhead-press','barbell shoulder press','barbell shoulder press','system',true),
  ('barbell-overhead-press','overhead press','overhead press','system',true),
  ('barbell-overhead-press','ohp','ohp','system',true),
  ('dumbbell-shoulder-press','db shoulder press','db shoulder press','system',true),
  ('dumbbell-shoulder-press','dumbbell overhead press','dumbbell overhead press','system',true),
  ('dumbbell-shoulder-press','db overhead press','db overhead press','system',true),
  ('seated-cable-row','cable row','cable row','system',true),
  ('seated-cable-row','seated row','seated row','system',true),
  ('lat-pulldown','lat pull down','lat pull down','system',true),
  ('lat-pulldown','pulldown','pulldown','system',true),
  ('lat-pulldown','lat pulldowns','lat pulldowns','system',true),
  ('triceps-pushdown','tricep pushdown','tricep pushdown','system',true),
  ('triceps-pushdown','cable triceps pushdown','cable triceps pushdown','system',true),
  ('triceps-pushdown','triceps pressdown','triceps pressdown','system',true),
  ('calf-raise','calf raises','calf raises','system',true),
  ('calf-raise','standing calf raise','standing calf raise','system',true),
  ('plank','front plank','front plank','system',true),
  ('side-plank','side plank hold','side plank hold','system',true),
  ('pallof-press','pallof presses','pallof presses','system',true),
  ('farmer-carry','farmer walk','farmer walk','system',true),
  ('suitcase-carry','suitcase walk','suitcase walk','system',true),
  ('leg-extension','leg extensions','leg extensions','system',true),
  ('seated-leg-curl','seated hamstring curl','seated hamstring curl','system',true),
  ('seated-leg-curl','hamstring curl machine','hamstring curl machine','system',true),
  ('split-squat','split squats','split squats','system',true),
  ('bulgarian-split-squat','rear foot elevated split squat','rear foot elevated split squat','system',true),
  ('bulgarian-split-squat','rfess','rfess','system',true),
  ('forward-lunge','forward lunges','forward lunges','system',true),
  ('reverse-lunge','reverse lunges','reverse lunges','system',true),
  ('walking-lunge','walking lunges','walking lunges','system',true)
on conflict do nothing;

-- Preserve canonical identity snapshots when workouts are finalized after this migration.
create or replace function public.finalize_workout_session(p_session jsonb, p_exercise_results jsonb, p_set_results jsonb default '[]'::jsonb)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved public.workout_sessions;
  actor uuid := auth.uid();
  selected_workout_template_id uuid := (p_session->>'workout_template_id')::uuid;
  authoritative_workout record;
begin
  -- SECURITY DEFINER is required so the session header, exercise rows, and set rows share one transaction.
  -- Because it bypasses table RLS, this function compensates with explicit auth.uid() ownership checks and
  -- rejects caller-supplied child IDs unless they belong to the selected workout and the newly saved session.
  -- Snapshot metadata is derived from workout_templates, plan_phases, workout_plans, and exercise_entries;
  -- caller JSON supplies only new child IDs, exercise_entry_id, completion status, and set status rows.
  if actor is null then raise exception 'authenticated user required'; end if;
  if selected_workout_template_id is null then raise exception 'workout_template_id is required'; end if;
  if jsonb_typeof(p_exercise_results) <> 'array' then raise exception 'exercise results payload must be an array'; end if;
  if jsonb_typeof(p_set_results) <> 'array' then raise exception 'set results payload must be an array'; end if;

  select wt.id as workout_template_id, wt.name as workout_name, wt.phase_id, pp.plan_id, pp.phase_number, pp.goal
  into authoritative_workout
  from public.workout_templates wt
  join public.plan_phases pp on pp.id = wt.phase_id
  join public.workout_plans wp on wp.id = pp.plan_id
  where wt.id = selected_workout_template_id and wp.user_id = actor and wp.archived_at is null;

  if authoritative_workout.workout_template_id is null then raise exception 'workout is not owned by authenticated user'; end if;

  if exists (select 1 from jsonb_array_elements(p_exercise_results) as r(value) where nullif(value->>'id','') is null) then
    raise exception 'exercise result id is required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value) group by value->>'id' having count(*) > 1
  ) then raise exception 'duplicate exercise result ids are not allowed'; end if;
  if exists (
    select 1 from public.exercise_results er join jsonb_array_elements(p_exercise_results) as r(value) on er.id = (value->>'id')::uuid
  ) then raise exception 'exercise result ids must be new'; end if;
  if exists (select 1 from jsonb_array_elements(p_exercise_results) as r(value) where nullif(value->>'exercise_entry_id','') is null) then
    raise exception 'exercise_entry_id is required';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value) group by value->>'exercise_entry_id' having count(*) > 1
  ) then raise exception 'duplicate exercise_entry_id values are not allowed'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value)
    where nullif(value->>'source_workout_template_id','') is not null and (value->>'source_workout_template_id')::uuid <> selected_workout_template_id
  ) then raise exception 'source_workout_template_id must match selected workout'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_exercise_results) as r(value)
    left join public.exercise_entries ee on ee.id = (value->>'exercise_entry_id')::uuid and ee.workout_template_id = selected_workout_template_id
    where ee.id is null
  ) then raise exception 'exercise_entry_id must belong to selected workout'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_exercise_results) as r(value)
    where coalesce(value->>'completion_status','incomplete') not in ('completed','partial','skipped','incomplete')
  ) then raise exception 'invalid exercise completion_status'; end if;

  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where nullif(value->>'exercise_result_id','') is null) then
    raise exception 'set exercise_result_id is required';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_set_results) as sr(value)
    left join jsonb_array_elements(p_exercise_results) as er(value) on (er.value->>'id') = (sr.value->>'exercise_result_id')
    where er.value is null
  ) then raise exception 'set rows must reference exercise results created by this finalize call'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'prescribed' and nullif(value->>'prescribed_set_index','') is null) then raise exception 'prescribed rows require prescribed_set_index'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'added' and nullif(value->>'prescribed_set_index','') is not null) then raise exception 'added rows must not include prescribed_set_index'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'status') = 'completed' and nullif(value->>'completed_at','') is null) then raise exception 'completed set rows require completed_at'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'status') <> 'completed' and nullif(value->>'completed_at','') is not null) then raise exception 'incomplete set rows must not include completed_at'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) group by value->>'exercise_result_id', value->>'set_order' having count(*) > 1) then raise exception 'duplicate set_order values are not allowed'; end if;
  if exists (select 1 from jsonb_array_elements(p_set_results) as r(value) where (value->>'set_kind') = 'prescribed' group by value->>'exercise_result_id', value->>'prescribed_set_index' having count(*) > 1) then raise exception 'duplicate prescribed_set_index values are not allowed'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_set_results) as sr(value)
    join jsonb_array_elements(p_exercise_results) as erj(value) on erj.value->>'id' = sr.value->>'exercise_result_id'
    join public.exercise_entries ee on ee.id = (erj.value->>'exercise_entry_id')::uuid
    where (ee.tracking_type = 'reps_only' and nullif(sr.value->>'actual_load','') is not null)
       or (ee.tracking_type <> 'weight_reps' and nullif(sr.value->>'actual_load','') is not null)
       or (ee.tracking_type not in ('weight_reps','reps_only') and nullif(sr.value->>'actual_reps','') is not null)
  ) then raise exception 'set metrics are invalid for exercise tracking type'; end if;

  insert into public.workout_sessions (id, user_id, workout_template_id, source_plan_id, source_phase_id, completed_on, completed, pain_occurred, perceived_difficulty, notes, recommendation, phase_id_at_completion, phase_name_snapshot, workout_name_snapshot, started_at, finished_at, elapsed_seconds, elapsed_source)
  values ((p_session->>'id')::uuid, actor, selected_workout_template_id, authoritative_workout.plan_id, authoritative_workout.phase_id, (p_session->>'completed_on')::date, (p_session->>'completed')::boolean, (p_session->>'pain_occurred')::boolean, p_session->>'perceived_difficulty', coalesce(p_session->>'notes',''), p_session->>'recommendation', authoritative_workout.phase_id, coalesce('Phase ' || authoritative_workout.phase_number::text || ': ' || authoritative_workout.goal, authoritative_workout.goal), authoritative_workout.workout_name, (p_session->>'started_at')::timestamptz, (p_session->>'finished_at')::timestamptz, coalesce((p_session->>'elapsed_seconds')::integer,0), coalesce(p_session->>'elapsed_source','server_timestamp'))
  returning * into saved;

  insert into public.exercise_results (id, workout_session_id, source_workout_template_id, exercise_entry_id, source_exercise_id, canonical_exercise_id, exercise_name_snapshot, exercise_order, tracking_type, unilateral_mode, load_unit, distance_unit, primary_value_label, secondary_value_label, prescribed_target_text, completion_status)
  select (r.value->>'id')::uuid, saved.id, selected_workout_template_id, ee.id, ee.source_exercise_id, ee.canonical_exercise_id, ee.name, ee.sort_order, ee.tracking_type, ee.unilateral_mode, ee.load_unit, ee.distance_unit, ee.primary_value_label, ee.secondary_value_label, (ee.sets::text || ' sets × ' || ee.reps), coalesce(r.value->>'completion_status','incomplete')
  from jsonb_array_elements(p_exercise_results) as r(value)
  join public.exercise_entries ee on ee.id = (r.value->>'exercise_entry_id')::uuid and ee.workout_template_id = selected_workout_template_id;

  insert into public.exercise_set_results (exercise_result_id, set_order, prescribed_set_index, set_kind, status, prescribed_load, prescribed_reps, prescribed_duration_seconds, prescribed_distance, actual_load, actual_reps, actual_duration_seconds, actual_distance, actual_left_load, actual_left_reps, actual_left_duration_seconds, actual_left_distance, actual_right_load, actual_right_reps, actual_right_duration_seconds, actual_right_distance, completed_at)
  select (value->>'exercise_result_id')::uuid, (value->>'set_order')::integer, nullif(value->>'prescribed_set_index','')::integer, value->>'set_kind', value->>'status', nullif(value->>'prescribed_load','')::numeric, nullif(value->>'prescribed_reps','')::integer, nullif(value->>'prescribed_duration_seconds','')::integer, nullif(value->>'prescribed_distance','')::numeric, nullif(value->>'actual_load','')::numeric, nullif(value->>'actual_reps','')::integer, nullif(value->>'actual_duration_seconds','')::integer, nullif(value->>'actual_distance','')::numeric, nullif(value->>'actual_left_load','')::numeric, nullif(value->>'actual_left_reps','')::integer, nullif(value->>'actual_left_duration_seconds','')::integer, nullif(value->>'actual_left_distance','')::numeric, nullif(value->>'actual_right_load','')::numeric, nullif(value->>'actual_right_reps','')::integer, nullif(value->>'actual_right_duration_seconds','')::integer, nullif(value->>'actual_right_distance','')::numeric, nullif(value->>'completed_at','')::timestamptz
  from jsonb_array_elements(p_set_results) as r(value);

  return saved;
end;
$$;

update public.exercise_entries
set canonical_exercise_id = source_exercise_id
where source_exercise_id in (select id from public.exercise_identities)
  and canonical_exercise_id is null;

update public.exercise_results
set canonical_exercise_id = source_exercise_id
where source_exercise_id in (select id from public.exercise_identities)
  and canonical_exercise_id is null;
