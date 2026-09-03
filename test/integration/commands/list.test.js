import { test } from 'node:test'
import assert from 'node:assert/strict'
import { list } from '../../../src/commands/list.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'

test('list --json emits structured output', async () => {
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => [],
      listAll: async () => [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }]
    },
    store: /** @type {any} */ ({ list: async () => [{ port: 5432, name: 'db', savedAt: '2026-01-01T00:00:00Z' }] })
  })
  const code = await list(parseArgv(['list', '--json']), ctx)
  assert.equal(code, 0)
  const out = JSON.parse(/** @type {any} */ (ctx.stdout).text)
  assert.equal(out.occupied[0].port, 3000)
  assert.equal(out.saved[0].name, 'db')
})

test('list (text) renders a table', async () => {
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => [],
      listAll: async () => [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }]
    }
  })
  const code = await list(parseArgv(['list']), ctx)
  assert.equal(code, 0)
  assert.match(/** @type {any} */ (ctx.stdout).text, /3000/)
  assert.match(/** @type {any} */ (ctx.stdout).text, /node/)
})

test('list surfaces project store errors', async () => {
  const failure = Object.assign(new Error('corrupt'), { code: 'ERR_STORE_CORRUPT' })
  const ctx = makeCtx({ store: /** @type {any} */ ({ list: async () => { throw failure } }) })
  await assert.rejects(list(parseArgv(['list']), ctx), failure)
})
