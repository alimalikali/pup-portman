import { test } from 'node:test'
import assert from 'node:assert/strict'
import { confirm } from '../../../src/infra/prompt.js'

test('confirm: assumeYes resolves true without prompting', async () => {
  const result = await confirm('proceed?', { assumeYes: true })
  assert.equal(result, true)
})

test('confirm: non-TTY resolves to default=false', async () => {
  const fakeStream = { isTTY: false }
  const result = await confirm('proceed?', { input: /** @type {any} */ (fakeStream), output: /** @type {any} */ (fakeStream) })
  assert.equal(result, false)
})

test('confirm: non-TTY resolves to default=true when set', async () => {
  const fakeStream = { isTTY: false }
  const result = await confirm('proceed?', { default: true, input: /** @type {any} */ (fakeStream), output: /** @type {any} */ (fakeStream) })
  assert.equal(result, true)
})
