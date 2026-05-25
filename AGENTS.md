# AGENTS.md - Working Conventions

---

## 1) Language
- **Repository artifacts (mandatory)**: All documentation/guides, code comments, and any text written into files should be in **English**.
- **Conversation**: Replies in the chat should be in **English**.

---

## 2) Core Principles (Non-negotiable)
- Clarify Ambiguity First: If a requirement is unclear or incomplete, ask 1-2 clarifying questions before proceeding. Never guess.
- Code Only What Was Asked: Follow the PRD/ticket scope strictly; no extra features.
- Minimum Viable Change: Deliver the simplest, most idempotent fix that works; avoid over-engineering.
- Reuse Before Rewriting: Prefer existing modules or utilities; avoid duplication.
- File Length Limit: Keep every file under 300 LOC; if a change would exceed this, pause and propose a refactor or split plan.
- Configuration and Secrets: Load all secrets or config from environment variables only; never hardcode.
- When writing code, aim for simplicity and readability, not just brevity. Short code that is hard to read is worse than slightly longer code that is clear.
- Clean Up Temporary Files: Delete any temporary test files immediately after use.

### Core Directives
- WRITE CODE ONLY TO SPEC.
- MINIMUM, NOT MAXIMUM.
- ONE SIMPLE SOLUTION.
- CLARIFY, DON'T ASSUME.

### Philosophy (Non-negotiables)
- Do not add unnecessary files or modules; if a new file is unavoidable, justify it.
- Do not change architecture or patterns unless explicitly required and justified.
- Prioritize readability and maintainability over clever or complex code.

---

## 3) Decision Order & Clarification Gate
- **Rule precedence (highest to lowest)**:
  1. Safety and non-destructive behavior
  2. Core Principles (Section 2)
  3. Explicit user request and task scope
  4. Dynamic context loading rules
  5. Output/formatting preferences
- **When to ask before execution**:
  - Missing required inputs (paths, target environment, acceptance criteria)
  - Multiple valid implementation paths with materially different outcomes
  - Any potentially destructive or irreversible action
- **When to execute directly**:
  - Task is clear, low-risk, and can be completed with minimum viable change
- **Question workflow**:
  - Prefer a dedicated question tool when available to ask 1-2 short, decision-driving questions
  - If no question tool is available, ask in chat first, wait for user answer, then execute
  - Do not guess missing critical requirements

---

## 4) Context Discovery & File Reading
- **Before editing/creating files**: Read all relevant files in full to understand context.
- **Before starting a task**: Read at minimum `README.md` and relevant files in `docs/*` (if present).
- **Default discovery tool**: Use `rg` to find source-of-truth implementations quickly.
- **`docs/structure.md` is optional**: Use it when present for broad navigation; do not block work if missing.
- **Structure index updates**: Create or refresh `docs/structure.md` only when requested, or when a major restructure makes navigation unreliable.

---



## 5) Execution Discipline
- **Run only necessary commands**; avoid destructive commands (`rm`, `git reset`...) unless explicitly requested.
- **Timeout**: Default 60s; cap at 70-80s for potentially long-running commands.
- **Permission errors**: Explain clearly and propose safe manual steps.
- **New dependencies**: Do not add unless truly necessary and user agrees.

---

## 6) Auto-Documentation (Conditional)
After completing impactful changes (feature/bugfix/schema/architecture), update briefly:
- `README.md`: If stable info (stack/versions/overview) is affected.
- `SESSIONLOG.md`, `CHANGELOG.md`, `docs/structure.md`: Update if the file exists, or create only when explicitly requested.
- `SESSIONLOG.md`: Append a new session entry with summary, files changed, and any notable decisions.
- `CHANGELOG.md` format (when used): `YYYY-MM-DD: <Fix|Add|Change|Remove> <what> at <path> - <impact> (completed).`

## gitnexus

This project uses gitnexus for codebase intelligence, code maps, and structural relationship tracking.

Rules:
- Run `gitnexus analyze` to update the codebase index after making changes.
- Use gitnexus tools/MCP for impact analysis and codebase queries.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **FinTrack-Pro** (1312 symbols, 1903 relationships, 15 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/FinTrack-Pro/context` | Codebase overview, check index freshness |
| `gitnexus://repo/FinTrack-Pro/clusters` | All functional areas |
| `gitnexus://repo/FinTrack-Pro/processes` | All execution flows |
| `gitnexus://repo/FinTrack-Pro/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
