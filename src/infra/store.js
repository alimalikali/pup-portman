import { mkdir, readFile, writeFile, rename, chmod } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { StoreCorruptError, DuplicateNameError } from '../errors/store-errors.js'

/**
 * @typedef {import('../types/domain.js').ProjectEntry} ProjectEntry
 */

const FILE_MODE = 0o600
const DIR_MODE = 0o700

export class ProjectStore {
  /**
   * @param {object} opts
   * @param {string} opts.path
   */
  constructor(opts) {
    if (!opts || typeof opts.path !== 'string') {
      throw new TypeError('ProjectStore: opts.path is required')
    }
    this.path = opts.path
  }

  /**
   * @returns {Promise<ProjectEntry[]>}
   */
  async load() {
    let raw
    try {
      raw = await readFile(this.path, 'utf8')
    } catch (err) {
      if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') return []
      throw err
    }
    if (raw.trim().length === 0) return []
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (cause) {
      throw new StoreCorruptError(this.path, cause)
    }
    if (!Array.isArray(parsed)) {
      throw new StoreCorruptError(this.path)
    }
    return parsed
      .filter((e) => e && typeof e === 'object')
      .map((e) => /** @type {ProjectEntry} */ ({
        port: Number(e.port),
        name: String(e.name),
        savedAt: typeof e.savedAt === 'string' ? e.savedAt : new Date().toISOString()
      }))
      .filter((e) => Number.isInteger(e.port) && e.name.length > 0)
  }

  /**
   * @param {number} port
   * @param {string} name
   * @param {{ force?: boolean }} [opts]
   * @returns {Promise<ProjectEntry>}
   */
  async save(port, name, opts = {}) {
    const entries = await this.load()
    const trimmedName = name.trim()
    const existingIdx = entries.findIndex((e) => e.name === trimmedName)
    if (existingIdx !== -1 && !opts.force) {
      throw new DuplicateNameError(trimmedName, entries[existingIdx].port)
    }
    const entry = { port, name: trimmedName, savedAt: new Date().toISOString() }
    if (existingIdx !== -1) {
      entries[existingIdx] = entry
    } else {
      entries.push(entry)
    }
    await this.#writeAtomic(entries)
    return entry
  }

  /**
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async remove(name) {
    const entries = await this.load()
    const next = entries.filter((e) => e.name !== name)
    if (next.length === entries.length) return false
    await this.#writeAtomic(next)
    return true
  }

  /**
   * @returns {Promise<ProjectEntry[]>}
   */
  async list() {
    return this.load()
  }

  /**
   * @param {ProjectEntry[]} entries
   */
  async #writeAtomic(entries) {
    const dir = dirname(this.path)
    await mkdir(dir, { recursive: true, mode: DIR_MODE })
    const tmp = `${this.path}.${randomBytes(6).toString('hex')}.tmp`
    const data = JSON.stringify(entries, null, 2) + '\n'
    await writeFile(tmp, data, { mode: FILE_MODE })
    try {
      await chmod(tmp, FILE_MODE)
    } catch (_) { /* best-effort on Windows */ }
    await rename(tmp, this.path)
    try {
      await chmod(this.path, FILE_MODE)
    } catch (_) { /* best-effort on Windows */ }
  }
}
