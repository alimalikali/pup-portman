/**
 * Sleep that respects an AbortSignal.
 * @param {number} ms
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<void>}
 */
export function sleep(ms, opts = {}) {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      opts.signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Wrap a promise with a timeout.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {() => Error} [onTimeout]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, onTimeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(onTimeout ? onTimeout() : new Error(`Timeout after ${ms}ms`))
    }, ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}
