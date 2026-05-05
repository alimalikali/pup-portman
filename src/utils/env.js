/**
 * Detect if running inside a CI environment.
 * @param {NodeJS.ProcessEnv} env
 * @returns {boolean}
 */
export function isCI(env) {
  if (!env) return false
  if (env.CI && env.CI !== 'false' && env.CI !== '0') return true
  return Boolean(
    env.CONTINUOUS_INTEGRATION ||
    env.BUILD_NUMBER ||
    env.GITHUB_ACTIONS ||
    env.GITLAB_CI ||
    env.CIRCLECI ||
    env.TRAVIS ||
    env.JENKINS_URL ||
    env.BUILDKITE ||
    env.DRONE ||
    env.TEAMCITY_VERSION
  )
}

/**
 * @param {NodeJS.WriteStream | NodeJS.ReadStream | { isTTY?: boolean } | undefined | null} stream
 * @returns {boolean}
 */
export function isTTY(stream) {
  return Boolean(stream && stream.isTTY)
}

/**
 * Coerce env var to boolean. Treats '', '0', 'false', 'no' as false.
 * @param {string | undefined} value
 * @returns {boolean}
 */
export function envBool(value) {
  if (value == null) return false
  const v = value.trim().toLowerCase()
  if (v === '' || v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return true
}
