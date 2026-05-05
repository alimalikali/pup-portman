import { execFile } from 'node:child_process'
import { ExecError, ExecTimeoutError } from '../errors/exec-errors.js'
import { ToolNotFoundError } from '../errors/platform-errors.js'
import { EXEC_DEFAULT_TIMEOUT_MS } from '../constants/defaults.js'

/**
 * The single chokepoint for all shell calls in pup-portman. Always uses
 * execFile with an explicit args array — never string concatenation —
 * to make command injection impossible.
 *
 * @param {string} file
 * @param {string[]} args
 * @param {import('../types/platform.js').ExecOptions} [opts]
 * @returns {Promise<import('../types/platform.js').ExecResult>}
 */
export function runCommand(file, args, opts = {}) {
  if (typeof file !== 'string' || file.length === 0) {
    return Promise.reject(new TypeError('runCommand: file must be a non-empty string'))
  }
  if (!Array.isArray(args)) {
    return Promise.reject(new TypeError('runCommand: args must be an array'))
  }
  for (const a of args) {
    if (typeof a !== 'string') {
      return Promise.reject(new TypeError('runCommand: every arg must be a string'))
    }
  }

  const timeoutMs = opts.timeoutMs ?? EXEC_DEFAULT_TIMEOUT_MS
  const allowFailure = Boolean(opts.allowFailure)

  return new Promise((resolve, reject) => {
    let settled = false
    /** @type {NodeJS.Timeout | null} */
    let timer = null

    const child = execFile(file, args, {
      timeout: 0,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
      cwd: opts.cwd,
      env: opts.env
    }, (err, stdout, stderr) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      opts.signal?.removeEventListener('abort', onAbort)

      const out = typeof stdout === 'string' ? stdout : (/** @type {Buffer} */ (stdout)).toString('utf8')
      const errOut = typeof stderr === 'string' ? stderr : (/** @type {Buffer} */ (stderr)).toString('utf8')

      if (err) {
        // ENOENT means the binary itself was missing.
        if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
          reject(new ToolNotFoundError(file))
          return
        }
        const exitCode = typeof /** @type {{code?: number}} */ (err).code === 'number'
          ? /** @type {{code: number}} */ (err).code
          : null
        if (allowFailure) {
          resolve({ stdout: out, stderr: errOut, code: exitCode })
          return
        }
        reject(new ExecError(`Command failed: ${file}`, {
          file,
          args,
          code: exitCode,
          stdout: out,
          stderr: errOut,
          cause: err
        }))
        return
      }
      resolve({ stdout: out, stderr: errOut, code: 0 })
    })

    const onAbort = () => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      try { child.kill('SIGTERM') } catch (_) { /* ignore */ }
      reject(new DOMException('Aborted', 'AbortError'))
    }

    if (opts.signal) {
      if (opts.signal.aborted) { onAbort(); return }
      opts.signal.addEventListener('abort', onAbort, { once: true })
    }

    if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
      timer = setTimeout(() => {
        if (settled) return
        settled = true
        try { child.kill('SIGKILL') } catch (_) { /* ignore */ }
        reject(new ExecTimeoutError(file, timeoutMs))
      }, timeoutMs)
    }
  })
}

export const defaultExec = runCommand
