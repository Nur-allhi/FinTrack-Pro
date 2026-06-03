---
trigger: always_on
---

# Workflow Rules - Industry Standard

> This file defines the workflow conventions for this project.

---

## 1) Git Workflow (Non-negotiable)

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
- Examples: `feature/add-recurring-transactions`, `fix/calculate-interest-correctly`, `docs/update-api-reference`

### Workflow Process
1. **Plan First**: Always create a plan in `plans/` folder before coding
2. **Get Confirmation**: Wait for user approval before proceeding
3. **Create Branch**: Branch from `main` with clear naming
4. **Implement**: Make changes in the feature branch
5. **Commit Often**: Commit after every logical change with detailed messages
6. **Update CHANGELOG**: Add entry for every change (see Section 3)
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

## 2) Planning & Documentation

### Planning Rules
- **Always plan first** and ask user confirmation before implementing
- **Store plans** in `plans/` folder with descriptive filenames
- **Plans are NOT documentation** - they are implementation blueprints
- **Plan template**:
  1. Problem statement
  2. Proposed solution
  3. Implementation steps
  4. Risk assessment
  5. Testing strategy

### Documentation Rules
- **Documentation** goes in `docs/` folder
- **CHANGELOG.md** must be updated for every change
- **File organization**:
  - `plans/` - Implementation plans (before coding)
  - `docs/` - Permanent documentation
  - `.agent/` - Agent workflows and rules
  - `AGENTS.md` - Working conventions
  - `CLAUDE.md` - Claude-specific instructions

---

## 3) CHANGELOG Format

- **Always update `CHANGELOG.md`** for every change, no matter how minor
- Format: `YYYY-MM-DD: <Fix|Add|Change|Remove> <what> at <path> - <impact> (completed).`
- Example: `2026-06-03: Add recurring transaction feature at src/features/recurring/ - Enables automated periodic transactions (completed).`

---

## 4) TODO Tracking

- **Always update `docs/TODO.md`** for every task from a plan
- Format: `- [ ] **T-XXX** Task description (estimated time) — \`📄 plans/PLAN_NAME.md:§Section\``
- Mark completed: `- [x] **T-XXX** Task description (estimated time) — \`📄 plans/PLAN_NAME.md:§Section\``
- Reference the source plan in each task for traceability
- Example:
  ```
  - [ ] **T-121** Add recurring transaction support (4-6h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§Recurring`
  - [x] **T-121** Add recurring transaction support (4-6h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§Recurring`
  ```

---

## 4) Parallel Agents

- **Use parallel agents** for smaller, independent tasks
- **Launch multiple agents concurrently** when possible
- **Each agent** should handle a specific, well-defined task
- **Coordinate results** before merging to main
- **Example usage**:
  - One agent for frontend changes
  - One agent for backend changes
  - One agent for tests
  - One agent for documentation

---

## 5) Core Principles

- **Clarify Ambiguity First**: Ask 1-2 clarifying questions before proceeding
- **Code Only What Was Asked**: Follow scope strictly
- **Minimum Viable Change**: Simplest fix that works
- **Reuse Before Rewriting**: Prefer existing modules
- **File Length Limit**: Keep every file under 300 LOC
- **Configuration and Secrets**: Load from environment variables only
- **Clean Up Temporary Files**: Delete any temporary test files immediately after use

---

## 6) Execution Discipline

- **Run only necessary commands**
- **Timeout**: Default 60s; cap at 70-80s for long-running commands
- **Permission errors**: Explain clearly and propose safe manual steps
- **New dependencies**: Do not add unless truly necessary and user agrees

---

## 7) GitNexus Integration

- **MUST run impact analysis** before editing any symbol
- **MUST run detect_changes()** before committing
- **MUST warn user** if impact analysis returns HIGH or CRITICAL risk
- **Use gitnexus_query** to find execution flows instead of grepping
- **Use gitnexus_context** for full context on specific symbols