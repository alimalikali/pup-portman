# pup-portman

> Cross-platform CLI to find and kill processes on any port. Zero dependencies.

[![CI](https://github.com/alimalik/pup-portman/actions/workflows/ci.yml/badge.svg)](https://github.com/alimalik/pup-portman/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/pup-portman.svg)](https://www.npmjs.com/package/pup-portman)
[![Node.js](https://img.shields.io/node/v/pup-portman.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](package.json)

Stop googling `lsof -i :3000` every day.

```sh
$ pup-portman 3000
  ● port 3000
    process   node (v20.11.0)
    pid       48291
    cmd       next dev
    started   4m ago

  kill this process? (y/N) y

  ✓ killed pid 48291 — port 3000 is free
```

## Install

```sh
npm install -g pup-portman
```

The package and the installed binary share the same name: `pup-portman`.

Requires Node.js 16 or higher. Works on macOS, Linux, and Windows.

## Commands

| Command | What it does |
|---|---|
| `pup-portman <port>` | Show what's on a port; prompt to kill |
| `pup-portman kill <port>` | Kill the process on a port immediately |
| `pup-portman list` | Show all occupied ports + your saved ports |
| `pup-portman watch <port>` | Wait for a port to become free; beep when it does |
| `pup-portman save <port> <name>` | Name a port for a project |
| `pup-portman projects` | Show your saved port-to-name map |
| `pup-portman forget <name>` | Remove a saved project entry |
| `pup-portman --help` | Show help |
| `pup-portman --version` | Show version |

## Global flags

| Flag | What it does |
|---|---|
| `--json` | Output JSON instead of human-formatted text |
| `--no-color` | Disable ANSI colors (also honors `NO_COLOR` env var) |
| `--no-beep` | Disable terminal bell on `watch` |
| `--yes`, `-y` | Skip confirmation prompts |
| `--force` | Send SIGKILL immediately, skip graceful SIGTERM |

## Scriptable output

Every command supports `--json`:

```sh
$ pup-portman list --json
[
  { "port": 3000, "pid": 48291, "command": "node", "protocol": "tcp", "family": "ipv4" },
  { "port": 5432, "pid": 1042, "command": "postgres", "protocol": "tcp", "family": "ipv4" }
]
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 2 | Usage error (bad arguments) |
| 3 | Port not found / no process listening |
| 4 | Permission denied |
| 5 | Unsupported platform / required tool missing |
| 70 | Internal error |

See [docs/EXIT-CODES.md](docs/EXIT-CODES.md) for the full contract.

## How it works

| OS | Tool used |
|---|---|
| macOS | `lsof -i :<port> -P -n` |
| Linux | `ss -tlnp` + `/proc/<pid>/comm` |
| Windows | `netstat -ano` + `tasklist /FI "PID eq <pid>"` |

All shell calls go through `execFile(file, args[])` — never string concatenation. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the layered design.

## Why zero dependencies?

- Installs in under a second.
- No supply-chain attack surface.
- Survives every `npm audit`.
- Smaller than the package.json of any competitor.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All PRs welcome.

## Security

Report vulnerabilities privately via GitHub Security Advisories. See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Ali Malik
