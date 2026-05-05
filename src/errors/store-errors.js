import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export class StoreCorruptError extends PortmanError {
  /** @param {string} path @param {unknown} [cause] */
  constructor(path, cause) {
    super(`Store at ${path} is corrupt`, {
      code: 'ERR_STORE_CORRUPT',
      exitCode: EXIT_CODES.GENERAL,
      userMessage: `Project store at ${path} is not valid JSON. Delete it or fix it manually.`,
      cause,
      details: { path }
    })
  }
}

export class DuplicateNameError extends PortmanError {
  /** @param {string} name @param {number} existingPort */
  constructor(name, existingPort) {
    super(`Name "${name}" already maps to port ${existingPort}`, {
      code: 'ERR_DUPLICATE_NAME',
      exitCode: EXIT_CODES.USAGE,
      userMessage: `The name "${name}" is already saved (port ${existingPort}). Use --force to overwrite.`,
      details: { name, existingPort }
    })
  }
}
