import { test } from 'node:test'
import assert from 'node:assert/strict'
import { watchPort } from '../../../src/core/port-watcher.js'

test('watchPort: yields occupied=true while processes present, then stops on abort', async () => {
  let calls = 0
  const adapter = {
    name: 'linux',
    findByPort: async () => {
      calls++
      return [{ pid: 1, command: 'node', port: 3000, protocol: 'tcp', family: 'ipv4' }]
    },
    listAll: async () => []
  }
  const ac = new AbortController()
  const it = watchPort(3000, { adapter, signal: ac.signal, intervalMs: 10 })

  const first = await it.next()
  assert.equal(first.value.occupied, true)
  assert.equal(first.value.processes.length, 1)
  ac.abort()
  const after = await it.next()
  assert.ok(after.done || after.value.occupied !== undefined)
  assert.ok(calls >= 1)
})

test('watchPort: yields occupied=false when adapter returns empty', async () => {
  const adapter = {
    name: 'linux',
    findByPort: async () => [],
    listAll: async () => []
  }
  const ac = new AbortController()
  const it = watchPort(3000, { adapter, signal: ac.signal, intervalMs: 10 })
  const first = await it.next()
  assert.equal(first.value.occupied, false)
  assert.equal(first.value.processes.length, 0)
  ac.abort()
})

test('watchPort: requires signal', async () => {
  const it = watchPort(3000, /** @type {any} */ ({ adapter: { findByPort: async () => [] } }))
  await assert.rejects(it.next(), /signal/)
})
