import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
/** Resolved at runtime to avoid baking the version into compiled output. */
const PKG_PATH = join(__dirname, '..', '..', 'package.json')

/**
 * Read the version field from package.json.
 * @returns {Promise<string>}
 */
export async function getVersion() {
  const raw = await readFile(PKG_PATH, 'utf8')
  const pkg = JSON.parse(raw)
  return String(pkg.version ?? '0.0.0')
}

/**
 * @param {{ stdout: NodeJS.WriteStream }} streams
 */
export async function printVersion(streams) {
  streams.stdout.write((await getVersion()) + '\n')
}
