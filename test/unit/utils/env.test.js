import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCI, isTTY, envBool } from '../../../src/utils/env.js'

test('isCI: true when CI=true', () => {
  assert.equal(isCI({ CI: 'true' }), true)
})

test('isCI: false when CI=false', () => {
  assert.equal(isCI({ CI: 'false' }), false)
})

test('isCI: false when empty env', () => {
  assert.equal(isCI({}), false)
})

test('isCI: detects GitHub Actions', () => {
  assert.equal(isCI({ GITHUB_ACTIONS: 'true' }), true)
})

test('isCI: detects GitLab CI', () => {
  assert.equal(isCI({ GITLAB_CI: 'true' }), true)
})

test('isTTY: true on isTTY=true stream', () => {
  assert.equal(isTTY({ isTTY: true }), true)
})

test('isTTY: false on isTTY=false stream', () => {
  assert.equal(isTTY({ isTTY: false }), false)
})

test('isTTY: false on null/undefined', () => {
  assert.equal(isTTY(null), false)
  assert.equal(isTTY(undefined), false)
})

test('envBool: truthy values', () => {
  assert.equal(envBool('1'), true)
  assert.equal(envBool('true'), true)
  assert.equal(envBool('yes'), true)
})

test('envBool: falsy values', () => {
  assert.equal(envBool('0'), false)
  assert.equal(envBool('false'), false)
  assert.equal(envBool(''), false)
  assert.equal(envBool(undefined), false)
  assert.equal(envBool('off'), false)
})
