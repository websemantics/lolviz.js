/**
 * A tiny libary to work with Javascript types including a built-in
 * support for ducktyping.
 *
 * #### API
 *
 * NAME    | DESCRIPTION                       | EXAMPLE
 * - - - - + - - - - - - - - - - - - - - - - - + - - - - - - - - - - - -
 * `type`  | Return variable type as a string  | type(val) === 'string'
 * `is`    | Check for a variable type         | is(val, 'string')
 * `as`    | Check for a variable ducktype     | as(val, 'Iterable')
 * `ctor`  | Get a variable class name         | ctor(val)
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

/**
 * List of currently supported ducktypes.
 */
const ducktypes = {
  Date: { toDateString: 'function', getDate: 'function', setDate: 'function' },
  RegExp: { flags: 'string', ignoreCase: 'boolean', multiline: 'boolean', global: 'boolean' },
  Generator: { throw: 'function', return: 'function', next: 'function' },
  Error: { message: 'string', constructor: { stackTraceLimit: 'number' } },
  Buffer: { constructor: { isBuffer: 'function' } },
  Element: { nodeName: 'string', getAttribute: 'function' },
  Iterable: { [Symbol.iterator]: 'function' }
}

/**
 * Check for a specific type.
 *
 * @param {any} val
 * @param {any} t
 * @returns {boolean}
 */
export const is = (val, t) => type(val) === t

/**
 * Ducktype equivilent of `is`.
 *
 * @param {Object} val - Object value
 * @param {string} key - The array key of a typeduck function
 * @param {*} not __a | __b - Not to be passed (used to compact arrow function into two lines)
 * @returns {boolean}
 */
export const as = (val, key, __a = ducktypes[key], __b = Object.entries(__a)) =>
  __b.every(([n, t]) => (typeof t === 'string' ? is(val[n], t) : n in val && as(val[n], null, t)))

/**
 * Get class name.
 *
 * @param {any} val
 * @returns {string}
 */
export const ctor = val => type(val, true)

/**
 * List of specific type checkers.
 */
export const isArray = val => Array.isArray(val) || val instanceof Array
export const isError = val => val instanceof Error || as(val, 'Error')
export const isDate = val => val instanceof Date || as(val, 'Date')
export const isRegexp = val => val instanceof RegExp || as(val, 'RegExp')
export const isGenerator = val => as(val, 'Generator')
export const isBuffer = val => as(val, 'Buffer') && val.constructor.isBuffer(val)
export const isIterable = val => as(val, 'Iterable')
export const isElement = val => val instanceof HTMLElement || as(val, 'Element')

/**
 * Main function to obtain the type of the given variable.
 *
 * @param {any} val - The variable
 * @param {boolean} [ctor=false] - Get constructor name for generic object type ('object')
 * @returns {string}
 */
export function type(val, ctor = false) {
  /* 1. Handle 'null' values */
  if (val === null) return 'null'

  /* 2. Use native 'typeof' to handle primitive types */
  if (['undefined', 'boolean', 'string', 'number', 'symbol', 'bigint'].includes(typeof val)) {
    return typeof val
  }

  /* 3. Use custom checkers for complex types */
  const isa = { isArray, isBuffer, isDate, isError, isRegexp, isGenerator }

  for (const n in isa) if (isa[n](val)) return n.slice(2).toLowerCase()

  /* 5. For non-plain objects, extract/clean type from toString return [object 'type'] */
  const t = Object.prototype.toString
    .call(val)
    .match(/\[object\s(.*?)\]/)[1]
    .toLowerCase()
    .replace(/\s/g, '')

  /* 6. Optionally, return the class name (name of the constructor ) if avilable */
  if (ctor && t === 'object' && val.constructor && val.constructor.name !== 'Object') {
    return val.constructor.name
  }

  return t
}
