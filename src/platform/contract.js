/**
 * @typedef {import('../types/domain.js').ProcessInfo} ProcessInfo
 * @typedef {import('../types/domain.js').PlatformTag} PlatformTag
 *
 * @typedef {Object} PlatformAdapter
 * @property {PlatformTag} name
 * @property {(port: number) => Promise<ProcessInfo[]>} findByPort
 * @property {() => Promise<ProcessInfo[]>}             listAll
 */

export {}
