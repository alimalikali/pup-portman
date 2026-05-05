# Platform notes

## macOS — `lsof`

- Command: `lsof -i :<port> -P -n` and `lsof -iTCP -sTCP:LISTEN -P -n`
- Comes preinstalled on every supported macOS version.
- `-P` disables port name resolution (we want raw numbers); `-n` disables hostname resolution (faster, no DNS).
- Exits with code 1 when nothing matches — we use `allowFailure: true` to treat that as an empty result.
- Requires no special permissions for processes the user owns.

## Linux — `ss` (iproute2)

- Command: `ss -tlnp` and `ss -tlnpH sport = :<port>`
- Modern replacement for `netstat`. Comes via `iproute2`, preinstalled on every modern distro (Debian, Ubuntu, Mint, Fedora, Arch, Alpine, etc.).
- The `Process` column is **only populated for sockets owned by the current user**. Root sees everything; unprivileged users see processes they own. pup-portman surfaces ports with empty Process columns as `command: 'unknown'` so they're still visible.
- We additionally read `/proc/<pid>/comm` as a best-effort enrichment when ss reports a PID without a name.
- UDP: not currently included in `listAll`. Added via `ss -ulnp` in v1.1 if requested.

## Windows — `netstat` + `tasklist`

- Commands: `netstat -ano` to list ports + PIDs, `tasklist /FI "PID eq <pid>" /FO CSV /NH` to map PID → image name.
- Both ship with every supported Windows version.
- Killing: `taskkill /PID <pid>` for graceful, `taskkill /PID <pid> /F` for force. Node's `process.kill()` on Windows can't reliably terminate non-Node processes, so we always shell out to `taskkill`.
- An access-denied error from taskkill maps to exit code 4 with a hint to open an elevated terminal.

## Why not the same tool everywhere?

We considered using `lsof` on Linux too (it's available almost everywhere) but `ss` is universally preinstalled while `lsof` is not — Alpine and other minimal containers ship without it. Using the OS-native tool minimizes "tool not found" failures.

## Adding a new platform

See [CONTRIBUTING.md § Adding platform support](../CONTRIBUTING.md#adding-platform-support).
