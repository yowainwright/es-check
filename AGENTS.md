# Agent Rules

This package checks JavaScript files against a requested ECMAScript version. Prefer precise AST-based checks over string matching. Anything custom should be evidence-backed by existing code, standards, or maintained compatibility data.

- Do not create files or directories before checking whether they already exist.
- Do not stage, commit, push, publish, or write GitHub comments unless explicitly asked.
- Keep `.claude/settings.local.json` local only. Do not commit `.claude/`.
- No new dependencies unless explicitly approved.
- No snowflakes. Follow the established parser, detector, constants, test, and release patterns already in this repo.

## Communication Style

- Teach before acting: give a small amount of context with cited evidence.
- Be terse. No preamble, request-parroting, sign-offs, or obvious next steps.
- State uncertainty plainly. Do not fake confidence.
- Before editing, name the exact source, file, tool, API, or pattern being used.
- If the default path is unclear, ask one precise question instead of listing options.
- If the user pushes back, use a short grill: 2 focused questions max.

## Core Defaults

- Use `acorn` AST traversal for syntax and feature detection.
- Add focused unit coverage for every detector behavior change.
- Prefer existing constants under `lib/constants/` and `lib/constants/es-features/`.
- Prefer `pnpm lint` for strict legibility checks; warnings must fail.
- Prefer focused tests first, then `pnpm test` for release-grade validation.
- Hoist conditions into named booleans. Logic within logic is harder to read.
- Keep functions small, flat, and single-purpose.

## Stop Conditions

- Before editing, name the exact default tool/API/component/pattern being used.
- If you cannot name it, do not edit.
- Ask: "I'm at `<file/component>`, implementing `<specific behavior>`. Which `<specific default API/component/pattern>` should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
