import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripAnsi, visibleWidth, padRight, padLeft, truncate } from '../../../src/utils/string.js'

const RED = '\x1b[31m'
const RESET = '\x1b[0m'

test('stripAnsi removes color codes', () => {
  assert.equal(stripAnsi(`${RED}hi${RESET}`), 'hi')
})

test('visibleWidth ignores ANSI', () => {
  assert.equal(visibleWidth(`${RED}hello${RESET}`), 5)
  assert.equal(visibleWidth('plain'), 5)
})

test('padRight pads to width', () => {
  assert.equal(padRight('a', 4), 'a   ')
  assert.equal(padRight(`${RED}a${RESET}`, 4), `${RED}a${RESET}   `)
})

test('padRight: no-op when already wide', () => {
  assert.equal(padRight('hello', 3), 'hello')
})

test('padLeft pads to width', () => {
  assert.equal(padLeft('a', 4), '   a')
})

test('truncate adds ellipsis', () => {
  assert.equal(truncate('hello world', 5), 'hell…')
})

test('truncate: no-op when short enough', () => {
  assert.equal(truncate('hi', 10), 'hi')
})

test('truncate: max=1 just slices', () => {
  assert.equal(truncate('abc', 1), 'a')
})
