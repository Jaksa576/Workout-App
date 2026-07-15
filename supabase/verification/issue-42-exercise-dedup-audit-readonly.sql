-- Issue #42 exercise library deduplication audit.
-- Read-only: this file contains SELECT statements only and must not be used for consolidation writes.
-- Keep normalization aligned with lib/exercise-identity.ts normalizeExerciseLookupKey:
-- trim -> lower en-US equivalent -> remove apostrophes -> replace non-alphanumerics with spaces -> collapse spaces -> trim.

-- 1) Hosted summary totals. Historical result rows are intentionally reported as historical results,
-- not active workout-session records.
select
  'summary' as result_set,
  (select count(i.id) from public.exercise_identities i where i.owner_scope = 'system') as system_identity_count,
  (select count(a.id) from public.exercise_aliases a where a.owner_scope = 'system' and a.reviewed) as reviewed_system_alias_count,
  (select count(ee.id) from public.exercise_entries ee) as exercise_entry_count,
  (select count(ee.id) from public.exercise_entries ee where ee.canonical_exercise_id is null) as unresolved_or_custom_entry_count,
  (select count(distinct ee.workout_template_id) from public.exercise_entries ee) as workout_templates_with_entries_count,
  (select count(er.id) from public.exercise_results er) as historical_result_count,
  (select count(distinct er.workout_session_id) from public.exercise_results er) as historical_sessions_with_results_count,
  (select count(i.id) from public.exercise_identities i where i.owner_scope = 'user') as user_owned_identity_count,
  (select count(ambiguous_aliases.normalized_lookup_key) from (
    select a.normalized_lookup_key
    from public.exercise_aliases a
    where a.reviewed and a.owner_scope = 'system'
    group by a.normalized_lookup_key
    having count(distinct a.exercise_identity_id) > 1
  ) ambiguous_aliases) as ambiguous_reviewed_alias_count;

-- 2) Every active system identity and distinct reference counts by class. References are pre-aggregated
-- before joining to avoid OR-join multiplication and false one-row counts.
with entry_refs as (
  select
    coalesce(ee.canonical_exercise_id, nullif(ee.source_exercise_id, '')) as identity_id,
    count(distinct ee.id) as exercise_entry_count,
    count(distinct ee.workout_template_id) as workout_template_count
  from public.exercise_entries ee
  where coalesce(ee.canonical_exercise_id, nullif(ee.source_exercise_id, '')) is not null
  group by coalesce(ee.canonical_exercise_id, nullif(ee.source_exercise_id, ''))
), result_refs as (
  select
    coalesce(er.canonical_exercise_id, nullif(er.source_exercise_id, '')) as identity_id,
    count(distinct er.id) as historical_result_count,
    count(distinct er.workout_session_id) as historical_session_count
  from public.exercise_results er
  where coalesce(er.canonical_exercise_id, nullif(er.source_exercise_id, '')) is not null
  group by coalesce(er.canonical_exercise_id, nullif(er.source_exercise_id, ''))
), alias_refs as (
  select a.exercise_identity_id as identity_id, count(distinct a.id) as reviewed_alias_count
  from public.exercise_aliases a
  where a.owner_scope = 'system' and a.reviewed
  group by a.exercise_identity_id
)
select
  'system_identity_reference_counts' as result_set,
  i.id as exercise_identity_id,
  i.display_name,
  i.normalized_lookup_key,
  i.owner_scope,
  i.active,
  i.superseded_by,
  coalesce(ar.reviewed_alias_count, 0) as reviewed_alias_count,
  coalesce(er.exercise_entry_count, 0) as exercise_entry_count,
  coalesce(er.workout_template_count, 0) as workout_template_count,
  coalesce(rr.historical_result_count, 0) as historical_result_count,
  coalesce(rr.historical_session_count, 0) as historical_session_count
from public.exercise_identities i
left join alias_refs ar on ar.identity_id = i.id
left join entry_refs er on er.identity_id = i.id
left join result_refs rr on rr.identity_id = i.id
where i.owner_scope = 'system'
order by i.display_name, i.id;

