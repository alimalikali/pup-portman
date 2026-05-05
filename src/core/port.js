import { InvalidPortError } from '../errors/port-errors.js'
import { PORT_MIN, PORT_MAX, PRIVILEGED_PORT_MAX } from '../constants/defaults.js'

/**
 * Strictly parse a port from a string. Rejects leading zeros, signs, decimals.
 * @param {unknown} value
 * @returns {number}
 */
export function parsePort(value) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return validatePort(value, value)
  }
  if (typeof value !== 'string') {
    throw new InvalidPortError(value, 'must be a number or string')
  }
  const trimmed = value.trim()
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new InvalidPortError(value, 'must contain only digits')
  }
  const n = Number.parseInt(trimmed, 10)
  return validatePort(n, value)
}

/**
 * Validate that a number is a legal port. Returns it on success.
 * @param {number} n
 * @param {unknown} originalValue used for the error message
 * @returns {number}
 */
export function validatePort(n, originalValue = n) {
  if (!Number.isInteger(n)) throw new InvalidPortError(originalValue, 'must be an integer')
  if (n < PORT_MIN || n > PORT_MAX) {
    throw new InvalidPortError(originalValue, `out of range ${PORT_MIN}-${PORT_MAX}`)
  }
  return n
}

/**
 * @param {number} port
 * @returns {boolean}
 */
export function isPrivileged(port) {
  return Number.isInteger(port) && port > 0 && port <= PRIVILEGED_PORT_MAX
}
