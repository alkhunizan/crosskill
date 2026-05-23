# Contributing to crosskill

Thanks for considering a contribution. The single best PR you can send is **a new compiler target** or **a new starter skill**.

## Quick start

```bash
git clone https://github.com/alkhunizan/crosskill.git
cd crosskill
bun install
bun test
bun run build
```

## Repo layout

```
src/
  cli.ts               CLI entry (commander)
  schema.ts            Zod schema for *.skill.md
  parser.ts            Parses skill files
  linter.ts            Lint rules
  compilers/           One file per target tool
  commands/            init / build / lint / add
skills/                Built-in starter skills
tests/                 Bun tests
docs/                  Spec docs
```

## Adding a new compiler target

1. Create `src/compilers/<target>.ts` exporting a `Compiler` that conforms to the type in `src/schema.ts`.
2. Add `<target>` to `SUPPORTED_TARGETS` in `src/schema.ts` and to the `targets` shape on the schema.
3. Register it in `src/compilers/index.ts`.
4. Add a test in `tests/compilers.test.ts`.
5. Add a row to the **Supported targets** table in `README.md`.

That's it. Open a PR — most new targets are ≤ 50 lines.

## Adding a starter skill

1. Create `skills/<name>/skill.md` with valid front-matter and a body.
2. Run `bun test` and `node dist/cli.js lint` to check it.
3. Add a row to the **Built-in skills** table in `README.md`.
4. Open a PR.

Keep skills:

- Short — under 1500 chars body is ideal.
- Concrete — specific verbs, no vague language.
- Example-driven — every skill should have a `## Examples` section.

## Style

- Prettier defaults. Run `bun run format`.
- TypeScript strict mode. Run `bun run typecheck`.
- Tests for any non-trivial change.

## Reporting bugs

Open an issue with:

- The skill that triggered the bug (paste the front-matter).
- The target you were compiling to.
- The expected vs. actual output.

## Code of Conduct

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
