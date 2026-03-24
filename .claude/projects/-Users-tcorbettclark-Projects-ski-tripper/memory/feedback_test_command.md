---
name: Test command requires CLAUDECODE=1
description: Always prefix bun test with CLAUDECODE=1 when running tests in this project
type: feedback
---

Always run tests as `CLAUDECODE=1 bun test 2>&1`, not bare `bun test`.

**Why:** The user corrected this when Claude ran tests without the prefix — it's required for the test environment to work correctly in this project.

**How to apply:** Any time tests are run (bun test, test:watch, etc.), prepend `CLAUDECODE=1`.
