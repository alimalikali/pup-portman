export interface ProcessInfo {
  pid: number
  command: string
  port: number
  protocol: 'tcp' | 'udp'
  family: 'ipv4' | 'ipv6' | 'both'
  user?: string
  startedAt?: string
}

export interface ProjectEntry {
  port: number
  name: string
  savedAt: string
}

export interface PortStatus {
  port: number
  occupied: boolean
  processes: ProcessInfo[]
}

export interface ParsedArgs {
  verb: string
  positionals: string[]
  flags: Record<string, boolean | string>
  raw: string[]
}

export type PlatformTag = 'mac' | 'linux' | 'win'
