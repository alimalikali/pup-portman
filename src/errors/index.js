import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export { PortmanError } from './base.js'
export { InvalidPortError, PortNotFoundError, PortInUseError } from './port-errors.js'
export { PermissionDeniedError, NotOwnerError } from './permission-errors.js'
export { UnsupportedPlatformError, ToolNotFoundError } from './platform-errors.js'
export { ExecError, ExecTimeoutError } from './exec-errors.js'
export { StoreCorruptError, DuplicateNameError, StoreLockTimeoutError } from './store-errors.js'

/**
 * Convert any thrown value into an exit code + user-facing message.
 * @param {unknown} err
 * @param {{ debug?: boolean }} [opts]
 * @returns {{ exitCode: number, message: string }}
 */
export function handle(err, opts = {}) {
  if (err instanceof PortmanError) {
    let msg = `error: ${err.userMessage}`
    if (opts.debug) {
      msg += `\n  code: ${err.code}\n  details: ${JSON.stringify(err.details)}`
      if (err.stack) msg += `\n${err.stack}`
    }
    return { exitCode: err.exitCode, message: msg }
  }
  if (err instanceof Error) {
    if (opts.debug) {
      return { exitCode: EXIT_CODES.INTERNAL, message: `internal error: ${err.message}\n${err.stack ?? ''}` }
    }
    return {
      exitCode: EXIT_CODES.INTERNAL,
      message: `internal error: ${err.message}\nRe-run with DEBUG=pup-portman for details.`
    }
  }
  return {
    exitCode: EXIT_CODES.INTERNAL,
    message: `internal error: ${String(err)}`
  }
}
