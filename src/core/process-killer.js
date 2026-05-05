import { GRACEFUL_SIGNAL, FORCE_SIGNAL } from '../constants/signals.js'
import { KILL_GRACE_MS } from '../constants/defaults.js'
import { sleep } from '../utils/promise.js'
import { PermissionDeniedError } from '../errors/permission-errors.js'

/**
 * Kill a process. POSIX: SIGTERM, wait graceMs, escalate to SIGKILL if still alive.
 * Windows: `taskkill /PID <pid> [/F]` (taskkill is the only reliable way to terminate
 * non-Node processes on Windows; process.kill is unreliable for them).
 *
 * @param {number} pid
 * @param {object} opts
 * @param {string} opts.platform        'mac' | 'linux' | 'win'
 * @param {import('../types/platform.js').ExecFn} opts.exec
 * @param {boolean} [opts.force]        skip graceful, send SIGKILL/'/F' immediately
 * @param {number}  [opts.graceMs]      defaults to KILL_GRACE_MS
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<import('../types/platform.js').KillResult>}
 */
export async function killProcess(pid, opts) {
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new TypeError(`killProcess: invalid pid ${pid}`)
  }
  const force = Boolean(opts.force)
  const graceMs = opts.graceMs ?? KILL_GRACE_MS

  if (opts.platform === 'win') {
    return killWindows(pid, opts.exec, force)
  }

  // POSIX: SIGTERM (or SIGKILL if force), then escalate if still alive.
  const initial = force ? FORCE_SIGNAL : GRACEFUL_SIGNAL
  try {
    process.kill(pid, initial)
  } catch (err) {
    return handlePosixKillError(err, pid, initial)
  }

  if (force) {
    return { pid, killed: true, escalated: false, signal: FORCE_SIGNAL }
  }

  const deadline = Date.now() + graceMs
  while (Date.now() < deadline) {
    if (!isAlive(pid)) {
      return { pid, killed: true, escalated: false, signal: GRACEFUL_SIGNAL }
    }
    await sleep(50, { signal: opts.signal })
  }

  // Escalate.
  try {
    process.kill(pid, FORCE_SIGNAL)
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ESRCH') {
      return { pid, killed: true, escalated: false, signal: GRACEFUL_SIGNAL }
    }
    return handlePosixKillError(err, pid, FORCE_SIGNAL)
  }
  return { pid, killed: true, escalated: true, signal: FORCE_SIGNAL }
}

/**
 * @param {number} pid
 * @returns {boolean}
 */
function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return /** @type {NodeJS.ErrnoException} */ (err).code !== 'ESRCH'
  }
}

/**
 * @param {unknown} err
 * @param {number} pid
 * @param {NodeJS.Signals} signal
 * @returns {import('../types/platform.js').KillResult}
 */
function handlePosixKillError(err, pid, signal) {
  const code = /** @type {NodeJS.ErrnoException} */ (err).code
  if (code === 'ESRCH') {
    return { pid, killed: true, escalated: false, signal }
  }
  if (code === 'EPERM') {
    throw new PermissionDeniedError(`signal ${signal} to pid ${pid}`, { pid, signal, errno: code })
  }
  throw err
}

/**
 * @param {number} pid
 * @param {import('../types/platform.js').ExecFn} exec
 * @param {boolean} force
 * @returns {Promise<import('../types/platform.js').KillResult>}
 */
async function killWindows(pid, exec, force) {
  const args = ['/PID', String(pid)]
  if (force) args.push('/F')
  const r = await exec('taskkill', args, { allowFailure: true })
  if (r.code === 0) {
    return { pid, killed: true, escalated: false, signal: force ? -1 : 0 }
  }
  // taskkill exit 128 = process not found; 1 = access denied (often)
  const stderr = (r.stderr || '').toLowerCase()
  if (stderr.includes('not found') || stderr.includes('not running')) {
    return { pid, killed: true, escalated: false, signal: 0 }
  }
  if (stderr.includes('access') || stderr.includes('denied')) {
    throw new PermissionDeniedError(`taskkill pid ${pid}`, { pid, stderr: r.stderr })
  }
  // If non-force failed, escalate once.
  if (!force) {
    return killWindows(pid, exec, true).then((res) => ({ ...res, escalated: true }))
  }
  throw new Error(`taskkill failed: ${r.stderr || `exit ${r.code}`}`)
}
