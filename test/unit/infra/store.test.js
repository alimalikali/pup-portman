import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stat, writeFile } from 'node:fs/promises'
import { makeTmpStore } from '../../helpers/tmp-store.js'

const isWindows = process.platform === 'win32'

test('load returns [] when file does not exist', async () => {
  const t = await makeTmpStore()
  try {
    const entries = await t.store.load()
    assert.deepEqual(entries, [])
  } finally {
    await t.cleanup()
  }
})

test('save then load round-trips an entry', async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    const entries = await t.store.load()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].port, 3000)
    assert.equal(entries[0].name, 'web')
    assert.ok(entries[0].savedAt)
  } finally {
    await t.cleanup()
  }
})

test('save creates store dir with secure mode', { skip: isWindows }, async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    const s = await stat(t.path)
    assert.equal(s.mode & 0o777, 0o600)
  } finally {
    await t.cleanup()
  }
})

test('save throws DuplicateNameError on existing name', async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    await assert.rejects(t.store.save(3001, 'web'), (err) => err.code === 'ERR_DUPLICATE_NAME')
  } finally {
    await t.cleanup()
  }
})

test('save with force=true overwrites existing entry', async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    await t.store.save(3001, 'web', { force: true })
    const entries = await t.store.list()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].port, 3001)
  } finally {
    await t.cleanup()
  }
})

test('remove deletes by name', async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    await t.store.save(5432, 'db')
    const ok = await t.store.remove('web')
    assert.equal(ok, true)
    const entries = await t.store.list()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].name, 'db')
  } finally {
    await t.cleanup()
  }
})

test('remove returns false when name absent', async () => {
  const t = await makeTmpStore()
  try {
    const ok = await t.store.remove('nope')
    assert.equal(ok, false)
  } finally {
    await t.cleanup()
  }
})

test('load throws StoreCorruptError on invalid JSON', async () => {
  const t = await makeTmpStore()
  try {
    await writeFile(t.path, 'not json {{{', 'utf8')
    await assert.rejects(t.store.load(), (err) => err.code === 'ERR_STORE_CORRUPT')
  } finally {
    await t.cleanup()
  }
})

test('load returns [] on empty file', async () => {
  const t = await makeTmpStore()
  try {
    await writeFile(t.path, '   \n  ', 'utf8')
    const entries = await t.store.load()
    assert.deepEqual(entries, [])
  } finally {
    await t.cleanup()
  }
})

test('load filters bad entries silently', async () => {
  const t = await makeTmpStore()
  try {
    await writeFile(t.path, JSON.stringify([
      { port: 3000, name: 'good', savedAt: '2026-01-01' },
      { port: 'abc', name: 'bad-port' },
      { port: 5432, name: '' }
    ]), 'utf8')
    const entries = await t.store.load()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].name, 'good')
  } finally {
    await t.cleanup()
  }
})
