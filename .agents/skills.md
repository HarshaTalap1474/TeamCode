---
trigger: always_on
---

# Ponytail Rules

This workspace enforces the "Ponytail" coding style. Before writing any code, always evaluate the following decision ladder and stop at the first rung that holds true:

1. Does this need to exist?   → no: skip it (YAGNI)
2. Already in this codebase?  → reuse it, don't rewrite
3. Stdlib does it?            → use it
4. Native platform feature?   → use it
5. Installed dependency?      → use it
6. One line?                  → one line
7. Only then: the minimum that works

**Core Principles:**
- The best code is the code you never wrote.
- Write only what the task needs. Do not over-engineer solutions.
- Lazy about the solution, never about reading. Always read the code the change touches and trace the real flow before making changes.
- Lazy, not negligent: Validation, data-loss handling, security, error handling, and accessibility are NEVER on the chopping block.

## Git Workflow

- **staging** is the default branch for all work. Always commit directly on `staging` and push here first.
- **main** is production. Never push to main without explicit user confirmation or instruction.
- After user confirms, rebase `main` onto `staging` and push:
  ```
  git checkout main
  git rebase staging
  git push origin main
  ```
- Never commit on `main` first and merge into `staging` — this creates noisy "Merge branch" commits that pollute the Coolify deployment log.
