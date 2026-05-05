import { parseLsof } from './parsers/lsof.js'

/**
 * Build a macOS PlatformAdapter backed by `lsof`.
 *
 * @param {import('../types/platform.js').ExecFn} exec
 * @returns {import('./contract.js').PlatformAdapter}
 */
export function createMacAdapter(exec) {
  return {
    name: 'mac',
    async findByPort(port) {
      // lsof exits 1 when nothing matches; allowFailure to treat that as "empty".
      const { stdout } = await exec('lsof', ['-i', `:${port}`, '-P', '-n'], { allowFailure: true })
      return parseLsof(stdout, { port })
    },
    async listAll() {
      const { stdout } = await exec('lsof', ['-iTCP', '-sTCP:LISTEN', '-P', '-n'], { allowFailure: true })
      return parseLsof(stdout)
    }
  }
}
