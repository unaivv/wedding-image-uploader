# Code Review Rules

## General
REJECT if:
- Hardcoded secrets or credentials
- `any` type (TypeScript) or missing type hints (Python)
- Empty catch blocks (silent error handling — catch must log or rethrow)
- Code duplication (violates DRY)
- `console.log` / `console.debug` / `print()` in production code (`console.error` in catch blocks is acceptable for error logging)

## TypeScript/React
REJECT if:
- `import * as React` → use `import { useState }` (named imports)
- `var()` or hex colors directly in `className` string values (e.g. `className="text-[#fff]"`)
- `useMemo`/`useCallback` without justification (React 19 Compiler handles this; justified cases: stable callback passed to IntersectionObserver or other imperative APIs)
- `key={index}` on dynamic lists that can reorder or have items removed

NOTE: This project uses CSS Modules and RSuite — NOT Tailwind. Inline `style` props are acceptable for one-off layout values; prefer CSS module classes for anything reused. Do NOT reject inline styles as a Tailwind violation.

NOTE: `"use client"` is a Next.js/RSC directive only. This project uses Vite + React Router — do NOT require or flag `"use client"` in this codebase.

PREFER:
- `cn()` for conditional class merging
- Semantic HTML over divs/spans for interactive elements
- Named exports over default exports
- REST-correct HTTP verbs (DELETE for delete, PATCH/POST for mutations, GET for reads)

## Python
REJECT if:
- Missing type hints on public functions
- Bare `except:` without specific exception
- `print()` instead of `logger`

## Go
REJECT if:
- Exported functions without doc comments
- Ignored errors (no `_ = err`)
- Naked returns in long functions

## Response Format
Do all analysis internally. Output ONLY the following — no preamble, no explanation before the status line:

If all checks pass:
STATUS: PASSED

If any REJECT rule is violated:
STATUS: FAILED
file:line - rule violated - issue
(one line per violation)

The STATUS line must be the FIRST line of your response. Do not write any analysis, markdown, or reasoning before it. Violations follow immediately after STATUS: FAILED with no blank line between.
