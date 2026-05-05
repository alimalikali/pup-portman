# Changelog

All notable changes to this project will be documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial implementation of `pup-portman` CLI.
- Commands: `<port>` (inspect), `kill`, `list`, `watch`, `save`, `projects`, `forget`.
- Global flags: `--help`, `--version`, `--json`, `--no-color`, `--no-beep`, `--yes`, `--force`.
- Cross-platform support: macOS (lsof), Linux (ss + /proc), Windows (netstat + tasklist).
- Atomic, mode-0600 store at `~/.pup-portman/projects.json` (XDG-aware on Linux).
- Stable exit-code contract.
- Full `node --test` test suite (unit + integration + e2e).
- GitHub Actions CI matrix: macOS / Linux / Windows × Node 18 / 20 / 22.
- Provenance-signed npm releases via tag-triggered workflow.
