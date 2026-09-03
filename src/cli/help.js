import { color as defaultColor } from '../ui/color.js'

/**
 * @param {typeof defaultColor} color
 */
function renderHelp(color) {
  return `
${color.bold('pup-portman')} — kill anything on any port. Cross-platform. Zero deps.

${color.bold('USAGE')}
  pup-portman <port>                 show what is on a port; prompt to kill
  pup-portman kill <port>            kill the process on a port (no prompt)
  pup-portman list                   show all occupied ports + saved projects
  pup-portman watch <port>           wait for a port to become free; beep when free
  pup-portman save <port> <name>     name a port for a project
  pup-portman projects               show saved port-to-name map
  pup-portman forget <name>          remove a saved project entry
  pup-portman --help | -h            this help
  pup-portman --version | -v         print version

${color.bold('FLAGS')}
  --json                         emit JSON instead of human output
  --no-color                     disable ANSI color (also honors NO_COLOR env)
  --no-beep                      disable terminal bell on watch
  --interval <ms>                watch polling interval (minimum 50ms)
  --yes,  -y                     skip confirmation prompts
  --force,-f                     SIGKILL immediately, skip graceful SIGTERM

${color.bold('EXAMPLES')}
  pup-portman 3000                   inspect port 3000 with confirm
  pup-portman kill 5432 --force      send SIGKILL to whatever owns 5432
  pup-portman list --json            machine-readable port table
  pup-portman save 3000 web          remember 3000 as "web"
  pup-portman watch 3000             wait until 3000 frees up

${color.bold('EXIT CODES')}
  0 ok   2 usage   3 not-found   4 permission   5 platform   70 internal
`
}

/**
 * @param {{ stdout: NodeJS.WriteStream, stderr?: NodeJS.WriteStream }} streams
 * @param {{ unknownVerb?: string, color?: typeof defaultColor }} [opts]
 */
export function printHelp(streams, opts = {}) {
  if (opts.unknownVerb) {
    const errorStream = streams.stderr ?? streams.stdout
    errorStream.write(`unknown command: "${opts.unknownVerb}"\n`)
  }
  streams.stdout.write(renderHelp(opts.color ?? defaultColor).trimStart())
}
