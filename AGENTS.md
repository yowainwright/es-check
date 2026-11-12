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
- Prefer `pnpm lint` for the configured Oxlint and published `oxlint-plugin-legibility` checks; warnings must fail. Do not copy plugin implementations into this repository.
- Keep functions small, flat, and single-purpose. Hoist branch conditions into named booleans.

## Structure Checks

- Use camelCase filenames for standalone modules, including `lib/core/checkRunner.js` and `lib/core/browserslist.js`. Use `lib/<folder>/{index,constants,utils}.js` when related files need grouping. fs-lint permits the agreed paths. Group shared constants in `lib/constants/es/index.js` and `lib/constants/browserslist/index.js`. Constants files contain data and exports. Put behavior in its owning module.
- Keep runtime checks, feature detection, and Browserslist handling in `lib/core/`. Keep the ESM entry point at `lib/core/esm.mjs` and the CommonJS entry point at `lib/index.js`.
- Put each edition's feature table in `lib/constants/es/<year>/index.js` and export the combined catalogue from `lib/constants/es/index.js`.
- Keep generated browser-support data in `lib/constants/browserslist/support/index.js`.
- Keep browser generator inputs in `lib/constants/browserslist/constants.js` as literal data declarations and exports.
- Keep polyfill mappings, patterns, and feature-set constants together in `lib/constants/polyfills/index.js`.
- Keep shared receiver-name sets and constants exports in `lib/constants/index.js`.
- Keep CLI command flow in `lib/cli/index.js`, parsing and helpers in `lib/cli/utils.js`, and CLI data in `lib/cli/constants.js`.
- Keep AST exports in `lib/core/ast/index.js`, common node/scope helpers in `ast/utils.js`, and data-only tables in `ast/constants.js`. Keep mutually recursive traversal in `ast/detector/index.js` and feature matching in `ast/detector/utils.js`.
- Mirror source paths in `tests/unit/`, using `index.test.js` for each source `index.js`.
- Do not nest `describe` blocks. Keep suites at one level and name each suite for the behavior it tests.
- Before adding or renaming a path, run `fs-lint check -- <path>`.
- Run `src-lint check lib --strict` for import boundaries, and `struct-lint --profile ci <changed-source-files>` for declaration order. Resolve findings in scope and report any that need a separate change.

## Stop Conditions

- Before editing, name the exact default tool/API/pattern being used.
- If you cannot name it, do not edit.
- Ask: "I'm at `<file/module>`, implementing `<specific behavior>`. Which `<specific default parser/detector/constant/test pattern>` should I use?"
- Ask one buffer question only after the default path is exhausted.
- Do not invent wrappers, one-off controls, bespoke CSS, or new architecture.
