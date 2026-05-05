#!/usr/bin/env node
import { parseArgv } from '../src/cli/parser.js'
import { route } from '../src/cli/router.js'
import { handle } from '../src/errors/index.js'
import { detectPlatform, getAdapter } from '../src/platform/index.js'
import { defaultExec } from '../src/infra/exec.js'
import { ProjectStore } from '../src/infra/store.js'
import { getStorePath } from '../src/infra/fs-paths.js'
import { confirm } from '../src/infra/prompt.js'

async function main() {
  const platform = detectPlatform()
  const ctx = {
    stdout: process.stdout,
    stderr: process.stderr,
    stdin: process.stdin,
    env: process.env,
    cwd: process.cwd(),
    exec: defaultExec,
    adapter: getAdapter(platform, defaultExec),
    store: new ProjectStore({ path: getStorePath(process.env) }),
    prompt: confirm,
    platform
  }
  try {
    const parsed = parseArgv(process.argv.slice(2))
    const exitCode = await route(parsed, ctx)
    process.exit(exitCode)
  } catch (err) {
    const { exitCode, message } = handle(err, { debug: Boolean(ctx.env.DEBUG && /pup-portman/i.test(ctx.env.DEBUG)) })
    ctx.stderr.write(message + '\n')
    process.exit(exitCode)
  }
}

main()
