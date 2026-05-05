import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export class PermissionDeniedError extends PortmanError {
  /** @param {string} action @param {Record<string, unknown>} [details] */
  constructor(action, details = {}) {
    super(`Permission denied: ${action}`, {
      code: 'ERR_PERMISSION_DENIED',
      exitCode: EXIT_CODES.PERMISSION,
      userMessage: `Permission denied while attempting to ${action}. Try running with elevated privileges.`,
      details
    })
  }
}

export class NotOwnerError extends PortmanError {
  /** @param {number} pid @param {Record<string, unknown>} [details] */
  constructor(pid, details = {}) {
    super(`Not owner of pid ${pid}`, {
      code: 'ERR_NOT_OWNER',
      exitCode: EXIT_CODES.PERMISSION,
      userMessage: `You do not own process ${pid}. Re-run with sudo or pass --force to attempt anyway.`,
      details: { pid, ...details }
    })
  }
}
