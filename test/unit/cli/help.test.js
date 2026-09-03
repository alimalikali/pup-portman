import { test } from 'node:test'
import assert from 'node:assert/strict'
import { route } from '../../../src/cli/router.js'
import { parseArgv } from '../../../src/cli/parser.js'
import { makeCtx } from '../../helpers/capture-io.js'

test('help honors --no-color for a TTY stream', async () => {
  const ctx = makeCtx()
  ctx.stdout.isTTY = true
  await route(parseArgv(['--help', '--no-color']), ctx)
  assert.doesNotMatch(ctx.stdout.text, new RegExp(`${String.fromCharCode(27)}\\[`))
})

test('unknown command writes its diagnostic to stderr', async () => {
  const ctx = makeCtx()
  assert.equal(await route(parseArgv(['wat']), ctx), 2)
  assert.match(ctx.stderr.text, /unknown command/)
  assert.doesNotMatch(ctx.stdout.text, /unknown command/)
})
