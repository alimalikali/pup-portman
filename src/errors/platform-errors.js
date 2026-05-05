import { PortmanError } from './base.js'
import { EXIT_CODES } from '../constants/exit-codes.js'

export class UnsupportedPlatformError extends PortmanError {
  /** @param {string} platform */
  constructor(platform) {
    super(`Unsupported platform: ${platform}`, {
      code: 'ERR_UNSUPPORTED_PLATFORM',
      exitCode: EXIT_CODES.PLATFORM,
      userMessage: `pup-portman does not support platform "${platform}". Supported: macOS, Linux, Windows.`,
      details: { platform }
    })
  }
}

export class ToolNotFoundError extends PortmanError {
  /** @param {string} tool @param {string} [hint] */
  constructor(tool, hint) {
    const suffix = hint ? ` (${hint})` : ''
    super(`Required tool not found: ${tool}${suffix}`, {
      code: 'ERR_TOOL_NOT_FOUND',
      exitCode: EXIT_CODES.PLATFORM,
      userMessage: `pup-portman needs "${tool}" but it was not found on PATH.${hint ? ' ' + hint : ''}`,
      details: { tool, hint }
    })
  }
}