-- 3) Every reviewed alias, including zero-match entry/result counts.
with normalized_entries as (
  select
    ee.id,
    lower(trim(regexp_replace(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))) as normalized_lookup_key
  from public.exercise_entries ee
), normalized_results as (
  select
    er.id,
    lower(trim(regexp_replace(regexp_replace(regexp_replace(er.exercise_name_snapshot, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))) as normalized_lookup_key
  from public.exercise_results er
)
select
  'reviewed_alias_match_counts' as result_set,
  a.exercise_identity_id,
  i.display_name as canonical_display_name,
  a.alias,
  a.normalized_lookup_key,
  count(distinct ne.id) as matching_exercise_entry_count,
  count(distinct nr.id) as matching_historical_result_name_count
from public.exercise_aliases a
join public.exercise_identities i on i.id = a.exercise_identity_id
left join normalized_entries ne on ne.normalized_lookup_key = a.normalized_lookup_key
left join normalized_results nr on nr.normalized_lookup_key = a.normalized_lookup_key
where a.owner_scope = 'system' and a.reviewed
group by a.exercise_identity_id, i.display_name, a.alias, a.normalized_lookup_key
order by i.display_name, a.alias;

-- 4) Exhaustive normalized exercise-entry groups with metadata variants and owner/source signals.
with normalized_entries as (
  select
    ee.id,
    ee.workout_template_id,
    ee.name,
    lower(trim(regexp_replace(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))) as normalized_lookup_key,
    nullif(ee.source_exercise_id, '') as source_exercise_id,
    ee.canonical_exercise_id,
    ee.tracking_type,
    ee.unilateral_mode,
    ee.load_unit,
    ee.distance_unit,
    ee.primary_value_label,
    ee.secondary_value_label,
    ee.reps
  from public.exercise_entries ee
), candidate_names as (
  select normalized_lookup_key, id as candidate_id, display_name as candidate_name, 'canonical_name' as match_kind
  from public.exercise_identities
  where owner_scope = 'system'
  union all
  select normalized_lookup_key, exercise_identity_id as candidate_id, alias as candidate_name, 'reviewed_alias' as match_kind
  from public.exercise_aliases
  where owner_scope = 'system' and reviewed
)
select
  'normalized_entry_groups' as result_set,
  ne.normalized_lookup_key,
  count(distinct ne.id) as exercise_entry_count,
  count(distinct ne.workout_template_id) as workout_template_count,
  count(distinct ne.name) as presentation_variant_count,
  array_agg(distinct ne.name order by ne.name) as presentation_variants,
  array_agg(distinct concat_ws('|', ne.tracking_type, ne.unilateral_mode, coalesce(ne.load_unit, ''), coalesce(ne.distance_unit, ''), coalesce(ne.primary_value_label, ''), coalesce(ne.secondary_value_label, ''), coalesce(ne.reps, '')) order by concat_ws('|', ne.tracking_type, ne.unilateral_mode, coalesce(ne.load_unit, ''), coalesce(ne.distance_unit, ''), coalesce(ne.primary_value_label, ''), coalesce(ne.secondary_value_label, ''), coalesce(ne.reps, ''))) as metadata_prescription_variants,
  count(distinct cn.candidate_id) as reviewed_candidate_count,
  array_agg(distinct cn.candidate_id order by cn.candidate_id) filter (where cn.candidate_id is not null) as reviewed_candidate_ids,
  count(distinct ne.id) filter (where ne.canonical_exercise_id is null) as unresolved_entry_count,
  count(distinct ne.id) filter (where ne.canonical_exercise_id is null and ne.source_exercise_id is null) as null_source_unresolved_entry_count,
  count(distinct ne.id) filter (where ne.canonical_exercise_id is null and ne.source_exercise_id is not null) as legacy_source_unresolved_entry_count,
  case
    when count(distinct cn.candidate_id) > 1 then 'ambiguous_review_required'
    when count(distinct cn.candidate_id) = 1 and count(distinct ne.id) filter (where ne.canonical_exercise_id is null) > 0 then 'possible_legacy_reference_repair'
    when count(distinct cn.candidate_id) = 0 and count(distinct ne.id) > 1 then 'possible_new_canonical_or_intentional_custom_review'
    else 'no_action_required'
  end as audit_classification
from normalized_entries ne
left join candidate_names cn on cn.normalized_lookup_key = ne.normalized_lookup_key
group by ne.normalized_lookup_key
order by unresolved_entry_count desc, exercise_entry_count desc, ne.normalized_lookup_key;

-- 5) Exact unresolved canonical-name or reviewed-alias entries that are candidates for deterministic repair,
-- pending metadata compatibility and product-owner approval.
with normalized_entries as (
  select
    ee.*,
    lower(trim(regexp_replace(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))) as normalized_lookup_key
  from public.exercise_entries ee
), candidate_names as (
  select normalized_lookup_key, id as candidate_id, display_name as reviewed_name, 'exact canonical name' as match_kind
  from public.exercise_identities
  where owner_scope = 'system' and active
  union all
  select normalized_lookup_key, exercise_identity_id as candidate_id, alias as reviewed_name, 'reviewed alias' as match_kind
  from public.exercise_aliases
  where owner_scope = 'system' and reviewed
), unique_candidates as (
  select normalized_lookup_key, min(candidate_id) as candidate_id, count(distinct candidate_id) as candidate_count
  from candidate_names
  group by normalized_lookup_key
)
select
  'unresolved_exact_or_alias_repair_candidates' as result_set,
  ne.id as exercise_entry_id,
  ne.workout_template_id,
  ne.name,
  ne.normalized_lookup_key,
  ne.source_exercise_id,
  ne.canonical_exercise_id,
  ne.tracking_type,
  ne.unilateral_mode,
  ne.load_unit,
  ne.distance_unit,
  ne.reps,
  uc.candidate_id as proposed_canonical_id,
  uc.candidate_count,
  case when uc.candidate_count = 1 then 'product_review_required_before_repair' else 'ambiguous_review_required' end as proposed_action
