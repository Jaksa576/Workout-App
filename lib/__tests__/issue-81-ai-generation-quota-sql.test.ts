import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const originalMigrationPath =
  "supabase/migrations/20260718235045_issue64_ai_generation_quota.sql";
const followUpMigrationPath =
  "supabase/migrations/20260719011847_issue81_ai_quota_indeterminate_success.sql";
const verificationPath =
  "supabase/verification/issue-81-ai-quota-indeterminate-success-readonly.sql";

const originalMigration = readFileSync(originalMigrationPath, "utf8");
const migration = readFileSync(followUpMigrationPath, "utf8");
const schema = readFileSync("supabase/schema.sql", "utf8");
const verification = readFileSync(verificationPath, "utf8");

describe("Issue #81 indeterminate-success quota SQL", () => {
  it("keeps the applied Issue #64 migration byte-for-byte unchanged", () => {
    expect(
      createHash("sha256").update(originalMigration).digest("hex"),
    ).toBe("c68fc647347f4c4f00f61e2f1a0ae4c3608bd73faad411976e91c98410bc2337");
  });

  it("adds a rerunnable operational-only indeterminate-success state", () => {
    for (const source of [migration, schema]) {
      expect(source).toContain("'indeterminate_success'");
      expect(source).toContain(
        "status in ('reserved', 'succeeded', 'indeterminate_success')",
      );
      expect(source).toContain(
        "set status = 'indeterminate_success', completed_at = statement_timestamp()",
      );
    }
    expect(migration).toContain("drop constraint if exists ai_generation_attempts_status_check");
    expect(migration).toContain("create or replace function public.reserve_ai_generation_attempt");
    expect(migration).toContain("create or replace function public.complete_ai_generation_attempt");
  });

  it("preserves definitive success when its completion response was lost", () => {
    for (const source of [migration, schema]) {
      expect(source).toContain(
        "v_status = 'succeeded' and p_outcome = 'indeterminate_success'",
      );
      expect(source).toContain("'succeeded',");
      expect(source).toContain("'indeterminate_success',");
    }
  });

  it("keeps RPC execution service-role-only with fixed search paths", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public, pg_temp");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });

  it("stores no sensitive content and touches no plan or progression tables", () => {
    for (const forbidden of [
      "raw_prompt",
      "raw_response",
      "api_key",
      "generated_plan",
      "plan_contents",
      "workout_plans",
      "plan_phases",
      "workout_templates",
      "exercise_entries",
      "workout_sessions",
      "exercise_results",
      "exercise_set_results",
      "progression_rules",
    ]) {
      expect(migration).not.toContain(forbidden);
    }
  });

  it("ships a separate read-only follow-up verification", () => {
    expect(verification).toContain("indeterminate success status constraint is missing");
    expect(verification).toContain("conservative success-capacity behavior");
    expect(verification).toContain("uncertain-success behavior");
    expect(verification).toContain("service_role function grants are missing");
    expect(verification).toContain("quota functions reference plan/workout/session/progression tables");
    expect(verification).not.toContain("insert into public.ai_generation_attempts");
    expect(verification).not.toContain("update public.ai_generation_attempts");
  });
});
