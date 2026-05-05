import { test } from 'node:test'
import assert from 'node:assert/strict'
import { save } from '../../../src/commands/save.js'
import { forget } from '../../../src/commands/forget.js'
import { makeCtx } from '../../helpers/capture-io.js'
import { parseArgv } from '../../../src/cli/parser.js'
import { makeTmpStore } from '../../helpers/tmp-store.js'

test('forget removes a saved entry', async () => {
  const t = await makeTmpStore()
  try {
    const ctxSave = makeCtx({ store: t.store })
    await save(parseArgv(['save', '3000', 'web']), ctxSave)

    const ctxForget = makeCtx({ store: t.store })
    const code = await forget(parseArgv(['forget', 'web']), ctxForget)
    assert.equal(code, 0)
    assert.match(/** @type {any} */ (ctxForget.stdout).text, /forgot "web"/)

    const remaining = await t.store.list()
    assert.equal(remaining.length, 0)
  } finally {
    await t.cleanup()
  }
})

test('forget unknown name returns NOT_FOUND', async () => {
  const t = await makeTmpStore()
  try {
    const ctx = makeCtx({ store: t.store })
    const code = await forget(parseArgv(['forget', 'nope']), ctx)
    assert.equal(code, 3)
  } finally {
    await t.cleanup()
  }
})

test('forget without name => USAGE', async () => {
  const ctx = makeCtx()
  await assert.rejects(forget(parseArgv(['forget']), ctx), (err) => err.code === 'ERR_MISSING_NAME')
})

test('forget --json emits structured result', async () => {
  const t = await makeTmpStore()
  try {
    await t.store.save(3000, 'web')
    const ctx = makeCtx({ store: t.store })
    await forget(parseArgv(['forget', 'web', '--json']), ctx)
    const out = JSON.parse(/** @type {any} */ (ctx.stdout).text)
    assert.deepEqual(out, { name: 'web', removed: true })
  } finally {
    await t.cleanup()
  }
})
