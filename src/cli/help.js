import { color as defaultColor } from '../ui/color.js'

const HELP = `
${bold('pup-portman')} — kill anything on any port. Cross-platform. Zero deps.

${bold('USAGE')}
  pup-portman <port>                 show what is on a port; prompt to kill
  pup-portman kill <port>            kill the process on a port (no prompt)
  pup-portman list                   show all occupied ports + saved projects
  pup-portman watch <port>           wait for a port to become free; beep when free
  pup-portman save <port> <name>     name a port for a project
  pup-portman projects               show saved port-to-name map
  pup-portman forget <name>          remove a saved project entry
  pup-portman --help | -h            this help
  pup-portman --version | -v         print version

${bold('FLAGS')}
  --json                         emit JSON instead of human output
  --no-color                     disable ANSI color (also honors NO_COLOR env)
  --no-beep                      disable terminal bell on watch
  --yes,  -y                     skip confirmation prompts
  --force,-f                     SIGKILL immediately, skip graceful SIGTERM

${bold('EXAMPLES')}
  pup-portman 3000                   inspect port 3000 with confirm
  pup-portman kill 5432 --force      send SIGKILL to whatever owns 5432
  pup-portman list --json            machine-readable port table
  pup-portman save 3000 web          remember 3000 as "web"
  pup-portman watch 3000             wait until 3000 frees up

${bold('EXIT CODES')}
  0 ok   2 usage   3 not-found   4 permission   5 platform   70 internal
`

/**
 * @param {{ stdout: NodeJS.WriteStream }} streams
 * @param {{ unknownVerb?: string, color?: typeof defaultColor }} [opts]
 */
export function printHelp(streams, opts = {}) {
  if (opts.unknownVerb) {
    streams.stdout.write(`unknown command: "${opts.unknownVerb}"\n\n`)
  }
  streams.stdout.write(HELP.trimStart())
}

/** Minimal bold for help text — color helper is wired at command time.
 * @param {string} s
 */
function bold(s) {
  return defaultColor.bold(s)
}
