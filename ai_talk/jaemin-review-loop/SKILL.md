---
name: jaemin-review-loop
description: Reusable collaboration skill for Physics Lab AI<->재민 execution loop. Use when the user asks to review Jaemin's work, give additional orders, manage AI collaboration rules in `ai_talk`, or requests responses in the fixed format `Findings -> Orders -> Verify -> Report` (including trigger phrase `검토해줘`).
---

# jaemin-review-loop

## Core Workflow

1. Read latest status files first.
- `ai_talk/JAEMIN_TASKS.md`
- `ai_talk/AI_COLLAB_RULES.md`

2. Inspect code/document changes tied to reported work.
- Prefer targeted file reads with `rg` + `sed`.
- Validate claimed completion criteria against real code.

3. Run quality gates before final judgment.
- Mandatory: `pnpm test`, `pnpm build`
- If tests fail, treat as incomplete regardless of claim.

4. Return review in fixed 4-block format.
- `Findings`
- `Orders`
- `Verify`
- `Report`

## Output Contract (Must Follow)

### 1) Findings
- List issues in severity order: `P0`, `P1`, `P2`.
- Include concrete file references and line numbers.
- If no important issue exists, write exactly: `중요 이슈 없음`.

### 2) Orders
- Give 3-6 executable tasks.
- Each task must include DoD (definition of done).
- Write as immediate action items, not suggestions.

### 3) Verify
- Provide exact commands and pass criteria.
- Minimum set:
  - `pnpm test` => all PASS
  - `pnpm build` => success, no type/build error

### 4) Report
- Tell Jaemin exactly what to update in `ai_talk/JAEMIN_TASKS.md`:
  - completed items
  - changed files
  - test/build outputs
  - remaining risks
  - next 1-2 actions

## Severity Rules

- `P0`: app broken, data corruption risk, core workflow impossible.
- `P1`: functional bug/regression risk, incorrect acceptance criteria.
- `P2`: quality/documentation gaps, refactor-level issues.

Never hide P0/P1 behind summary text. Findings must come first.

## Review Heuristics

- Reject "done" if DoD is missing or not verifiable.
- Reject "done" if no matching tests exist for new behavior.
- Reject "done" if 문서 상태 and 코드 상태 disagree.
- Accept only when code + tests + docs are consistent.

## Command Set

Use this minimal command sequence unless task requires more:

```bash
rg -n "완료 항목|변경 파일|검증 결과|남은 이슈" ai_talk/JAEMIN_TASKS.md
pnpm test
pnpm build
rg -n "TODO|FIXME|HACK" src test
```

Then inspect touched files with `git diff -- <path>` and targeted `sed -n`.

## References

- Use [review-template.md](references/review-template.md) for output skeleton.
- Use [dod-checklist.md](references/dod-checklist.md) to validate completion claims.
