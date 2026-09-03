import { mkdir, readFile, writeFile, rename, chmod, open, rm, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { StoreCorruptError, DuplicateNameError, StoreLockTimeoutError } from '../errors/store-errors.js'
import { STORE_LOCK_STALE_MS, STORE_LOCK_TIMEOUT_MS } from '../constants/defaults.js'
import { sleep } from '../utils/promise.js'

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
    return this.#withLock(async () => {
      const entries = await this.load()
      const trimmedName = name.trim()
      const existingIdx = entries.findIndex((e) => e.name === trimmedName)
      if (existingIdx !== -1 && !opts.force) {
        throw new DuplicateNameError(trimmedName, entries[existingIdx].port)
      }
      const entry = { port, name: trimmedName, savedAt: new Date().toISOString() }
      if (existingIdx !== -1) entries[existingIdx] = entry
      else entries.push(entry)
      await this.#writeAtomic(entries)
      return entry
    })
  }

  /**
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async remove(name) {
    return this.#withLock(async () => {
      const entries = await this.load()
      const next = entries.filter((e) => e.name !== name)
      if (next.length === entries.length) return false
      await this.#writeAtomic(next)
      return true
    })
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
    try {
      await writeFile(tmp, data, { mode: FILE_MODE })
      try { await chmod(tmp, FILE_MODE) } catch (_) { /* best-effort on Windows */ }
      await rename(tmp, this.path)
      try { await chmod(this.path, FILE_MODE) } catch (_) { /* best-effort on Windows */ }
    } finally {
      await rm(tmp, { force: true }).catch(() => {})
    }
  }

  /** @template T @param {() => Promise<T>} operation @returns {Promise<T>} */
  async #withLock(operation) {
    const lockPath = `${this.path}.lock`
    const dir = dirname(this.path)
    await mkdir(dir, { recursive: true, mode: DIR_MODE })
    const deadline = Date.now() + STORE_LOCK_TIMEOUT_MS
    /** @type {import('node:fs/promises').FileHandle | null} */
    let handle = null
    while (!handle) {
      try {
        handle = await open(lockPath, 'wx', FILE_MODE)
      } catch (err) {
        if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'EEXIST') throw err
        try {
          const info = await stat(lockPath)
          if (Date.now() - info.mtimeMs > STORE_LOCK_STALE_MS) {
            await rm(lockPath, { force: true })
            continue
          }
        } catch (statErr) {
          if (/** @type {NodeJS.ErrnoException} */ (statErr).code === 'ENOENT') continue
          throw statErr
        }
        if (Date.now() >= deadline) throw new StoreLockTimeoutError(lockPath, STORE_LOCK_TIMEOUT_MS)
        await sleep(25)
      }
    }
    try {
      await handle.writeFile(`${process.pid}\n`)
    } catch (err) {
      await handle.close().catch(() => {})
      await rm(lockPath, { force: true }).catch(() => {})
      throw err
    }
    try {
      return await operation()
    } finally {
      await handle.close().catch(() => {})
      await rm(lockPath, { force: true }).catch(() => {})
    }
  }
}
