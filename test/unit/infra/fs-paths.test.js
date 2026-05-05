import { test } from 'node:test'
import assert from 'node:assert/strict'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getStoreDir, getStorePath } from '../../../src/infra/fs-paths.js'

test('getStoreDir: defaults to ~/.pup-portman', () => {
  assert.equal(getStoreDir({}), join(homedir(), '.pup-portman'))
})

test('getStoreDir: PUP_PORTMAN_HOME wins over everything', () => {
  assert.equal(getStoreDir({ PUP_PORTMAN_HOME: '/tmp/p', XDG_CONFIG_HOME: '/x' }), '/tmp/p')
})

test('getStoreDir: XDG_CONFIG_HOME used when set', () => {
  assert.equal(getStoreDir({ XDG_CONFIG_HOME: '/cfg' }), '/cfg/pup-portman')
})

test('getStorePath: appends projects.json', () => {
  assert.equal(getStorePath({ PUP_PORTMAN_HOME: '/p' }), '/p/projects.json')
})
