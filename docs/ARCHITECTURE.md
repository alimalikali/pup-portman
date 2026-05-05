# Architecture

## Layer diagram

```
                    +---------------------+
                    |  bin/pup-portman.js     |   shebang entrypoint, top-level catch
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |  src/cli/           |   parser, router, help, version
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    |  src/commands/      |   thin orchestrators
                    +----------+----------+
                       |       |       |
                       v       v       v
        +-----------+  +----+  +----+  +----------+
        | core/     |  |ui/ |  |err/|  | (ctx)    |
        +-----------+  +----+  +----+  +----------+
              |
              v
        +-----------+   +----------+
        | platform/ |   | infra/   |
        +-----+-----+   +----+-----+
              |              |
              +------+-------+
                     v
              +-------------+
              | Node built- |
              | ins         |
              +-------------+
```

## Dependency rules

Strict downward — never upward, never sideways across siblings except through `ctx`.

| Layer | Allowed to import from | Notes |
|-------|------------------------|-------|
| `bin/` | everything | entrypoint only |
| `cli/` | `commands/`, `errors/`, `constants/` | dispatch + help/version |
| `commands/` | `core/`, `ui/`, `errors/`, `infra/` (only `prompt`/`signals`), `constants/` | thin; never call execFile directly |
| `core/` | `errors/`, `constants/`, `utils/` | pure domain; no I/O |
| `platform/` | `parsers/` siblings, `errors/`, `infra/exec.js`, `utils/` | only layer allowed to call exec |
| `infra/` | `errors/`, `constants/`, `utils/` | side-effectful boundary code |
| `ui/` | `utils/` | pure rendering; no I/O, no throws |
| `errors/` | `constants/` | leaf — everyone may import |
| `constants/` | nothing | leaf |
| `utils/` | nothing | leaf |

## The `ctx` object

Every command receives `(parsed, ctx)`. `ctx` is built once in `bin/pup-portman.js` and contains all I/O dependencies:

```ts
type CliContext = {
  stdout: NodeJS.WriteStream
  stderr: NodeJS.WriteStream
  stdin:  NodeJS.ReadStream
  env:    NodeJS.ProcessEnv
  cwd:    string
  exec:   ExecFn
  adapter: PlatformAdapter
  store:  ProjectStore
  prompt: ConfirmFn
  platform: 'mac' | 'linux' | 'win'
}
```

This means **integration tests never need module mocking**. Build a fake `ctx`, call the command, assert on captured streams.

## Command-injection defense

`src/infra/exec.js` is the **only** file in the repo that calls `child_process.execFile`. It always uses the array form — `execFile(file, args[])`. It does not accept a string command and never invokes a shell.

When adding new shell calls (e.g. for a new platform), route them through `runCommand(file, args, opts)`. Never use `child_process.exec` or backticks.

## Watch loop

`src/core/port-watcher.js` is an async generator. It polls every `intervalMs` (default 500), yields a `PortStatus` per tick, and stops cleanly when its `AbortSignal` aborts. Signal handlers in `src/infra/signals.js` install once and run their callback at most once across SIGINT/SIGTERM/SIGHUP.

## Errors

All thrown values are `PortmanError` subclasses. Each carries:

- `code` — stable string for scripters (e.g. `ERR_PORT_NOT_FOUND`)
- `exitCode` — numeric exit code
- `userMessage` — short, human-friendly text
- `details` — structured context

`bin/pup-portman.js` has the only `catch`. It calls `handle(err)` to map to `(exitCode, message)` and writes to stderr.

## Platform abstraction

The interface in `src/platform/contract.js`:

```ts
type PlatformAdapter = {
  name: 'mac' | 'linux' | 'win'
  findByPort(port: number): Promise<ProcessInfo[]>
  listAll(): Promise<ProcessInfo[]>
}
```

Each adapter is built by a factory `create<X>Adapter(exec)` that injects the exec function — making both unit testing (mock exec) and dependency rotation (e.g. a future PowerShell adapter on Windows) straightforward.
