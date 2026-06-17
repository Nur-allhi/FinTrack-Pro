# Branch Cleanup Plan

## Problem
The repository has accumulated 7 local branches and 7 remote branches beyond the canonical `main` and `dev`. These stale branches are no longer active (all features have been merged) and clutter the workspace.

## Scope
Keep only `main` and `dev` (local and remote). Delete all other branches.

## Implementation Steps
1. Switch to `chore/branch-cleanup` branch (from `main`)
2. Delete local branches: feat/local-first, feature/guest-mode-nudge, feature/onboarding-experience, feature/ui-ux-polish-improvement, fix/all-bugs, fix/security-audit
3. Delete remote branches: feat/liquid-glass-nav, feat/local-first, feat/unified-write-modal, feature/guest-mode-nudge, feature/ui-ux-polish-improvement, fix/all-bugs, fix/dashboard-fix
4. Update CHANGELOG.md — add cleanup entry
5. Update docs/SESSIONLOG.md — add session entry
6. Stage all files (modified + untracked), commit, push

## Risk Assessment
- LOW: No code changes, only git admin + docs
- All branches except main/dev contain only merged/finished work
- `git branch -d` (safe delete) will be used for local branches that are fully merged
