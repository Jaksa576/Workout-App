import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260718235045_issue64_ai_generation_quota.sql",
  "utf8",
);
const schema = readFileSync("supabase/schema.sql", "utf8");
const routeSource = readFileSync("app/api/ai/plan-drafts/route.ts", "utf8");
const orchestrationSource = readFileSync("lib/ai-generation/orchestrate-generation.ts", "utf8");
const verification = readFileSync(
  "supabase/verification/issue-64-ai-generation-quota-readonly.sql",
  "utf8",
);

describe("Issue #64 AI generation quota SQL", () => {
  it("defines additive operational-only state with RLS, constraints, and indexes", () => {
    for (const source of [migration, schema]) {
      expect(source).toContain("create table if not exists public.ai_generation_attempts");
      expect(source).toContain("alter table public.ai_generation_attempts enable row level security");
      expect(source).toContain('policy "AI generation attempts are readable by owner"');
      expect(source).toContain("ai_generation_attempts_status_check");
      expect(source).toContain("ai_generation_attempts_user_quota_status_idx");
      expect(source).toContain("ai_generation_attempts_user_quota_request_unique");
    }
    for (const forbidden of ["raw_prompt", "raw_response", "api_key", "generated_plan", "plan_contents"]) {
      expect(migration).not.toContain(forbidden);
    }
  });

  it("uses UTC as the server-owned fallback quota date and serializes reservations", () => {
    expect(migration).toContain("statement_timestamp() at time zone 'UTC'");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("status in ('reserved', 'succeeded')");
    expect(migration).toContain("status = 'provider_failure'");
    expect(migration).toContain("interval '2 minutes'");
  });

  it("keeps quota mutation service-role-only and validates ownership parameters", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public, pg_temp");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("where id = p_attempt_id and user_id = p_user_id");
  });

  it("does not reference or write plan, workout, session, or progression tables", () => {
    for (const table of [
      "workout_plans",
      "plan_phases",
      "workout_templates",
      "exercise_entries",
      "workout_sessions",
      "exercise_results",
      "exercise_set_results",
      "progression_rules",
    ]) {
      expect(migration).not.toContain(table);
    }
  });

  it("keeps generation separate from every structured plan persistence path", () => {
    const generationSource = `${routeSource}\n${orchestrationSource}`;
    expect(generationSource).not.toContain("createStructuredPlanForUser");
    expect(generationSource).not.toMatch(/\.from\(["'](workout_plans|plan_phases|workout_templates|exercise_entries)["']\)/);
    expect(generationSource).not.toContain("/api/plans");
  });
  it("ships read-only verification for objects, RLS, grants, safe columns, and function behavior", () => {
    expect(verification).toContain("RLS is not enabled");
    expect(verification).toContain("forbidden sensitive/generated columns");
    expect(verification).toContain("service_role function grants are missing");
    expect(verification).toContain("pg_advisory_xact_lock");
    expect(verification).toContain("quota functions reference plan/workout/session/progression tables");
    expect(verification).not.toContain("insert into public.ai_generation_attempts");
    expect(verification).not.toContain("update public.ai_generation_attempts");
  });
});
