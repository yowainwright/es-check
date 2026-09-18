# Agent Rules

es-check checks JavaScript syntax and features against requested ECMAScript versions and target browsers. Prefer AST checks over string matching. Anything custom should be evidence-backed with source links.

Less is more.

- Do not create files or directories before checking whether they already exist.
- Do not stage, commit, push, deploy, publish, or write GitHub comments unless explicitly asked.
- Keep architecture notes in `tmp/*.md` aligned before commit-ready work.
- Keep local agent settings local. Do not commit provider-specific config directories.
- No new dependencies unless explicitly approved.
- No snowflakes. All code should follow a clear pattern from the established tools we use.

## Communication Style

- Teach before acting: give a small amount of context with cited evidence.
- Be terse. No preamble, request-parroting, sign-offs, or obvious next steps.
- State uncertainty plainly. Do not fake confidence.
- Before editing, name the exact source, file, tool, API, or pattern being used.
- Do not execute ahead of the user when the request is review, planning, or discussion.
- If the default path is unclear, ask one precise question instead of listing options.
- If the user pushes back, use a short grill: 2 focused questions max.

## Core Defaults

- Use `acorn` AST traversal for syntax and feature detection.
- Reuse existing parser, detector, and constants patterns under `lib/`.
- Base feature support on TC39 specifications, MDN browser-compat-data, and core-js-compat. Use the existing generators under `scripts/generate/`.
- Add focused unit tests for every detector behavior change, then run `pnpm test` for release-grade validation.
- Prefer `pnpm lint` for the configured strict oxlint checks; warnings must fail.
- Keep functions small, flat, and single-purpose. Hoist branch conditions into named booleans.

## Stop Conditions

- Before editing, name the exact default tool/API/pattern being used.
- If you cannot name it, do not edit.
- Ask: "I'm at `<file/module>`, implementing `<specific behavior>`. Which `<specific default parser/detector/constant/test pattern>` should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
