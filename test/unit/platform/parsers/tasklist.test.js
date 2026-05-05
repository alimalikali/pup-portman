import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseTasklist } from '../../../../src/platform/parsers/tasklist.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixDir = join(__dirname, '..', '..', '..', 'fixtures', 'windows')

test('parseTasklist: parses single CSV row', async () => {
  const stdout = await readFile(join(fixDir, 'tasklist-pid.txt'), 'utf8')
  const out = parseTasklist(stdout)
  assert.deepEqual(out, { pid: 48291, image: 'node' })
})

test('parseTasklist: empty input returns null', () => {
  assert.equal(parseTasklist(''), null)
})

test('parseTasklist: handles quoted commas inside fields', () => {
  const out = parseTasklist('"my,proc.exe","123","Console","1","45,672 K"')
  assert.deepEqual(out, { pid: 123, image: 'my,proc' })
})

test('parseTasklist: missing pid returns null', () => {
  const out = parseTasklist('"node.exe","not-a-pid"')
  assert.equal(out, null)
})
