import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseLsof } from '../../../../src/platform/parsers/lsof.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', '..', 'fixtures', 'mac')

test('parseLsof: empty input returns []', () => {
  assert.deepEqual(parseLsof(''), [])
})

test('parseLsof: parses a single port with both ipv4+ipv6 collapsed', async () => {
  const stdout = await readFile(join(fixDir, 'lsof-port-3000.txt'), 'utf8')
  const out = parseLsof(stdout)
  assert.equal(out.length, 1)
  assert.equal(out[0].pid, 48291)
  assert.equal(out[0].command, 'node')
  assert.equal(out[0].port, 3000)
  assert.equal(out[0].protocol, 'tcp')
  assert.equal(out[0].family, 'both')
  assert.equal(out[0].user, 'ali')
})

test('parseLsof: filters by port', async () => {
  const stdout = await readFile(join(fixDir, 'lsof-listening.txt'), 'utf8')
  const out = parseLsof(stdout, { port: 5432 })
  assert.equal(out.length, 1)
  assert.equal(out[0].command, 'postgres')
  assert.equal(out[0].port, 5432)
})

test('parseLsof: ignores non-LISTEN lines', () => {
  const stdout = `COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
node 100 ali 5u IPv4 0xabc 0t0 TCP 10.0.0.1:80->1.2.3.4:9999 (ESTABLISHED)`
  assert.deepEqual(parseLsof(stdout), [])
})

test('parseLsof: skips garbage lines', () => {
  assert.deepEqual(parseLsof('garbage'), [])
})

test('parseLsof: multiple distinct PIDs preserved', async () => {
  const stdout = await readFile(join(fixDir, 'lsof-listening.txt'), 'utf8')
  const out = parseLsof(stdout)
  const pids = out.map((p) => p.pid).sort((a, b) => a - b)
  assert.deepEqual(pids, [500, 1042, 9321, 48291])
})

test('parseLsof: ipv6-only address parsed', () => {
  const stdout = `COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
foo 1 ali 5u IPv6 0xabc 0t0 TCP [::1]:8080 (LISTEN)`
  const out = parseLsof(stdout)
  assert.equal(out.length, 1)
  assert.equal(out[0].port, 8080)
  assert.equal(out[0].family, 'ipv6')
})
