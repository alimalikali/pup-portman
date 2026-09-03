import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseSs } from '../../../../src/platform/parsers/ss.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', '..', 'fixtures', 'linux')

test('parseSs: empty file returns []', async () => {
  const stdout = await readFile(join(fixDir, 'ss-empty.txt'), 'utf8')
  assert.deepEqual(parseSs(stdout), [])
})

test('parseSs: extracts port from real listing', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const out = parseSs(stdout)
  const ports = out.map((p) => p.port).sort((a, b) => a - b)
  assert.ok(ports.includes(3000))
  assert.ok(ports.includes(8080))
  assert.ok(ports.includes(631))
})

test('parseSs: rows with empty Process column still surface the port', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const out = parseSs(stdout)
  const port631 = out.find((p) => p.port === 631)
  assert.ok(port631)
  assert.equal(port631.command, 'unknown')
  assert.equal(port631.pid, null)
})

test('parseSs: parses both processes for a multi-bound port', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const out = parseSs(stdout, { port: 3000 })
  assert.equal(out.length, 2)
  assert.deepEqual(out.map((p) => p.pid).sort((a, b) => a - b), [4727, 4728])
})

test('parseSs: filters by port', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const out = parseSs(stdout, { port: 8080 })
  assert.equal(out.length, 1)
  assert.equal(out[0].command, 'MainThread')
})

test('parseSs: ipv6 [::1] address parses', () => {
  const stdout = 'State Recv-Q Send-Q Local Address:Port  Peer Address:Port Process\n' +
    'LISTEN 0 4096 [::1]:631 [::]:* '
  const out = parseSs(stdout)
  assert.equal(out.length, 1)
  assert.equal(out[0].port, 631)
  assert.equal(out[0].family, 'ipv6')
})

test('parseSs: garbage returns []', () => {
  assert.deepEqual(parseSs('totally garbage data'), [])
})
