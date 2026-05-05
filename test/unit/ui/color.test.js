import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldUseColor, createColor } from '../../../src/ui/color.js'

const tty = { isTTY: true }
const nonTty = { isTTY: false }

test('disabled flag wins over everything', () => {
  assert.equal(shouldUseColor({ env: { FORCE_COLOR: '1' }, stream: tty, disabled: true }), false)
})

test('NO_COLOR disables color', () => {
  assert.equal(shouldUseColor({ env: { NO_COLOR: '1', FORCE_COLOR: '1' }, stream: tty }), false)
})

test('FORCE_COLOR enables color even without TTY', () => {
  assert.equal(shouldUseColor({ env: { FORCE_COLOR: '1' }, stream: nonTty }), true)
})

test('CI disables color when no FORCE_COLOR', () => {
  assert.equal(shouldUseColor({ env: { CI: 'true' }, stream: tty }), false)
})

test('TTY enables color', () => {
  assert.equal(shouldUseColor({ env: {}, stream: tty }), true)
})

test('non-TTY disables color', () => {
  assert.equal(shouldUseColor({ env: {}, stream: nonTty }), false)
})

test('createColor(false) returns identity functions', () => {
  const c = createColor(false)
  assert.equal(c.red('x'), 'x')
  assert.equal(c.green('y'), 'y')
})

test('createColor(true) wraps with ANSI codes', () => {
  const c = createColor(true)
  assert.equal(c.red('x'), '\x1b[31mx\x1b[0m')
})
