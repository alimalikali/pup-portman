import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kill } from '../../../src/commands/kill.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'

test('kill: no process on port throws PortNotFoundError (text mode)', async () => {
  const ctx = makeCtx({ adapter: { name: 'linux', findByPort: async () => [], listAll: async () => [] } })
  await assert.rejects(kill(parseArgv(['kill', '3000']), ctx), (err) => err.code === 'ERR_PORT_NOT_FOUND')
})

test('kill --json with no process emits notFound=true', async () => {
  const ctx = makeCtx({ adapter: { name: 'linux', findByPort: async () => [], listAll: async () => [] } })
  const code = await kill(parseArgv(['kill', '3000', '--json']), ctx)
  assert.equal(code, 0)
  const out = JSON.parse(/** @type {any} */ (ctx.stdout).text)
  assert.equal(out.notFound, true)
})

test('kill: windows path invokes taskkill', async () => {
  let lastFile = null
  const ctx = makeCtx({
    platform: 'win',
    adapter: {
      name: 'win',
      findByPort: async () => [{ pid: 48291, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }],
      listAll: async () => []
    },
    exec: async (file) => { lastFile = file; return { stdout: '', stderr: '', code: 0 } }
  })
  const code = await kill(parseArgv(['kill', '3000']), ctx)
  assert.equal(code, 0)
  assert.equal(lastFile, 'taskkill')
})
