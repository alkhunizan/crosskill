# Embed example

Smallest possible **library** use of crosskill — no CLI, no filesystem,
just `compileSkillForPreview` against an in-memory buffer.

This is the shape an editor extension or web preview would take.

```bash
cd examples/embed
bun preview.ts   # or `node preview.ts` if you bundle/transpile first
```

What it prints:

- The skill's parse status
- Any lint issues
- The compiled output for `claude` and `cursor`

See [docs/api.md](../../docs/api.md) for the full library API surface.
