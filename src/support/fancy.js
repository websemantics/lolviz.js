/**
 * Custom DOM-Stylier for the SVG images generated by Viz.js.
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

import { attr, attrs, createElement } from './svg.js'

/**
 * Preferences
 */
const defaultStyle = {
  arrow: {
    penwidth: 0.5,
    arrowsize: 0.4,
    weight: 100,
    arrowtail: 'dot',
    color: '#444443',
    fill: '#ffffff',
    tailclip: false
  }
}

/**
 * Apply the following hard-coded changes to SVG DOM of the Viz graph,
 *
 * 1- Removes the graph background/fill color.
 *
 * 2- Iterates over nodes ('g' elements with class attribute = 'node') and replaces
 * the first 'polygon' node with two 'rect' nodes, a rounded rectangle border and shadow.
 *
 * 3- Iterates over edges/arrows ('g' elements with class attribute = 'node') and set fill
 * color of the edge haed and tail.
 *
 * @param {Element} el - DOM Node
 */
export function fancy(el) {
  /* 1. */ attr(el.querySelector('polygon'), 'fill', 'none')

  /* 2. */ Array.from(el.querySelectorAll('.node')).forEach((node) => {
    const { min, max } = Math
    const { MIN_SAFE_INTEGER, MAX_SAFE_INTEGER } = Number
    const xy = [MAX_SAFE_INTEGER, MAX_SAFE_INTEGER, MIN_SAFE_INTEGER, MIN_SAFE_INTEGER]
    const polygons = node.querySelectorAll('polygon')

    if (!polygons[0]) return
    // console.log(polygons[0])

    /* 2.1. Get fill color from other than the first polygon */
    const { fill } = attrs(polygons[1], ['fill'])

    /* 2.2. Parse first polygon points attribute and extract x,y, width and height */
    const [x1, y1, x2, y2] = attr(polygons[0], 'points')
      .split(' ')
      .map(p => p.split(',').map(v => parseFloat(v)))
      .reduce(([xa, ya, xb, yb], [x, y]) => [min(xa, x), min(ya, y), max(xb, x), max(yb, y)], xy)

    const polygonAttrs = attrs(polygons[0], ['fill', 'stroke', 'stroke-width'])

    const rectAttrs = {
      x: x1,
      y: y1,
      rx: '3',
      ry: '3',
      width: `${x2 - x1 + 0.6}px`,
      height: `${y2 - y1 + 0.6}px`,
      ...polygonAttrs,
      fill
    }

    const shadowAttrs = {
      ...rectAttrs,
      x: x1 + 2,
      y: y1 + 2,
      stroke: 'nonne',
      fill: '#5d6063',
      'fill-opacity': 0.15
    }

    /* 2.3. Creat the border rectangle and shadow node */
    createElement(
      'rect',
      shadowAttrs,
      polygons[0].parentNode,
      createElement('rect', rectAttrs, polygons[0].parentNode, polygons[0], true)
    )
  })

  /* 3. */ Array.from(el.querySelectorAll('.edge')).forEach((edge) => {
    const [from, to] = edge.querySelector('title').textContent.split(':c->')

    /* 3.1. Set fill color of arrow ellipse */
    const ellipse = edge.querySelector('ellipse')
    if (ellipse) ellipse.setAttributeNS(null, 'fill', defaultStyle.arrow.fill || fill[from])

    /* 3.2. Set fill color of arrow head, and change store linejoin attribute to round */
    const polygon = edge.querySelector('polygon')
    polygon.setAttributeNS(null, 'fill', defaultStyle.arrow.fill || fill[to])
    polygon.setAttributeNS(null, 'stroke-linejoin', 'round')
  })

  return el
}
