import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const auditSql = readFileSync("supabase/verification/issue-42-exercise-dedup-audit-readonly.sql", "utf8");

describe("Issue #42 audit SQL", () => {
  it("remains read-only and avoids false one-row count patterns", () => {
    expect(auditSql).not.toMatch(/\b(insert|update|delete|alter|create table|drop|truncate)\b/i);
    expect(auditSql).not.toMatch(/count\(\*\)/i);
  });

  it("reports exhaustive unresolved, alias, identity, result, and blocker sections", () => {
    for (const resultSet of [
      "summary",
      "system_identity_reference_counts",
      "reviewed_alias_match_counts",
      "normalized_entry_groups",
      "unresolved_exact_or_alias_repair_candidates",
      "repeated_unresolved_names_without_reviewed_candidate",
      "ambiguous_reviewed_aliases_blocker",
      "inactive_or_superseded_still_referenced"
    ]) {
      expect(auditSql).toContain(resultSet);
    }
  });

  it("pre-aggregates reference classes instead of joining entries and results through OR joins", () => {
    expect(auditSql).toContain("entry_refs as");
    expect(auditSql).toContain("result_refs as");
    expect(auditSql).not.toMatch(/join\s+public\.exercise_entries[^\n]+\s+on[^\n]+\bor\b/i);
    expect(auditSql).not.toMatch(/join\s+public\.exercise_results[^\n]+\s+on[^\n]+\bor\b/i);
  });
});
