import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN = join(__dirname, '..', '..', 'bin', 'pup-portman.js')

/**
 * @param {string[]} args
 * @param {{ env?: NodeJS.ProcessEnv }} [opts]
 */
function run(args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env: { ...process.env, NO_COLOR: '1', ...(opts.env ?? {}) }
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

test('--version prints semver-ish string', async () => {
  const r = await run(['--version'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /^\d+\.\d+\.\d+/)
})

test('--help prints USAGE block', async () => {
  const r = await run(['--help'])
  assert.equal(r.code, 0)
  assert.match(r.stdout, /USAGE/)
  assert.match(r.stdout, /pup-portman <port>/)
})

test('no args => help + exit 2', async () => {
  const r = await run([])
  assert.equal(r.code, 2)
  assert.match(r.stdout, /USAGE/)
})

test('unknown verb => help + exit 2', async () => {
  const r = await run(['frobnicate'])
  assert.equal(r.code, 2)
  assert.match(r.stdout, /unknown command/)
})

test('list --json on real OS returns JSON', async () => {
  const r = await run(['list', '--json'])
  assert.equal(r.code, 0)
  const parsed = JSON.parse(r.stdout)
  assert.ok(Array.isArray(parsed.occupied))
  assert.ok(Array.isArray(parsed.saved))
})

test('invalid port => exit 2', async () => {
  const r = await run(['kill', 'notanumber'])
  assert.equal(r.code, 2)
  assert.match(r.stderr, /Port must be an integer/)
})

test('kill on a port nobody owns => not-found exit 3', async () => {
  // Use 1 (privileged port likely not owned by us). Behavior on macOS/Windows may
  // surface different ports; pick something exotic to lower collision odds.
  const r = await run(['kill', '65530'])
  // 3 = not-found; 4 = permission (if something is there and we can't kill).
  assert.ok([3, 4].includes(r.code), `expected exit 3 or 4 got ${r.code} (stderr=${r.stderr})`)
})
