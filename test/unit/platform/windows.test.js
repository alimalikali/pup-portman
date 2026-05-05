import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { makeMockExec } from '../../helpers/mock-exec.js'
import { createWindowsAdapter } from '../../../src/platform/windows.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', 'fixtures', 'windows')

test('windows adapter: findByPort enriches with tasklist image', async () => {
  const netstat = await readFile(join(fixDir, 'netstat-ano.txt'), 'utf8')
  const tasklist = await readFile(join(fixDir, 'tasklist-pid.txt'), 'utf8')
  const exec = makeMockExec({ netstat, tasklist })
  const adapter = createWindowsAdapter(exec)
  const out = await adapter.findByPort(3000)
  assert.equal(out.length, 1)
  assert.equal(out[0].pid, 48291)
  assert.equal(out[0].command, 'node')
})

test('windows adapter: listAll returns multiple', async () => {
  const netstat = await readFile(join(fixDir, 'netstat-ano.txt'), 'utf8')
  const exec = makeMockExec({ netstat, tasklist: '' })
  const adapter = createWindowsAdapter(exec)
  const out = await adapter.listAll()
  assert.ok(out.length >= 4)
})

test('windows adapter: name === win', () => {
  const adapter = createWindowsAdapter(makeMockExec({ netstat: '' }))
  assert.equal(adapter.name, 'win')
})
