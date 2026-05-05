import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handle, PortmanError, InvalidPortError } from '../../../src/errors/index.js'

test('handle: PortmanError yields its exitCode and userMessage', () => {
  const err = new PortmanError('boom', { code: 'ERR_X', exitCode: 7, userMessage: 'thing failed' })
  const { exitCode, message } = handle(err)
  assert.equal(exitCode, 7)
  assert.match(message, /thing failed/)
})

test('handle: subclass uses subclass exitCode', () => {
  const { exitCode, message } = handle(new InvalidPortError('abc'))
  assert.equal(exitCode, 2)
  assert.match(message, /Port must be an integer/)
})

test('handle: generic Error returns INTERNAL exit code', () => {
  const { exitCode, message } = handle(new Error('whoops'))
  assert.equal(exitCode, 70)
  assert.match(message, /internal error/)
  assert.match(message, /DEBUG=pup-portman/)
})

test('handle: non-Error value still produces a message', () => {
  const { exitCode, message } = handle('a string')
  assert.equal(exitCode, 70)
  assert.match(message, /a string/)
})

test('handle: debug=true includes details and stack', () => {
  const err = new InvalidPortError(99999, 'too big')
  const { message } = handle(err, { debug: true })
  assert.match(message, /code: ERR_INVALID_PORT/)
  assert.match(message, /details:/)
})
