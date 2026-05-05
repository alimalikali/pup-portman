import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseNetstat } from '../../../../src/platform/parsers/netstat.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', '..', 'fixtures', 'windows')

test('parseNetstat: empty fixture returns []', async () => {
  const stdout = await readFile(join(fixDir, 'netstat-empty.txt'), 'utf8')
  assert.deepEqual(parseNetstat(stdout), [])
})

test('parseNetstat: parses LISTENING TCP rows', async () => {
  const stdout = await readFile(join(fixDir, 'netstat-ano.txt'), 'utf8')
  const out = parseNetstat(stdout)
  const tcp3000 = out.filter((p) => p.port === 3000)
  assert.equal(tcp3000.length, 1) // ipv4+ipv6 collapsed
  assert.equal(tcp3000[0].pid, 48291)
  assert.equal(tcp3000[0].family, 'both')
})

test('parseNetstat: includes UDP rows', async () => {
  const stdout = await readFile(join(fixDir, 'netstat-ano.txt'), 'utf8')
  const out = parseNetstat(stdout)
  const udp = out.filter((p) => p.protocol === 'udp')
  assert.ok(udp.length >= 2)
  assert.ok(udp.some((p) => p.port === 5353))
})

test('parseNetstat: filters by port', async () => {
  const stdout = await readFile(join(fixDir, 'netstat-ano.txt'), 'utf8')
  const out = parseNetstat(stdout, { port: 5432 })
  assert.equal(out.length, 1)
  assert.equal(out[0].pid, 1042)
})

test('parseNetstat: garbage returns []', () => {
  assert.deepEqual(parseNetstat('not valid'), [])
})
