/**
 * Best-effort: can the current user kill `pid` without sudo?
 *
 * On POSIX, sending signal 0 with process.kill returns true if the
 * caller has permission to send signals to the target, false otherwise.
 * On Windows, ownership is harder to check up-front; we return true and
 * let `taskkill` handle the permission error.
 *
 * @param {number} pid
 * @param {{ platform?: string }} [opts]
 * @returns {boolean}
 */
export function canKill(pid, opts = {}) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  const platform = opts.platform ?? process.platform
  if (platform === 'win32' || platform === 'win') return true
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    // ESRCH = no such process; EPERM = exists but cannot signal.
    return /** @type {NodeJS.ErrnoException} */ (err).code === 'ESRCH'
      ? false
      : false
  }
}
