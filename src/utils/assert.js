/**
 * Used in exhaustive switches over a union type.
 * @param {never} x
 * @returns {never}
 */
export function assertNever(x) {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`)
}
