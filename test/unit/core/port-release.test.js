import { test } from 'node:test'
import assert from 'node:assert/strict'
import { waitForPortRelease } from '../../../src/core/port-release.js'

const processInfo = { pid: 42, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }

test('waitForPortRelease observes a delayed release', async () => {
  let calls = 0
  const adapter = {
    name: 'linux',
    findByPort: async () => ++calls < 3 ? [processInfo] : [],
    listAll: async () => []
  }
  const result = await waitForPortRelease(3000, { adapter, timeoutMs: 100, intervalMs: 1 })
  assert.equal(result.free, true)
  assert.equal(calls, 3)
})

test('waitForPortRelease returns remaining listeners at timeout', async () => {
  const adapter = {
    name: 'linux',
    findByPort: async () => [processInfo],
    listAll: async () => []
  }
  const result = await waitForPortRelease(3000, { adapter, timeoutMs: 1, intervalMs: 1 })
  assert.equal(result.free, false)
  assert.deepEqual(result.processes, [processInfo])
})
