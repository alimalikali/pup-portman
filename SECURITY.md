# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | yes       |
| < 1.0   | no        |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Use **GitHub Security Advisories** to privately report a vulnerability:
<https://github.com/alimalik/pup-portman/security/advisories/new>

You should expect an initial response within 72 hours. If a fix is required, a coordinated release will follow under SemVer with a CVE assigned where applicable.

## Threat model

pup-portman is a local CLI. It only runs against the local machine and does not make network requests. The relevant concerns are:

1. **Command injection.** All shell calls go through `src/infra/exec.js` which uses `execFile(file, args[])` with explicit argument arrays. We never concatenate untrusted input into shell strings.
2. **Privilege escalation.** pup-portman never silently uses sudo/`runas`. If a kill operation fails due to lack of permission, it surfaces a `PermissionDeniedError` (exit code 4) and asks the user to re-run with elevated privileges.
3. **Project store.** `~/.pup-portman/projects.json` is written with mode `0600` and atomically (write-to-temp + rename) to prevent corruption mid-write.
