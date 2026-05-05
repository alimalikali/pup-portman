#!/usr/bin/env node
/**
 * Pre-publish sanity script. Fails fast with a clear message if the package
 * shape isn't what we expect to ship to npm.
 */
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { execFile } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

/** @type {string[]} */
const errors = []

const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'))

// 1. No runtime dependencies.
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  errors.push(`runtime dependencies forbidden: ${Object.keys(pkg.dependencies).join(', ')}`)
}

// 2. Files allowlist is set.
if (!Array.isArray(pkg.files) || pkg.files.length === 0) {
  errors.push('package.json "files" allowlist is required')
}

// 3. bin/pup-portman.js exists, has shebang, and (on POSIX) is executable.
const binPath = join(ROOT, 'bin', 'pup-portman.js')
const binStat = await stat(binPath)
if (!binStat.isFile()) errors.push('bin/pup-portman.js missing')
const binText = await readFile(binPath, 'utf8')
if (!binText.startsWith('#!/usr/bin/env node')) errors.push('bin/pup-portman.js missing shebang')
if (process.platform !== 'win32') {
  const mode = binStat.mode & 0o111
  if (mode === 0) errors.push('bin/pup-portman.js is not executable')
}

// 4. version is semver.
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(pkg.version)) {
  errors.push(`version "${pkg.version}" is not semver`)
}

// 5. npm pack --dry-run does not include test files or fixtures.
const packed = await new Promise((resolve, reject) => {
  execFile('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT }, (err, stdout) => {
    if (err) reject(err); else resolve(stdout)
  })
})
const packInfo = JSON.parse(packed)[0]
const forbidden = packInfo.files
  .map((/** @type {{ path: string }} */ f) => f.path)
  .filter((/** @type {string} */ p) => /\.test\.[mc]?js$/i.test(p) || p.startsWith('test/') || p.startsWith('.github/'))
if (forbidden.length > 0) {
  errors.push(`forbidden files in tarball:\n  - ${forbidden.join('\n  - ')}`)
}

if (errors.length > 0) {
  console.error('verify-publish: FAIL\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}
console.log('verify-publish: OK')
console.log(`  tarball: ${packInfo.filename} (${(packInfo.size / 1024).toFixed(1)} KiB unpacked, ${packInfo.entryCount} files)`)
