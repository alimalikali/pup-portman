import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCommand } from '../../../src/infra/exec.js'

const isWindows = process.platform === 'win32'

test('runCommand: returns stdout from a simple node script', async () => {
  const { stdout, code } = await runCommand(process.execPath, ['-e', 'process.stdout.write("hello")'])
  assert.equal(code, 0)
  assert.equal(stdout, 'hello')
})

test('runCommand: throws ToolNotFoundError when binary missing', async () => {
  await assert.rejects(
    runCommand('definitely-not-a-real-binary-xyz', []),
    (err) => err.code === 'ERR_TOOL_NOT_FOUND'
  )
})

test('runCommand: throws ExecError on non-zero exit', async () => {
  await assert.rejects(
    runCommand(process.execPath, ['-e', 'process.exit(3)']),
    (err) => err.code === 'ERR_EXEC_FAILED' && err.details.code === 3
  )
})

test('runCommand: allowFailure returns code instead of throwing', async () => {
  const r = await runCommand(process.execPath, ['-e', 'process.exit(7)'], { allowFailure: true })
  assert.equal(r.code, 7)
})

test('runCommand: rejects non-string args', async () => {
  await assert.rejects(
    runCommand('node', [/** @type {any} */ (42)]),
    /every arg must be a string/
  )
})

test('runCommand: rejects empty file', async () => {
  await assert.rejects(
    runCommand('', []),
    /file must be a non-empty string/
  )
})

test('runCommand: timeoutMs kills slow process', { skip: isWindows }, async () => {
  await assert.rejects(
    runCommand(process.execPath, ['-e', 'setTimeout(()=>{}, 5000)'], { timeoutMs: 50 }),
    (err) => err.code === 'ERR_EXEC_TIMEOUT'
  )
})

test('runCommand: AbortSignal cancels in-flight call', async () => {
  const ac = new AbortController()
  setTimeout(() => ac.abort(), 20)
  await assert.rejects(
    runCommand(process.execPath, ['-e', 'setTimeout(()=>{}, 5000)'], { signal: ac.signal }),
    /Abort/i
  )
})
