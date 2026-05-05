import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export class InvalidPortError extends PortmanError {
  /** @param {unknown} value @param {string} [reason] */
  constructor(value, reason) {
    const display = typeof value === 'string' ? `"${value}"` : String(value)
    const why = reason ? ` (${reason})` : ''
    super(`Invalid port: ${display}${why}`, {
      code: 'ERR_INVALID_PORT',
      exitCode: EXIT_CODES.USAGE,
      userMessage: `Port must be an integer between 1 and 65535. Got ${display}${why}.`,
      details: { value, reason }
    })
  }
}

export class PortNotFoundError extends PortmanError {
  /** @param {number} port */
  constructor(port) {
    super(`No process listening on port ${port}`, {
      code: 'ERR_PORT_NOT_FOUND',
      exitCode: EXIT_CODES.NOT_FOUND,
      userMessage: `No process is listening on port ${port}.`,
      details: { port }
    })
  }
}

export class PortInUseError extends PortmanError {
  /** @param {number} port */
  constructor(port) {
    super(`Port ${port} is in use`, {
      code: 'ERR_PORT_IN_USE',
      exitCode: EXIT_CODES.GENERAL,
      userMessage: `Port ${port} is in use.`,
      details: { port }
    })
  }
}
