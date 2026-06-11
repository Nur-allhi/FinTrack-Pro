# AGENTS.md - Working Conventions

> **START HERE**: This file defines how AI agents behave in this workspace.
> Before any code changes, read `.agent/rules/workflow.md`.
> At session start, read `docs/SESSIONLOG.md`.

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

## 3) Git Workflow & Branching Strategy

> **MANDATORY:** Before any code changes, read `.agent/rules/workflow.md` for complete workflow rules.

### Branch Rules (Non-negotiable)
- **NEVER code directly in `main` branch.** All development must happen in feature/fix branches.
- **Branch naming convention**: `<type>/<short-description>` where type is:
  - `feature/` - New functionality
  - `fix/` - Bug fixes
  - `hotfix/` - Critical production fixes
  - `refactor/` - Code restructuring without behavior change
  - `docs/` - Documentation only
  - `test/` - Adding or updating tests
  - `chore/` - Maintenance tasks
- Examples: `feature/add-recurring-transactions`, `fix/calculate-interest-correctly`, `docs/update-api-reference`

### Workflow Process
1. **Plan First**: Always create a plan in `plans/` folder before coding
2. **Get Confirmation**: Wait for user approval before proceeding
3. **Create Branch**: Branch from `main` with clear naming
4. **Implement**: Make changes in the feature branch
5. **Commit Often**: Commit after every logical change with detailed messages
6. **Update CHANGELOG**: Add entry for every change (see Section 5)
7. **Merge on Approval**: Only merge to `main` when user explicitly commands

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```
- **type**: feat, fix, docs, style, refactor, test, chore
- **scope**: module/feature affected (optional)
- **subject**: imperative mood, max 50 chars
- **body**: what and why, not how (max 72 chars per line)
- **footer**: breaking changes, issue references

Examples:
```
feat(transactions): add recurring transaction support

- Implement RecurringTransaction model
- Add cron job for auto-generation
- Update API endpoints

Closes #123
```

```
fix(interest): correct daily interest calculation

Was using 365 days instead of actual days in month.
Changed to use getDaysInMonth() for accuracy.

Fixes #456
```

---

## 4) Decision Order & Clarification Gate
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

## 5) Documentation & File Organization

### CHANGELOG Format
- **Always update `CHANGELOG.md`** for every change, no matter how minor
- Format: `YYYY-MM-DD: <Fix|Add|Change|Remove> <what> at <path> - <impact> (completed).`
- Example: `2026-06-03: Add recurring transaction feature at src/features/recurring/ - Enables automated periodic transactions (completed).`

### TODO Tracking Format
- **Always update `docs/TODO.md`** for every task from a plan
- Format: `- [ ] **T-XXX** Task description (estimated time) — \`📄 plans/PLAN_NAME.md:§Section\``
- Mark completed: `- [x] **T-XXX** Task description (estimated time) — \`📄 plans/PLAN_NAME.md:§Section\``
- Reference the source plan in each task for traceability

### File Organization
- **Plans**: Store in `plans/` folder with descriptive filename
- **Documentation**: Store in `docs/` folder (not plans)
- **Temporary files**: Delete immediately after use
- **Agent workflows**: Use `.agent/` folder for best workflow practices

### Documentation Hierarchy
```
plans/          # Implementation plans (before coding)
docs/           # Permanent documentation
.agent/         # Agent workflows and rules
AGENTS.md       # Working conventions (this file)
CLAUDE.md       # Claude-specific instructions
```

**Always read `.agent/rules/workflow.md` before starting any code changes.**

---

## 6) Context Discovery & File Reading
- **Before editing/creating files**: Read all relevant files in full to understand context.
- **Before starting a task**: Read `docs/SESSIONLOG.md` to understand what was fixed/implemented in the last session.
- **Before starting a task**: Read at minimum `README.md` and relevant files in `docs/*` (if present).
- **Default discovery tool**: Use `rg` to find source-of-truth implementations quickly.
- **`docs/structure.md` is optional**: Use it when present for broad navigation; do not block work if missing.
- **Structure index updates**: Create or refresh `docs/structure.md` only when requested, or when a major restructure makes navigation unreliable.

---

## 7) Session Log
- **Always update `docs/SESSIONLOG.md`** after finishing any task or session
- **Always read `docs/SESSIONLOG.md`** at the start of every session to get context
- Format:
  ```
  ## Session N — DD MMM YYYY (Short Title)
  
  > **Branch**: `branch-name`
  > **Tasks**: T-XXX, T-YYY, T-ZZZ
  > **Status**: completed | in-progress | partial
  
  ### Summary
  Brief description of what was accomplished.
  
  ### Changes
  - What was changed and why
  
  ### Files Changed
  - `path/to/file.ts` — what changed
  
  ### Verification
  - How the changes were verified (tests, lint, etc.)
  
  ### Next Steps
  - What should be done next (if any)
  ```

---

## 7) Execution Discipline
- **Run only necessary commands**; avoid destructive commands (`rm`, `git reset`...) unless explicitly requested.
- **Timeout**: Default 60s; cap at 70-80s for potentially long-running commands.
- **Permission errors**: Explain clearly and propose safe manual steps.
- **New dependencies**: Do not add unless truly necessary and user agrees.

---

## 8) Auto-Documentation (Conditional)
After completing impactful changes (feature/bugfix/schema/architecture), update briefly:
- `README.md`: If stable info (stack/versions/overview) is affected.
- `docs/SESSIONLOG.md`, `CHANGELOG.md`, `docs/structure.md`: Update if the file exists, or create only when explicitly requested.
- `docs/SESSIONLOG.md`: Append a new session entry with summary, files changed, and any notable decisions.
- `CHANGELOG.md` format (when used): `YYYY-MM-DD: <Fix|Add|Change|Remove> <what> at <path> - <impact> (completed).`

## gitnexus

This project uses gitnexus for codebase intelligence, code maps, and structural relationship tracking.

Rules:
- Run `gitnexus analyze` to update the codebase index after making changes.
- Run `gitnexus detect_changes` before committing to verify affected scope.
- **MUST run `gitnexus analyze` before every `git push`** to ensure the index is up-to-date.
- Use gitnexus tools/MCP for impact analysis and codebase queries.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **FinTrack-Pro** (2208 symbols, 4287 relationships, 149 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

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
