import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePort, validatePort, isPrivileged } from '../../../src/core/port.js'

test('parsePort: accepts valid string', () => {
  assert.equal(parsePort('3000'), 3000)
})

test('parsePort: accepts valid number', () => {
  assert.equal(parsePort(3000), 3000)
})

test('parsePort: trims whitespace', () => {
  assert.equal(parsePort('  3000  '), 3000)
})

test('parsePort: rejects non-digit string', () => {
  assert.throws(() => parsePort('abc'), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: rejects negative', () => {
  assert.throws(() => parsePort('-1'), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: rejects 0', () => {
  assert.throws(() => parsePort(0), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: rejects > 65535', () => {
  assert.throws(() => parsePort('65536'), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: accepts boundary 65535', () => {
  assert.equal(parsePort('65535'), 65535)
})

test('parsePort: accepts boundary 1', () => {
  assert.equal(parsePort('1'), 1)
})

test('parsePort: rejects float string', () => {
  assert.throws(() => parsePort('80.5'), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: rejects empty string', () => {
  assert.throws(() => parsePort(''), (err) => err.code === 'ERR_INVALID_PORT')
})

test('parsePort: rejects non-string non-number', () => {
  assert.throws(() => parsePort(/** @type {any} */ ({})), (err) => err.code === 'ERR_INVALID_PORT')
})

test('validatePort: passes through integer', () => {
  assert.equal(validatePort(80), 80)
})

test('isPrivileged: 80 is privileged', () => {
  assert.equal(isPrivileged(80), true)
})

test('isPrivileged: 1023 is privileged', () => {
  assert.equal(isPrivileged(1023), true)
})

test('isPrivileged: 1024 is not', () => {
  assert.equal(isPrivileged(1024), false)
})

test('isPrivileged: 3000 is not', () => {
  assert.equal(isPrivileged(3000), false)
})
