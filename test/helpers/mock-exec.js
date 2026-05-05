import { readFile } from 'node:fs/promises'

/**
 * Build a fake ExecFn that returns canned stdout per binary name.
 * Routes are matched by file name (basename); first match wins.
 *
 * @param {Record<string, string | { stdout?: string, stderr?: string, code?: number }>} routes
 * @returns {import('../../src/types/platform.js').ExecFn}
 */
export function makeMockExec(routes) {
  return async (file) => {
    const route = routes[file]
    if (route == null) {
      throw Object.assign(new Error(`mock-exec: no route for ${file}`), { code: 'ENOENT' })
    }
    if (typeof route === 'string') {
      return { stdout: route, stderr: '', code: 0 }
    }
    return { stdout: route.stdout ?? '', stderr: route.stderr ?? '', code: route.code ?? 0 }
  }
}

/**
 * Convenience: read a fixture file once and return a mock-exec routing.
 * @param {string} file binary name (e.g. 'lsof')
 * @param {string} fixturePath
 */
export async function fixtureExec(file, fixturePath) {
  const stdout = await readFile(fixturePath, 'utf8')
  return makeMockExec({ [file]: stdout })
}
