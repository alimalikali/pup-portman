# Contributing to pup-portman

Thanks for considering a contribution. pup-portman aims to be a small, focused, zero-dependency CLI. PRs that add runtime dependencies will be declined unless there's an exceptional reason.

## Setup

```sh
git clone https://github.com/alimalik/pup-portman
cd pup-portman
npm install
```

Requires Node.js 18 or higher to run the test suite (production target is `>=16`).

## Workflow

```sh
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (JSDoc-driven types)
npm test            # unit + integration
npm run test:e2e    # spawns the real CLI binary
npm run check       # everything above
```

A pre-commit hook (`simple-git-hooks`) runs `lint` + `typecheck` automatically. Run `npx simple-git-hooks` once after install to register it.

## Architecture in 60 seconds

Strict downward dependency direction:

```
bin/  ->  cli/  ->  commands/  ->  core/ + ui/ + errors/  ->  platform/ + infra/  ->  Node built-ins
```

- `commands/` are thin orchestrators. They never call `execFile` directly.
- `platform/` adapters are the only callers of `infra/exec.js`.
- `infra/exec.js` is the only file that calls `execFile`. It always uses `(file, args[])` form — never string concatenation. This is the canonical command-injection defense.
- `core/` is pure domain logic. No I/O.
- `ui/` is pure rendering. Never reads, never throws.
- `errors/` are leaf-level. Only `bin/pup-portman.js` catches.
- Everything is injected into commands via `ctx`. Integration tests never need module mocking.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture.

## Adding a command

1. Create `src/commands/<name>.js`. Export a function `(parsed, ctx) => Promise<exitCode>`.
2. Register it in `src/commands/index.js` and `src/cli/router.js`.
3. Add help text in `src/cli/help.js`.
4. Add an integration test under `test/integration/commands/<name>.test.js` using `makeCtx()` from `test/helpers/capture-io.js`.

## Adding platform support

1. Capture real fixtures from the target OS into `test/fixtures/<platform>/`.
2. Write the parser test against the fixtures, then implement `src/platform/parsers/<tool>.js` (pure function, no I/O).
3. Implement the adapter in `src/platform/<platform>.js`. Wire it into `src/platform/index.js`.
4. Add to the CI matrix in `.github/workflows/ci.yml` if it's a new OS.

## Commit / PR style

- Conventional Commits encouraged but not enforced (`feat:`, `fix:`, `chore:`...).
- Keep the diff focused — split unrelated changes into separate PRs.
- Add a `[Unreleased]` entry in `CHANGELOG.md` for any user-visible change.
- `npm run check` must pass on all 3 OSes in CI before merge.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For security issues see [SECURITY.md](SECURITY.md).
