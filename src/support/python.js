/**
 * Approximal implementations of some of [Python built-in functions]
 * (https://docs.python.org/2/library/functions.html) and few extra helpers.
 *
 * #### API
 *
 * NAME        | DESCRIPTION
 * - - - - - - + - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * id          | Generate an id
 * escape      | Escape HTML entities
 * stringify   | Enhanced JSON.stringify function
 * repr        | Get a printable representation of an object
 * str         | Get a nicely printable representation of an object
 * hasattr     | Check if an object’s contains a specific attribute
 * isinstance  | Check if an object is an instance of provided type
 * list        | Convert a 'set', 'map' or an object to keys array
 * ord         | Get the char code of the first character of a string
 * chr         | Get the character of a char code
 * array       | Get an empty array for the given size
 * range       | Iterate over the given range (from, to)
 * flat        | A variant of 'str' function
 * chunk       | Split an array into chunks
 * len         | Get variable size (set, map, array or object)
 *
 * #### Examples
 *
 * const a = range(5, 12, i => i)
 *  -> [5, 6, 7, 8, 9, 10, 11]
 *
 * const b = range(ord('a'), ord('f'), i => chr(i))
 *  -> ["a", "b", "c", "d", "e"]
 *
 * const c = flat(range(ord('a'), ord('f'), i => ([i, chr(i)])))
 * -> [[97, 'a'], [98, 'b'], [99, 'c'], [100, 'd'], [101, 'e']]
 *
 * const d = range(ord('a'), ord('f'), i => ({ [chr(i)]: i })).reduce((a, v) => ({...a,...v }), {})
 *  -> {a: 97, b: 98, c: 99, d: 100, e: 101}
 *
 * const e = range(ord('a'), ord('f'), i => ({[i]: chr(i) })).reduce((a, v) => ({ ...a, ...v }), {})
 *  -> {97: "a", 98: "b", 99: "c", 100: "d", 101: "e"}
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

import { type, ctor, is } from './type.js'

const map = new Map()
let count = 1

const entities = {
  '<': 'lt',
  '>': 'gt',
  '&': 'amp',
  '"': 'quot',
  "'": '#39'
}

export { type, ctor }
export const id = k => (map.has(k) ? map.get(k) : map.set(k, `${count++}`).get(k))
export const escape = v => v.replace(/[<>&]/g, m => `&${entities[m]};`)
export const stringify = v => escape(JSON.stringify(v).replace(/"/g, "'")).replace(/,/g, ', ')
export const repr = v => (is(v, 'object') && `${v}`.indexOf('[object') < 0 ? `${v}` : stringify(v))
export const str = v => (is(v, 'object') ? repr(v) : `${v}`)
export const hasattr = (v, k) => v !== null && typeof v === 'object' && k in v
export const isinstance = (v, t) => is(v, t)
export const list = v => ['map', 'set'].includes(type(v)) ? Array.from(v.keys()) : type(v) === 'array' ? v : Object.keys(v)
export const ord = ch => ch.charCodeAt(0)
export const chr = or => String.fromCharCode(or)
export const array = size => [...Array(size)]
export const range = (from, to, fn) => array(to - from).map((_, i) => fn(i + from))
export const flat = v => str(JSON.stringify(v).replace(/"/g, "'")).replace(/,/g, ', ')
export const chunk = (t, c, s = t.length / c) => t.map((e, i) => (type(e) === 'array' ? chunk(e, c) : i % s === 0 && t.slice(i, i + s))).filter(e => e)
export const len = (v) => {
  if (type(v) === 'string' || type(v) === 'array') return v.length
  if (type(v) === 'set' || type(v) === 'map') return v.size
  return Object.keys(v).length
}
