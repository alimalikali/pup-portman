import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fixtureExec } from '../../helpers/mock-exec.js'
import { createMacAdapter } from '../../../src/platform/mac.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', 'fixtures', 'mac')

test('mac adapter: findByPort filters and parses', async () => {
  const exec = await fixtureExec('lsof', join(fixDir, 'lsof-port-3000.txt'))
  const adapter = createMacAdapter(exec)
  const out = await adapter.findByPort(3000)
  assert.equal(out.length, 1)
  assert.equal(out[0].port, 3000)
  assert.equal(out[0].command, 'node')
})

test('mac adapter: listAll returns all listening ports', async () => {
  const exec = await fixtureExec('lsof', join(fixDir, 'lsof-listening.txt'))
  const adapter = createMacAdapter(exec)
  const out = await adapter.listAll()
  assert.ok(out.length >= 4)
})

test('mac adapter: name === mac', () => {
  const adapter = createMacAdapter(async () => ({ stdout: '', stderr: '', code: 0 }))
  assert.equal(adapter.name, 'mac')
})
