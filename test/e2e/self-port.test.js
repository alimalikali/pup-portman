import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN = join(__dirname, '..', '..', 'bin', 'pup-portman.js')
const isWindows = process.platform === 'win32'

/**
 * @param {string[]} args
 */
function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env: { ...process.env, NO_COLOR: '1' }
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

/**
 * @param {number} preferred
 */
function listenOn(preferred) {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(preferred, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : preferred
      resolve({ srv, port })
    })
  })
}

test('inspect --json finds a port we just bound', { skip: isWindows /* netstat may take a beat to register */ }, async () => {
  /** @type {{ srv: import('node:net').Server, port: number }} */
  const { srv, port } = await listenOn(0)
  try {
    const r = await run([String(port), '--json'])
    assert.equal(r.code, 0)
    const out = JSON.parse(r.stdout)
    assert.equal(out.port, port)
    assert.equal(out.occupied, true)
    assert.ok(out.processes.length >= 1)
  } finally {
    srv.close()
  }
})