from normalized_entries ne
join unique_candidates uc on uc.normalized_lookup_key = ne.normalized_lookup_key
where ne.canonical_exercise_id is null
order by ne.normalized_lookup_key, ne.name, ne.id;

-- 6) Unresolved names that appear repeatedly and have no reviewed candidate: possible new canonical identities,
-- confirmed distinct variants, or intentional custom groups for product review.
with normalized_entries as (
  select
    ee.id,
    ee.name,
    lower(trim(regexp_replace(regexp_replace(regexp_replace(ee.name, '[''’]', '', 'g'), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))) as normalized_lookup_key,
    ee.tracking_type,
    ee.unilateral_mode,
    ee.load_unit,
    ee.distance_unit,
    ee.reps,
    ee.canonical_exercise_id
  from public.exercise_entries ee
), candidate_names as (
  select normalized_lookup_key from public.exercise_identities where owner_scope = 'system'
  union
  select normalized_lookup_key from public.exercise_aliases where owner_scope = 'system' and reviewed
)
select
  'repeated_unresolved_names_without_reviewed_candidate' as result_set,
  ne.normalized_lookup_key,
  count(distinct ne.id) as unresolved_entry_count,
  array_agg(distinct ne.name order by ne.name) as presentation_variants,
  array_agg(distinct concat_ws('|', ne.tracking_type, ne.unilateral_mode, coalesce(ne.load_unit, ''), coalesce(ne.distance_unit, ''), coalesce(ne.reps, '')) order by concat_ws('|', ne.tracking_type, ne.unilateral_mode, coalesce(ne.load_unit, ''), coalesce(ne.distance_unit, ''), coalesce(ne.reps, ''))) as metadata_prescription_variants,
  'review_required_proposed_new_canonical_or_intentional_custom' as proposed_action
from normalized_entries ne
left join candidate_names cn on cn.normalized_lookup_key = ne.normalized_lookup_key
where ne.canonical_exercise_id is null and cn.normalized_lookup_key is null
group by ne.normalized_lookup_key
having count(distinct ne.id) > 1
order by unresolved_entry_count desc, ne.normalized_lookup_key;

-- 7) Alias conflicts and inactive/superseded references that block automatic migration.
select
  'ambiguous_reviewed_aliases_blocker' as result_set,
  a.normalized_lookup_key,
  count(distinct a.exercise_identity_id) as identity_count,
  array_agg(distinct a.exercise_identity_id order by a.exercise_identity_id) as identity_ids
from public.exercise_aliases a
where a.reviewed and a.owner_scope = 'system'
group by a.normalized_lookup_key
having count(distinct a.exercise_identity_id) > 1
order by a.normalized_lookup_key;

with entry_refs as (
  select ee.canonical_exercise_id as identity_id, count(distinct ee.id) as exercise_entry_count
  from public.exercise_entries ee
  where ee.canonical_exercise_id is not null
  group by ee.canonical_exercise_id
), result_refs as (
  select er.canonical_exercise_id as identity_id, count(distinct er.id) as historical_result_count
  from public.exercise_results er
  where er.canonical_exercise_id is not null
  group by er.canonical_exercise_id
)
select
  'inactive_or_superseded_still_referenced' as result_set,
  i.id as exercise_identity_id,
  i.display_name,
  i.active,
  i.superseded_by,
  coalesce(er.exercise_entry_count, 0) as exercise_entry_count,
  coalesce(rr.historical_result_count, 0) as historical_result_count
from public.exercise_identities i
left join entry_refs er on er.identity_id = i.id
left join result_refs rr on rr.identity_id = i.id
where (not i.active or i.superseded_by is not null)
  and (coalesce(er.exercise_entry_count, 0) > 0 or coalesce(rr.historical_result_count, 0) > 0)
order by i.display_name;
