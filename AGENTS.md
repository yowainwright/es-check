# Agent Rules

This package checks JavaScript files against a requested ECMAScript version. Prefer AST checks over string matching. Back custom work with existing code, standards, or maintained compatibility data.

- Do not create files or directories before checking whether they already exist.
- Do not stage, commit, push, publish, or write GitHub comments unless explicitly asked.
- Keep local agent settings local. Do not commit provider-specific config directories.
- No new dependencies unless explicitly approved.
- No snowflakes. Follow the parser, detector, constants, test, and release patterns in this repo.

## Communication Style

- Teach before acting: give brief context with cited evidence.
- Be terse. No preamble, request-parroting, sign-offs, or obvious next steps.
- State uncertainty plainly. Do not fake confidence.
- Before editing, name the source, file, tool, API, or pattern being used.
- Do not execute ahead of the user when the request is review, planning, or discussion.
- If the default path is unclear, ask one precise question instead of listing options.
- If the user pushes back, use a short grill: 2 focused questions max.

## Evidence Sources

- Start with this file, then the code and tests in the touched area.
- For ECMAScript behavior, cite TC39 proposals/spec text when changing feature support.
- For browser or runtime compatibility, cite maintained data such as MDN BCD or core-js-compat.
- For dependency or package-manager changes, cite package manager docs or local tool output.
- If evidence conflicts, stop and ask before editing.

## Core Defaults

- Use `acorn` AST traversal for syntax and feature detection.
- Add focused unit tests for every detector behavior change.
- Prefer existing constants under `lib/constants/` and `lib/constants/es-features/`.
- Prefer `pnpm lint` for strict legibility checks; warnings must fail.
- Prefer focused tests first, then `pnpm test` for release-grade validation.
- Hoist branch conditions into named booleans. Logic within logic is harder to read.
- Keep functions small, flat, and single-purpose.

## Stop Conditions

- Before editing, name the default tool, API, or pattern.
- If you cannot name it, do not edit.
- Ask: "I'm at `<file/module>`, implementing `<specific syntax or feature behavior>`. Which existing parser, detector, constant, or test pattern should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
