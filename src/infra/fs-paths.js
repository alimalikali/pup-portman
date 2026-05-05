import { homedir } from 'node:os'
import { join } from 'node:path'
import { STORE_DIRNAME, STORE_FILENAME } from '../constants/defaults.js'

/**
 * Resolve the directory pup-portman uses for state. Honors XDG_CONFIG_HOME when set.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function getStoreDir(env = process.env) {
  if (env.PUP_PORTMAN_HOME && env.PUP_PORTMAN_HOME.length > 0) {
    return env.PUP_PORTMAN_HOME
  }
  if (env.XDG_CONFIG_HOME && env.XDG_CONFIG_HOME.length > 0) {
    return join(env.XDG_CONFIG_HOME, 'pup-portman')
  }
  return join(homedir(), STORE_DIRNAME)
}

/**
 * Full path to the projects.json file.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function getStorePath(env = process.env) {
  return join(getStoreDir(env), STORE_FILENAME)
}
