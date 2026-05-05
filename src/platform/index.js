import { createMacAdapter } from './mac.js'
import { createLinuxAdapter } from './linux.js'
import { createWindowsAdapter } from './windows.js'
import { UnsupportedPlatformError } from '../errors/platform-errors.js'
import { assertNever } from '../utils/assert.js'

/**
 * @returns {import('../types/domain.js').PlatformTag}
 */
export function detectPlatform() {
  switch (process.platform) {
    case 'darwin': return 'mac'
    case 'linux': return 'linux'
    case 'win32': return 'win'
    default:
      throw new UnsupportedPlatformError(process.platform)
  }
}

/**
 * Build a PlatformAdapter for the given platform tag.
 * @param {import('../types/domain.js').PlatformTag} platform
 * @param {import('../types/platform.js').ExecFn} exec
 * @returns {import('./contract.js').PlatformAdapter}
 */
export function getAdapter(platform, exec) {
  switch (platform) {
    case 'mac': return createMacAdapter(exec)
    case 'linux': return createLinuxAdapter(exec)
    case 'win': return createWindowsAdapter(exec)
    default: return assertNever(platform)
  }
}
