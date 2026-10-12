# Failure Escalation

Use this file when a fix fails repeatedly or behavior remains unexplained.

## Stop Rule

If the same problem is still not fixed after two attempts, stop adding conditions. Do not keep stacking local patches.

## Required Reset

Before editing again:

1. Re-read `AGENTS.md`.
2. Re-read the relevant workflow file.
3. Re-read the relevant feature or SDK docs.
4. Trace the full chain from trigger to final state:
   - UI action
   - provider/controller
   - repository/API helper
   - backend route
   - service
   - repository/persistence
   - response
   - UI state update
5. Identify the owner of the failing behavior.
6. Write a root-cause hypothesis before changing code.

## Decide the Next Move

Choose one:

- fix the real boundary owner
- split the module
- add a missing test first
- rollback the last local approach
- ask for missing product or environment information

## Do Not

- Do not add another fallback without explaining why.
- Do not bypass SDK or repository layers.
- Do not hide backend errors as UI success.
- Do not preserve broken development-only compatibility unless explicitly required.

