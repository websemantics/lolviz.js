/**
 * SVG helper library to create/manipulate SVG DOM elements.
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

/**
 * Get or set an SVG DOM node attribute.
 *
 * @param {Element} el - DOM Node
 * @param {string} name - Attribute name
 * @param {string} [value=undefined] - Attribute value (optional)
 */
export function attr(el, name, value) {
  return value ? el.setAttributeNS(null, name, value) || value : el.getAttributeNS(null, name)
}

/**
 * Get or set a DOM node list of attributes.
 *
 * @param {Element} el - DOM Node
 * @param {string[]|Object} list - List of attribute names (get), or key/value object (set)
 * @return {Object} Attributes/values object (get & set)
 */
export function attrs(el, list) {
  const either = (k, v) => (Array.isArray(list) ? { [v]: attr(el, v) } : { [k]: attr(el, k, v) })
  return Object.entries(list).reduce((a, [k, v]) => Object.assign(a, either(k, v)), {})
}

/**
 * Create an SVG element and insert before/swap with the provided anchor node.
 *
 * @param {string} tag - Element name
 * @param {Object} attributes - Element attributes
 * @param {Element} anchor - DOM Node to insert before, swap/remove.
 * @param {boolean} [remove=undefined] - Remove anchor node if true.
 */
export const createElement = (tag, attributes = {}, parent, anchor, remove) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)

  /* Apply attributes */ attrs(el, attributes)
  if (parent) parent.insertBefore(el, anchor)
  if (remove) parent.removeChild(anchor)

  return el
}
