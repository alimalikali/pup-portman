import { test } from 'node:test'
import assert from 'node:assert/strict'
import { save } from '../../../src/commands/save.js'
import { projects } from '../../../src/commands/projects.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'
import { makeTmpStore } from '../../helpers/tmp-store.js'

test('save then projects round-trips via real ProjectStore', async () => {
  const t = await makeTmpStore()
  try {
    const ctx = makeCtx({ store: t.store })
    const code = await save(parseArgv(['save', '3000', 'web']), ctx)
    assert.equal(code, 0)

    const ctx2 = makeCtx({ store: t.store })
    await projects(parseArgv(['projects', '--json']), ctx2)
    const out = JSON.parse(/** @type {any} */ (ctx2.stdout).text)
    assert.equal(out.length, 1)
    assert.equal(out[0].port, 3000)
    assert.equal(out[0].name, 'web')
  } finally {
    await t.cleanup()
  }
})

test('save without name => USAGE error', async () => {
  const ctx = makeCtx()
  await assert.rejects(save(parseArgv(['save', '3000']), ctx), (err) => err.code === 'ERR_MISSING_NAME')
})

test('save same name twice => DuplicateNameError', async () => {
  const t = await makeTmpStore()
  try {
    const ctx = makeCtx({ store: t.store })
    await save(parseArgv(['save', '3000', 'web']), ctx)
    const ctx2 = makeCtx({ store: t.store })
    await assert.rejects(save(parseArgv(['save', '3001', 'web']), ctx2), (err) => err.code === 'ERR_DUPLICATE_NAME')
  } finally {
    await t.cleanup()
  }
})

test('save --force overwrites', async () => {
  const t = await makeTmpStore()
  try {
    const ctx = makeCtx({ store: t.store })
    await save(parseArgv(['save', '3000', 'web']), ctx)
    const ctx2 = makeCtx({ store: t.store })
    const code = await save(parseArgv(['save', '3001', 'web', '--force']), ctx2)
    assert.equal(code, 0)
    const entries = await t.store.list()
    assert.equal(entries.length, 1)
    assert.equal(entries[0].port, 3001)
  } finally {
    await t.cleanup()
  }
})
