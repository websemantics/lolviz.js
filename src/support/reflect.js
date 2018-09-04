/**
 * Inspect objects for their internal structure including,
 *
 * - Class name and class hierarchy (parent classes)
 * - Member properties and their data types (static and public)
 * - Member methods, their arguments (static and public)
 * - Arguments data types and default values (if any)
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

import { type } from './type.js'

/**
 * Parse a function for its arguments and their default values
 *
 * @param {function} m - Function value
 */
function args(f) {
  const list = `${f}`.match(/\((.*?)\)/)[1].split(',')

  return list.filter(arg => arg > '').reduce((acc, arg) => {
    const parts = arg.split('=')
    return { ...acc, [parts[0].trim()]: parts[1] !== undefined ? JSON.parse(parts[1]) : undefined }
  }, {})
}

/**
 * Parse an object for its methods and properties (public and static)
 *
 * @param {object} o - The object instance
 * @param {object} options - A list of properties as follows:
 * - @property {object} def - Initial values (to append to).
 * - @property {boolean} own - Account for enumerable properties only if true.
 * - @property {boolean} proto - Use object prototype.
 */
function parse(o, { def = { methods: {}, props: {} }, own = false, proto = false } = {}) {
  return Object.getOwnPropertyNames(proto ? Object.getPrototypeOf(o) : o)
    .filter(n => type(o[n]) === 'function' || !own || (own && Object.keys(o).includes(n)))
    .reduce((def, n) => {
      const [k, v] = type(o[n]) === 'function' ? ['methods', args(o[n])] : ['props', type(o[n])]

      if (type(o[n]) === 'function') {
        def.methods[n] = args(o[n])
      } else if (o.hasOwnProperty(n)) {
        def.props[n] = type(o[n])
      }

      return def
    }, def)
}

/**
 * Get object methods and properties including its prototype's
 *
 * @param {*} o - Object value
 */
function object(o) {
  let def = parse(o, { proto: true })
  def = parse(o, { def })

  /* Get static methods and enumerable static properties */
  def.static = parse(o.constructor, { own: true })

  /* Get class name */
  def.name = type(o, true)

  /* Get parent class name */
  const parent = Object.getPrototypeOf(o)
  def.extends = type(Object.getPrototypeOf(parent), true)

  return def
}

/**
 * Get function name and possible arguments and their default values (if any).
 *
 * @param {function} m - Method value
 */
function method(m) {
  const name = String(m).match(/^function\s*([\w$]+)/)
  return {
    name: m.name || name ? name[1] : '',
    args: args(m)
  }
}

/**
 * Inspect an object or function at run-time and return a its internal structure.
 *
 * @param {object|function} target - Object or function to inspect
 * @returns {object} class definition
 */
export function reflect(target) {
  if (type(target) === 'object') return object(target)
  if (type(target) === 'function') return method(target)

  return {}
}

/**
 * Return a nicely printable representation of an object class definition
 *
 * @param {object} def - Class definition (obtained from calling 'reflect' function)
 * @param {string} [tab = '\t'] - Tab character (optional)
 * @param {string} [nl='\n'] - New line string (optional)
 */
export function print(def, tab = '\t', nl = '\n') {
  const args = v => Object.entries(v).map(([name, val]) => `${name}${val ? ` = ${val}` : ''}`)
  const prps = (v, r, f = 'this', s = `${tab}${tab}`) =>
    Object.entries(v).map(([n, t]) => `${s}/** @type {${t}} */\n${s}${f}.${n}${n in r ? ` = ${n}` : ''}`)
  const mtds = (v, p, f = '') =>
    Object.entries(v).map(m =>
      `${tab}${f}${m[0]}(${args(m[1]).join(', ')}){\n${
        m[0] === 'constructor' ? prps(p, m[1]).join(nl) : ''
      }\n${tab}}`)
  const body = [...mtds(def.methods, def.props), ...mtds(def.static.methods, [], 'static ')].join(nl)

  return `class ${def.name} ${def.extends !== 'object' ? `extends ${def.extends} `: ''}{\n${body}\n\}\n${prps(def.static.props, {}, def.name, '').join(nl)}`
}
