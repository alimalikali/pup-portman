import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseArgv } from '../../../src/cli/parser.js'

test('empty argv => help with empty=true', () => {
  const r = parseArgv([])
  assert.equal(r.verb, 'help')
  assert.equal(r.flags.empty, true)
})

test('numeric positional => inspect', () => {
  const r = parseArgv(['3000'])
  assert.equal(r.verb, 'inspect')
  assert.deepEqual(r.positionals, ['3000'])
})

test('kill <port>', () => {
  const r = parseArgv(['kill', '5432'])
  assert.equal(r.verb, 'kill')
  assert.deepEqual(r.positionals, ['5432'])
})

test('list verb has no positionals', () => {
  const r = parseArgv(['list'])
  assert.equal(r.verb, 'list')
  assert.deepEqual(r.positionals, [])
})

test('save <port> <name>', () => {
  const r = parseArgv(['save', '3000', 'web'])
  assert.equal(r.verb, 'save')
  assert.deepEqual(r.positionals, ['3000', 'web'])
})

test('--help => help verb', () => {
  const r = parseArgv(['--help'])
  assert.equal(r.verb, 'help')
})

test('-h => help', () => {
  const r = parseArgv(['-h'])
  assert.equal(r.verb, 'help')
})

test('--version => version', () => {
  const r = parseArgv(['--version'])
  assert.equal(r.verb, 'version')
})

test('unknown verb => help with unknownVerb flag', () => {
  const r = parseArgv(['frobnicate'])
  assert.equal(r.verb, 'help')
  assert.equal(r.flags.unknownVerb, 'frobnicate')
})

test('--json sets boolean flag', () => {
  const r = parseArgv(['list', '--json'])
  assert.equal(r.verb, 'list')
  assert.equal(r.flags.json, true)
})

test('--no-color sets boolean flag', () => {
  const r = parseArgv(['list', '--no-color'])
  assert.equal(r.flags['no-color'], true)
})

test('-y short flag => yes', () => {
  const r = parseArgv(['kill', '3000', '-y'])
  assert.equal(r.flags.yes, true)
})

test('clustered short -yf => yes + force', () => {
  const r = parseArgv(['kill', '3000', '-yf'])
  assert.equal(r.flags.yes, true)
  assert.equal(r.flags.force, true)
})

test('--key=value style', () => {
  const r = parseArgv(['watch', '3000', '--interval=100'])
  assert.equal(r.flags.interval, '100')
})

test('-- terminator stops flag parsing', () => {
  const r = parseArgv(['save', '--', '3000', '--name'])
  assert.deepEqual(r.positionals, ['3000', '--name'])
})

test('non-array argv throws', () => {
  assert.throws(() => parseArgv(/** @type {any} */ ('not array')), /must be an array/)
})

test('rejects unknown flags without consuming arguments', () => {
  assert.throws(() => parseArgv(['kill', '3000', '--froce']), (err) => err.code === 'ERR_INVALID_ARGUMENTS')
})

test('rejects extra positional arguments', () => {
  assert.throws(() => parseArgv(['kill', '3000', 'unexpected']), (err) => err.code === 'ERR_INVALID_ARGUMENTS')
})

test('rejects unsupported command flags', () => {
  assert.throws(() => parseArgv(['list', '--force']), (err) => err.code === 'ERR_INVALID_ARGUMENTS')
})

test('rejects values on boolean flags and malformed intervals', () => {
  assert.throws(() => parseArgv(['list', '--json=true']), (err) => err.code === 'ERR_INVALID_ARGUMENTS')
  assert.throws(() => parseArgv(['watch', '3000', '--interval', 'soon']), (err) => err.code === 'ERR_INVALID_ARGUMENTS')
})

test('removes only the command verb from positionals', () => {
  const r = parseArgv(['save', '3000', 'save'])
  assert.deepEqual(r.positionals, ['3000', 'save'])
})
