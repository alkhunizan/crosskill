# Security Policy

## Reporting a vulnerability

Email security issues to **hello@azizme.com**. Do not open public issues for
security reports.

You should receive an acknowledgement within 48 hours. We'll work with you on
a coordinated disclosure timeline, usually 14–30 days depending on severity.

## Scope

In scope:

- `@crosskill/core` library — input validation in the parser, compiler output,
  lockfile / snapshot tampering paths
- `crosskill` CLI — anything the CLI writes to disk, including the `add`
  command's network fetches
- `apps/desktop` — the Tauri Rust bridge (`open_workspace`, `write_outputs`,
  `read_file`, `start_watching`), path-traversal handling, capability
  permissions
- `apps/web` — the deployed static site at crosskill.dev (the playground runs
  entirely client-side, so the main risks are bundle integrity and the
  `share-url` decoder)

Out of scope:

- DoS via deliberately oversized inputs (we cap the web playground at 64 KB
  by convention; the CLI is for trusted local use)
- Tauri's own platform code — file those upstream at
  https://github.com/tauri-apps/tauri/security

## Supported versions

The latest minor release on the `0.x` line receives security updates.
