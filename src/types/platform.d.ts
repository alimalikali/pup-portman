import type { ProcessInfo, PlatformTag } from './domain.js'

export interface PlatformAdapter {
  name: PlatformTag
  findByPort(port: number): Promise<ProcessInfo[]>
  listAll(): Promise<ProcessInfo[]>
}

export interface ExecResult {
  stdout: string
  stderr: string
  code: number | null
}

export interface ExecOptions {
  timeoutMs?: number
  allowFailure?: boolean
  signal?: AbortSignal
  cwd?: string
  env?: NodeJS.ProcessEnv
}

export type ExecFn = (file: string, args: string[], opts?: ExecOptions) => Promise<ExecResult>

export interface KillResult {
  pid: number
  killed: boolean
  escalated: boolean
  signal: NodeJS.Signals | number | null
}
