# Exit Codes

pup-portman emits stable numeric exit codes. Scripts may rely on them.

| Code | Constant | Meaning |
|------|----------|---------|
| 0 | `OK` | Success |
| 1 | `GENERAL` | Generic failure (unmapped) |
| 2 | `USAGE` | Bad arguments, unknown verb, invalid port |
| 3 | `NOT_FOUND` | No process listening on the given port |
| 4 | `PERMISSION` | Permission denied (target owned by another user) |
| 5 | `PLATFORM` | Unsupported OS or required tool missing (lsof / ss / netstat) |
| 70 | `INTERNAL` | Unexpected internal error |
| 130 | `ABORTED` | Cancelled by signal (Ctrl+C during `watch`) |

The `--json` mode emits structured output with `code` strings (e.g. `ERR_PORT_NOT_FOUND`) for finer-grained checks.
