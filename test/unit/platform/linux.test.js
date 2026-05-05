import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { makeMockExec } from '../../helpers/mock-exec.js'
import { createLinuxAdapter } from '../../../src/platform/linux.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', 'fixtures', 'linux')

test('linux adapter: findByPort returns parsed rows', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const exec = makeMockExec({ ss: stdout })
  const adapter = createLinuxAdapter(exec)
  const out = await adapter.findByPort(8080)
  assert.equal(out.length, 1)
  assert.equal(out[0].port, 8080)
  assert.equal(out[0].command, 'MainThread')
})

test('linux adapter: listAll returns many', async () => {
  const stdout = await readFile(join(fixDir, 'ss-listening.txt'), 'utf8')
  const exec = makeMockExec({ ss: stdout })
  const adapter = createLinuxAdapter(exec)
  const out = await adapter.listAll()
  assert.ok(out.length >= 4)
})

test('linux adapter: name === linux', () => {
  const adapter = createLinuxAdapter(makeMockExec({ ss: '' }))
  assert.equal(adapter.name, 'linux')
})
