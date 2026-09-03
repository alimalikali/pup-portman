import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspect } from '../../../src/commands/inspect.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'

test('inspect: empty port throws PortNotFoundError', async () => {
  const ctx = makeCtx({ adapter: { name: 'linux', findByPort: async () => [], listAll: async () => [] } })
  await assert.rejects(inspect(parseArgv(['3000']), ctx), (err) => err.code === 'ERR_PORT_NOT_FOUND')
})

test('inspect --json with no process emits occupied=false', async () => {
  const ctx = makeCtx({ adapter: { name: 'linux', findByPort: async () => [], listAll: async () => [] } })
  const code = await inspect(parseArgv(['3000', '--json']), ctx)
  assert.equal(code, 0)
  const out = JSON.parse(/** @type {any} */ (ctx.stdout).text)
  assert.equal(out.occupied, false)
})

test('inspect --json --yes does not prompt and does not kill (json mode is read-only)', async () => {
  let killed = false
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }],
      listAll: async () => []
    },
    exec: async () => { killed = true; return { stdout: '', stderr: '', code: 0 } }
  })
  await inspect(parseArgv(['3000', '--json']), ctx)
  assert.equal(killed, false)
})

test('inspect text: prompt rejected does not kill', async () => {
  let killCalls = 0
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => [{ pid: 99999999, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }],
      listAll: async () => []
    },
    prompt: async () => false,
    exec: async () => { killCalls++; return { stdout: '', stderr: '', code: 0 } }
  })
  const code = await inspect(parseArgv(['3000']), ctx)
  assert.equal(code, 0)
  assert.equal(killCalls, 0)
  assert.match(/** @type {any} */ (ctx.stdout).text, /aborted/)
})

test('inspect: invalid port (manually invoked) throws InvalidPortError', async () => {
  const ctx = makeCtx()
  // Bypass parser: inspect only sees a synthetic ParsedArgs.
  await assert.rejects(
    inspect({ verb: 'inspect', positionals: ['abc'], flags: {}, raw: ['abc'] }, ctx),
    (err) => err.code === 'ERR_INVALID_PORT'
  )
})

test('inspect: unavailable PID is displayed and never prompts', async () => {
  let prompts = 0
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => [{ pid: null, command: 'unknown', port: 3000, protocol: 'tcp', family: 'ipv4' }],
      listAll: async () => []
    },
    prompt: async () => { prompts++; return true }
  })
  await assert.rejects(inspect(parseArgv(['3000']), ctx), (err) => err.code === 'ERR_PERMISSION_DENIED')
  assert.equal(prompts, 0)
  assert.match(/** @type {any} */ (ctx.stdout).text, /unavailable/)
})
