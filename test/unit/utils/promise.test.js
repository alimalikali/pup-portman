import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sleep, withTimeout } from '../../../src/utils/promise.js'

test('sleep resolves after ms', async () => {
  const start = Date.now()
  await sleep(20)
  assert.ok(Date.now() - start >= 18)
})

test('sleep aborts when signal fires', async () => {
  const ac = new AbortController()
  setTimeout(() => ac.abort(), 5)
  await assert.rejects(sleep(1000, { signal: ac.signal }), /Abort/i)
})

test('sleep rejects immediately on already-aborted signal', async () => {
  const ac = new AbortController()
  ac.abort()
  await assert.rejects(sleep(100, { signal: ac.signal }), /Abort/i)
})

test('withTimeout resolves when promise wins', async () => {
  const v = await withTimeout(Promise.resolve(42), 100)
  assert.equal(v, 42)
})

test('withTimeout rejects when timeout wins', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10), /Timeout/)
})
