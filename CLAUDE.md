<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **FinTrack-Pro** (1990 symbols, 2940 relationships, 52 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

---

# CLAUDE.md - Claude-Specific Instructions

> **START HERE**: This file defines Claude-specific behavior for this workspace.
> Before any code changes, read `.agent/rules/workflow.md`.
> At session start, read `docs/SESSIONLOG.md`.

---

## 1) Git Workflow (Non-negotiable)

> **MANDATORY:** Before any code changes, read `.agent/rules/workflow.md` for complete workflow rules.

### Branch Rules
- **NEVER code directly in `main` branch.** All development must happen in feature/fix branches.
- **Branch naming convention**: `<type>/<short-description>` where type is:
  - `feature/` - New functionality
  - `fix/` - Bug fixes
  - `hotfix/` - Critical production fixes
  - `refactor/` - Code restructuring without behavior change
  - `docs/` - Documentation only
  - `test/` - Adding or updating tests
  - `chore/` - Maintenance tasks

### Workflow Process
1. **Plan First**: Always create a plan in `plans/` folder before coding
2. **Get Confirmation**: Wait for user approval before proceeding
3. **Create Branch**: Branch from `main` with clear naming
4. **Implement**: Make changes in the feature branch
5. **Commit Often**: Commit after every logical change with detailed messages
6. **Update CHANGELOG**: Add entry for every change
7. **Merge on Approval**: Only merge to `main` when user explicitly commands

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## 2) Planning & Documentation

### Planning Rules
- **Always plan first** and ask user confirmation before implementing
- **Store plans** in `plans/` folder with descriptive filenames
- **Plans are NOT documentation** - they are implementation blueprints

### Documentation Rules
- **Documentation** goes in `docs/` folder
- **CHANGELOG.md** must be updated for every change
- **TODO.md** must track all tasks from plans with source references
- **SESSIONLOG.md** must be updated after every task/session
- **File organization**:
  - `plans/` - Implementation plans (before coding)
  - `docs/` - Permanent documentation
  - `.agent/` - Agent workflows and rules

**Always read `.agent/rules/workflow.md` before starting any code changes.**

**Always read `docs/SESSIONLOG.md` at the start of every session.**

---

## 3) Parallel Agents

- **Use parallel agents** for smaller, independent tasks
- **Launch multiple agents concurrently** when possible
- **Each agent** should handle a specific, well-defined task
- **Coordinate results** before merging to main

---

## 4) GitNexus Integration

- **MUST run impact analysis** before editing any symbol
- **MUST run detect_changes()** before committing
- **MUST run `gitnexus analyze` before every `git push`**
- **MUST warn user** if impact analysis returns HIGH or CRITICAL risk

---

## 5) Core Principles

- **Clarify Ambiguity First**: Ask 1-2 clarifying questions before proceeding
- **Code Only What Was Asked**: Follow scope strictly
- **Minimum Viable Change**: Simplest fix that works
- **Reuse Before Rewriting**: Prefer existing modules
- **File Length Limit**: Keep every file under 300 LOC
- **Configuration and Secrets**: Load from environment variables only

---

## 6) Execution Discipline

- **Run only necessary commands**
- **Timeout**: Default 60s; cap at 70-80s for long-running commands
- **Permission errors**: Explain clearly and propose safe manual steps
- **New dependencies**: Do not add unless truly necessary and user agrees
