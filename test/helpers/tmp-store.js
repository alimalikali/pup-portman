import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProjectStore } from '../../src/infra/store.js'

/**
 * @returns {Promise<{ store: ProjectStore, path: string, dir: string, cleanup: () => Promise<void> }>}
 */
export async function makeTmpStore() {
  const dir = await mkdtemp(join(tmpdir(), 'pup-portman-test-'))
  const path = join(dir, 'projects.json')
  const store = new ProjectStore({ path })
  return {
    store,
    path,
    dir,
    cleanup: () => rm(dir, { recursive: true, force: true })
  }
}
