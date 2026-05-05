import { test } from 'node:test'
import assert from 'node:assert/strict'
import { killProcess } from '../../../src/core/process-killer.js'
import { makeMockExec } from '../../helpers/mock-exec.js'

test('killProcess: rejects invalid pid', async () => {
  await assert.rejects(killProcess(0, { platform: 'linux', exec: makeMockExec({}) }), /invalid pid/)
  await assert.rejects(killProcess(-1, { platform: 'linux', exec: makeMockExec({}) }), /invalid pid/)
})

test('killProcess: windows path uses taskkill and reports killed', async () => {
  let calledArgs
  const exec = async (file, args) => {
    calledArgs = { file, args }
    return { stdout: '', stderr: '', code: 0 }
  }
  const r = await killProcess(48291, { platform: 'win', exec, force: false })
  assert.equal(r.killed, true)
  assert.equal(calledArgs.file, 'taskkill')
  assert.deepEqual(calledArgs.args, ['/PID', '48291'])
})

test('killProcess: windows force adds /F', async () => {
  let calledArgs
  const exec = async (file, args) => {
    calledArgs = { file, args }
    return { stdout: '', stderr: '', code: 0 }
  }
  await killProcess(48291, { platform: 'win', exec, force: true })
  assert.deepEqual(calledArgs.args, ['/PID', '48291', '/F'])
})

test('killProcess: windows access-denied throws PermissionDeniedError', async () => {
  const exec = async () => ({ stdout: '', stderr: 'ERROR: Access denied', code: 1 })
  await assert.rejects(
    killProcess(1, { platform: 'win', exec, force: true }),
    (err) => err.code === 'ERR_PERMISSION_DENIED'
  )
})

test('killProcess: posix kills a real spawned child gracefully', async () => {
  if (process.platform === 'win32') return
  const { spawn } = await import('node:child_process')
  const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'])
  // Wait briefly for the child to register.
  await new Promise((r) => setTimeout(r, 50))
  const r = await killProcess(child.pid, { platform: 'linux', exec: makeMockExec({}) })
  assert.equal(r.killed, true)
})
