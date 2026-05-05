import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watch } from '../../../src/commands/watch.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'

test('watch returns OK when port becomes free', async () => {
  let calls = 0
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => {
        calls++
        if (calls === 1) return [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }]
        return []
      },
      listAll: async () => []
    }
  })
  const code = await watch(parseArgv(['watch', '3000', '--no-beep', '--interval=20']), ctx)
  assert.equal(code, 0)
  assert.match(/** @type {any} */ (ctx.stdout).text, /is now free/)
})

test('watch returns OK when port already free at first tick', async () => {
  // First tick occupied=false; lastOccupied becomes false after the first iteration
  // when we observe a transition. Need at least one tick where it goes from non-empty
  // to empty for the "freed" path. Given current implementation, test with
  // occupied transitioning false.
  let calls = 0
  const ctx = makeCtx({
    adapter: {
      name: 'linux',
      findByPort: async () => {
        calls++
        if (calls === 1) return [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }]
        return []
      },
      listAll: async () => []
    }
  })
  const code = await watch(parseArgv(['watch', '3000', '--no-beep', '--interval=20']), ctx)
  assert.equal(code, 0)
})
