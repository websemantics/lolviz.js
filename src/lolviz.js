/**
 * A faithful (albeit optimized and incomplete) port of Terence Parr List of Lists Visualization
 * library 1.3.3, https://github.com/parrt/lolviz from Python to Javascript
 *
 * @version 1.0.0
 * @see https://github.com/websemantics/lolviz.js
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

import { id, type, ctor, len, escape, repr, str, hasattr, list, chunk } from './support/python.js'
import { reflect } from './support/reflect.js'

/**
 * Preferences.
 */
export const prefs = {
  /* style properties */
  penwidth: 0.5,
  color_black: '#444443',
  color_yellow: '#fefecd',
  color_blue: '#d9e6f5',
  color_green: '#cfe2d4',
  /* how many chars before we abbreviate with ...? */
  max_str_len: 20,
  /* how many chars before it's too wide and we go vertical? */
  max_horiz_array_len: 40,
  /* how many elements max to display in list (unused so far) */
  max_list_elems: 10,
  /* object class hierarchy */
  class_public_prefix: '+',
  class_static_prefix: '#',
  class_name_suffix: '' /* ex. 'Class' */
}

/**
 * Helper functions/classes.
 */
const nodename = v => `node${id(v)}`

const digraph = (body, g = {}, n = {}) => {
  const default_node_attrs = {
    shape: 'box',
    width: 0.1,
    height: 0.1,
    penwidth: prefs.penwidth,
    color: prefs.color_black
  }

  const digraph_attrs = Object.entries(g).map(([k, v]) => `${k}=${v}`)
  const node_attrs = Object.entries({ ...default_node_attrs, ...n }).map(([k, v]) => `${k}="${v}"`)

  return `digraph G {
    ${digraph_attrs.join('\n')}
    node [${node_attrs.join(',')}];
    ${body}
  }`
}

class WrapAssoc {
  constructor(assoc) {
    this.assoc = assoc
  }
  toString() {
    return elviz(this.assoc, true)
  }
}

class Ellipsis {
  toString() {
    return '...'
  }
}

/**
 * Make changes to preferences.
 *
 * @param {string} key
 * @param {string|number} value
 */
export const config = (key, value) => (prefs[key] = value)

/**
 * Display the class hierarchy of one or more releated objects (NEW)
 *
 * @param {array} objs - list of objects (obj1, obj2, etc)
 */
export function classviz(...objs) {
  const nx = /* name suffix */ prefs.class_name_suffix
  const defs = /* class definitions */ objs.map(obj => reflect(obj))
  const attrs = {
    shape: 'record',
    style: 'filled',
    fontsize: 11,
    fontname: 'Helvetica',
    fontcolor: prefs.color_black,
    fillcolor: prefs.color_yellow
  }

  /* Helper arrow functions */
  const map = (o, cb) => Object.entries(o).map(([k, v]) => cb(k, v))
  const args = o => map(o, (name, val) => `${name}${val ? ` = ${val}` : ''}`)
  const properties = (o, fx) => map(o, (k, v) => `${fx} ${k}: ${v}`)
  const methods = (o, fx) => map(o, (k, v) => `${fx} ${k}(${args(v).join(', ')})`)
  const node = (n, fx, m) => `${n} [label="{${n} ${nx}|${fx.join('\\l')}\\l|${m.join('\\l')}\\l}"]`

  const nodes = defs.reduce((a, def) => {
    const props = properties(def.props, prefs.class_public_prefix).concat(properties(def.static.props, prefs.class_static_prefix))
    const mtds = methods(def.methods, prefs.class_public_prefix).concat(methods(def.static.methods, prefs.class_static_prefix))
    return [...a, node(def.name, props, mtds)]
  }, [])

  const edges = defs.reduce((a, def) => [...a, `${def.extends}->${def.name}`], [])

  const gb = `edge[dir=back, color="${prefs.color_black}", penwidth="0.5", arrowsize=.6]
    ${nodes.join('\n')}
    ${edges.join('\n')}`

  return digraph(gb, {}, attrs)
}

/**
 * Show a string like an array.
 *
 * @param {*} astring
 */
export function strviz(astring) {
  return digraph(string_node(astring), { nodesep: 0.5, rankdir: 'LR' })
}

/**
 * Display a list of elements in a horizontal fashion.
 *
 * @param {Array} elems - List of elements
 * @param {boolean} showassoc - If true, then 2-tuples (3,4) are shown as 3->4.
 * @returns {String} - The digraph.
 */
export function listviz(elems, { showassoc = true, shape = [], showindexes = !shape.length } = {}) {
  const newelems = Array.from(elems).map(e => (showassoc && type(e) === 'set' && len(e) === 2 ? `${new WrapAssoc(e)}` : e))

  const gb = gr_list_node(nodename(elems), newelems, { showindexes, shape })

  return digraph(gb, { nodesep: 0.5 })
}

/**
 * Display a top-down visualization of a cluster of graph objects.
 *
 * @created 7 Dec 2019
 * @param {Object} c - Cluster to visualize.
 */
export function clusterviz(c, { orientation = 'TB', vertical = 0.1, horizontal = 0.3, label, title, minimal } = {}) {
  const g_attrs = { nodesep: vertical, ranksep: horizontal, penwidth: '.7', pencolor: `"${prefs.color_green}"`, rankdir: orientation, fontname: 'Helvetica', fontcolor: `"${prefs.color_black}"`, fontsize: 8 }
  const cluster_links = []

  const body = Array.from(c.graphs).map(([id, g]) => {
    const { nodes, links } = graph_parts(g, { title, minimal })

    cluster_links.push(...links)

    return digraph(`${nodes.join('\n  ')}`, { ...g_attrs, label: `"${g.label || id}"` }, 'subgraph', `cluster_${id}`)
  })

  return digraph(`${body.join('\n')}${cluster_links.join('\n')}`, g_attrs)
}

/**
 * Display a top-down visualization of a graph object.
 *
 * @created 7 Dec 2019
 * @param {Object} g - Graph to visualize.
 * @param {string} [orientation='LR'] - Layout orientation.
 */
export function graphviz(g, { orientation = 'TB', vertical = 0.1, horizontal = 0.3, label, title, minimal } = {}) {
  const g_attrs = { nodesep: vertical, ranksep: horizontal, penwidth: '.7', pencolor: `"${prefs.color_green}"`, rankdir: orientation, fontname: 'Helvetica', fontcolor: `"${prefs.color_black}"`, fontsize: 8 }
  if (label) g_attrs.label = `"${label}"`

  const { nodes, links } = graph_parts(g, { title, minimal })

  return digraph(`${links.join('\n  ')} ${nodes.join('\n  ')}`, g_attrs )
}

function graph_parts(g, { title = n => ctor(n), minimal = false }) {
  /* Clone nodes and remove adjacent array */
  const gnodes = Array.from(g.nodes.values()).map(n => n.clone()).map(n => delete n.adjacent && n)
  const links = g.edges.map(([from, to]) => `"${from.id}" -> "${to.id}" ${prefs.arrow_style};`)
  const nodes = gnodes.map(n => `    "${n.id}" [width=0,height=0, color="${prefs.color_black}", fontcolor="${prefs.color_black}", fontname="Helvetica", style=filled, fillcolor="${prefs.color_yellow}", label=<${graph_node_html(n, { minimal, title: title(n) })}>];\n`)

  return { nodes, links }
}

function graph_node_html(n, { title, minimal, bgcolor = prefs.color_yellow } = {}) {
  const rows = []
  const blankrow = `<tr><td colspan="3" cellpadding="1" border="0" bgcolor="${bgcolor}"></td></tr>`

  if (title) {
    rows.push(`<tr><td cellspacing="0" colspan="3" cellpadding="0" bgcolor="${bgcolor}" border="${minimal ? 0 : 1}" sides="b" align="center"><font color="${prefs.color_black}" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`)
  }

  if (!minimal) {
    Object.entries(n).forEach(([key, value]) => {
      let sep = '<td cellspacing="0" cellpadding="0" border="0"></td>'
      let name = `<td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r" align="right"><font face="Helvetica" color="${prefs.color_black}" point-size="11">${key} </font></td>\n`

      const v = value !== null ? repr(abbrev_and_escape(str(value))) : '   '

      value = `<td  cellspacing="0" cellpadding="1" bgcolor="${bgcolor}" border="0" align="left"><font color="${prefs.color_black}" point-size="11">  ${v}</font></td>\n`
      rows.push(`<tr>${name}${sep}${value}</tr>\n`)
    })
  }

  return `<table BORDER="0" CELLPADDING="0" CELLBORDER="1" CELLSPACING="0">
  ${rows.join(blankrow)}
  </table>`
}

/**
 * Display a top-down visualization of a binary tree that has two fields
 * pointing at the left and right subtrees. The type of each node is
 * displayed, all fields, and then left/right pointers at the bottom.
 *
 * @param {*} root
 * @param {string} leftfield
 * @param {string} rightfield
 * @param {boolean} minimal - Hide title, field keys and left right fields on leaves
 */
export function treeviz(
  root,
  { title, minimal = false, leftfield = 'left', rightfield = 'right' } = {}
) {
  if (root === null) return ''

  const reachable = closure(root)

  const leaf = v => !v[leftfield] && !v[rightfield]
  const tree_nodes = reachable.map((p) => {
    const fields = Object.entries(p)
      .filter(([k]) => k !== leftfield && k !== rightfield)
      .map(([k, v]) => (isatom(v) ? [k, k, v] : [k, k, null]))

    return `//${ctor(p)} TREE node with fields\n${gr_vtree_node(nodename(p), fields, leaf(p), {
      title: title || ctor(p),
      minimal,
      separator: null,
      leftfield,
      rightfield
    })}`
  })

  const gb = `${tree_nodes.join('')}\n${obj_edges(reachable)}` /* obj_nodes(reachable) (less polished) */
  return digraph(gb, { nodesep: 0.1, ranksep: 0.3, rankdir: 'TD' })
}

/**
 * List of lists visualization with the first list vertical and the nested lists
 * horizontal.
 *
 * #### Example:
 *
 *  [ [('a','3')], [], [('b',230), ('c',21)] ]
 *
 * @param {any[]} table
 * @param {boolean} showassoc - For 2-tuples (x,y) to display as x->y.
 * @param {boolean} shape - Tensor shape (i.e. scalar [1], vector [4], matrix [3,3] etc)
 * @param {boolean} showindexes - False is table is a Tensor
 * @returns {string} The dot/graphviz to display as a two-dimensional structure.
 */
export function lolviz(table, { showassoc = true, shape = [], showindexes = !shape.length } = {}) {
  if (!islol(table) && (len(shape) === 0 || len(shape) < 3)) {
    return listviz(table, { showassoc, showindexes, shape })
  }

  while (len(shape) > 2) table = chunk(table, shape.pop())

  const vlist = gr_vlol_node(nodename(table), table)
  const nodes = table.map(sublist =>
    gr_list_node(nodename(sublist), sublist, { showindexes, shape }))

  const links = table.map((sublist, i) =>
    `${nodename(table)}:${str(i)} -> ${nodename(sublist)}:w [arrowtail=dot, penwidth="0.5", color="${
      prefs.color_black
    }", arrowsize=.4, weight=100]\n`)

  const gb = `${vlist}${nodes.join('')}${links.join('')}`

  return digraph(gb, { nodesep: 0.05, ranksep: 0.4, rankdir: 'LR' })
}

/**
 * Same as `callsviz()` but displays only the current function's frame or you
 * can pass in a Python stack frame object to display.
 *
 * @param {Array} varnames
 * @param {Array} frame - If frame is None, viz caller of callviz()'s frame.
 * Restrict to varnames if not None.
 */
export function callviz(varnames = null, frame = null) {
  if (frame === null) {
    // stack = inspect.stack()
    frame = 'frame' // stack[1][0]
  }

  return callsviz(varnames, [frame])
}

/**
 * Visualize the call stack and anything pointed to by globals, locals, or
 * parameters. You can limit the variables displayed by passing in a list of
 * `varnames` as an argument.
 *
 * ~ NOT IMPLMENTED ~
 *
 * @param {*} varnames
 * @param {*} callstack
 */
function callsviz(varnames = null, callstack = null) {
  const gb = ''
  return digraph(gb, { nodesep: 0.1, ranksep: 0.1, rankdir: 'LR' })

  // /* Get stack frame nodes so we can stack 'em up */
  // if (callstack === null) {
  //   stack = inspect.stack()
  //   callstack = []
  //   for (i; st in enumerate(/* stack[1:] */);) {
  //     frame = st[0]
  //     name = st[3]
  //     callstack.push(frame)
  //     if (name === '<module>') break
  //   }
  // }

  // /* Draw all stack frame nodes together so we can use rank=same */
  // s += '\n{ rank=same;\n'
  // callstack = list(reversed(callstack))
  // for (f in callstack) s += obj_node(f, varnames)

  // for (i in range(len(callstack) - 1)) {
  //   _this = callstack[i]
  //   callee = callstack[i + 1]
  //   s += 'node%d -> node%d [style=invis, weight=100]\n' % (id(this), id(callee))
  // }

  // s += '}\n\n'

  // /* find all reachable objects from call stack */
  // reachable = []

  // for (f in callstack) reachable.extend(closure(f, varnames))

  // reachable = uniq(reachable)

  // s += obj_nodes(reachable)
  // s += obj_edges(reachable)
  // s += obj_edges(callstack, varnames)
  // s += '}\n'

  return s
}

function ignoresym(sym) {
  return sym[0].startswith('_') || callable(sym[1]) || type(sym[1]) === types.ModuleType
}

/**
 * Generic object graph visualization that knows how to find lists of lists
 * (like `lolviz()`) and linked lists.
 *
 * #### NOTE: Trees are also displayed reasonably, but with left to right
 * orientation instead of top-down (a limitation of graphviz).
 *
 * @param {Object} o - Object to visualize.
 * @param {string} [orientation='LR'] - Layout orientation.
 */
export function objviz(o, { orientation = 'LR', shape = [] } = {}) {
  const reachable = closure(hasattr(o, Symbol.iterator) ? list(o) : o)

  const gb = `${obj_nodes(reachable)}\n${obj_edges(reachable)}`
  return digraph(gb, { nodesep: 0.1, ranksep: 0.3, rankdir: orientation })
}

/**
 * Organize nodes by connected_subgraphs so we can cluster currently only making
 * subgraph cluster for linked lists otherwise it squishes trees.
 *
 * @param {object} nodes -
 */
function obj_nodes(nodes) {
  let s = ''
  let c = 1
  const [max_edges_for_type, subgraphs] = connected_subgraphs(nodes)

  subgraphs.forEach((g) => {
    const firstelement = g[0]

    if (/* linked list */ max_edges_for_type[ctor(firstelement)] === 1) {
      s += `subgraph cluster${c++} {style=invis penwidth=.7 pencolor="${prefs.color_green}"
      ${g.map(p => obj_node(p)).join('')}
      }`
    } else if (/* binary tree */ max_edges_for_type[ctor(firstelement)] === 2) {
      s += g.map(p => obj_node(p)).join('') /* nothing special for now */
    }
  })

  /* now dump disconnected nodes */
  nodes.forEach((p) => {
    const found = subgraphs.reduce((acc, g) => acc || g.includes(p), false)
    if (!found) s += obj_node(p)
  })

  return s
}

function obj_node(p, varnames = null) {
  let s = ''

  if (typeof p === 'types.FrameType') {
    //       frame = p
    //       info = inspect.getframeinfo(frame)
    //       caller_scopename = info[2]
    //       if caller_scopename == '<module>':
    //           caller_scopename = 'globals'
    //       argnames, _, _ = inspect.getargs(frame.f_code)
    //       items = []
    //       # do args first to get proper order
    //       for arg in argnames:
    //           if varnames is not None and arg not in varnames: continue
    //           v = frame.f_locals[arg]
    //           if isatom(v):
    //               items.append((arg, arg, v))
    //           else:
    //               items.append((arg, arg, None))
    //       for k, v in frame.f_locals.items():
    //           if varnames is not None and k not in varnames: continue
    //           if k in argnames:
    //               continue
    //           if ignoresym((k, v)):
    //               continue
    //           if isatom(v):
    //               items.append((k, k, v))
    //           else:
    //               items.append((k, k, None))
    //       s += '// FRAME %s\n' % caller_scopename
    //       s += gr_dict_node(nodename, caller_scopename, items, highlight=argnames,
    //            bgcolor=prefs.color_blue,
    //                         separator=None, reprkey=False)
  } else if (type(p) === 'dict') {
    /* print "DRAW DICT", p, '@ node' + nodename */
    const items = Object.entries(p)
      // if varnames is not None and k not in varnames: continue
      .filter(([k, v]) => !(varnames !== null && !varnames.includes(k)))
      .map(([k, v], i) => (isatom(v) ? [str(i), k, v] : [str(i), k, null]))

    s += '// DICT\n'
    s += gr_dict_node(nodename(p), null, items, { separator: null })
  } else if (/* special case "empty array" */ type(p) === 'array' && len(p) === 0) {
    s += `${nodename(p)} [margin="0.03", shape=none label=<<font face="Times-Italic" color="${
      prefs.color_black
    }" point-size="9">empty array</font>>];\n`
  } else if (typeof p === 'boolean') {
    s += `${nodename(p)} [margin="0.03", shape=none label=<<font face="Times-Italic" color="${
      prefs.color_black
    }" point-size="9">${str(p)}</font>>];\n`
  } else if (typeof p === 'object' && len(p) === 0) {
    /* special case "empty object" */
    s += `${nodename(p)} [margin="0.03", shape=none label=<<font face="Times-Italic" color="${
      prefs.color_black
    }" point-size="9">empty object</font>>];\n`
  } else if ((type(p) === 'array' || hasattr(p, Symbol.iterator)) && isatomlist(p)) {
    /* print "DRAW LIST", p, '@ node' + nodename */
    const elems = Array.from(p).map(el => (isatom(el) ? el : null))

    if (type(p) === 'set' && false) {
      s += '// SET of atoms\n'
      s += gr_list_node(nodename(p), elems, { title: 'set', showindexes: false })
    } else {
      s += '// LIST or ITERATABLE of atoms\n'
      s += gr_list_node(nodename(p), elems)
    }
  } else if (type(p) === 'array' || hasattr(p, Symbol.iterator)) {
    /* print "DRAW VERTICAL LIST", p, '@ node' + nodename */
    const elems = Array.from(p).map(el => (isatom(el) ? el : null))
    s += '// VERTICAL LIST or ITERATABLE\n'
    if (type(p) === 'set') {
      s += gr_vlol_node(nodename(p), elems, { title: 'set', showindexes: true })
    } else {
      s += gr_vlol_node(nodename(p), elems)
    }
  } else if (type(p) === 'object') {
    /* print "DRAW OBJ", p, '@ node' + nodename */
    const fields = Object.entries(p).map(([k, v]) => (isatom(v) ? [k, k, v] : [k, k, null]))

    s += `//${ctor(p)} OBJECT with fields
      ${gr_dict_node(nodename(p), ctor(p), fields, {
    separator: null,
    reprkey: false
  })}
      `
  } else {
    s += `${nodename(p)} [margin="0.03", shape=none label=<<font face="Times-Italic" color="${
      prefs.color_black
    }" point-size="9">CANNOT HANDLE: type==${abbrev_and_escape(`${type(p)} '${repr(p)}'`)}</font>>];\n`
  }

  return s
}

function obj_edges(nodes, varnames = null) {
  /* Edges start at right edge not center for vertical lists */
  const es = edges(nodes, varnames).map(([p, label, q]) =>
    Array.isArray(p) && !isatomlist(p)
      ? `${nodename(p)}:${label} -> ${nodename(q)}:w [arrowtail=dot, penwidth="0.5", color="${
        prefs.color_black
      }", arrowsize=.4, weight=100]`
      : `${nodename(p)}:${label}:c -> ${nodename(q)} [dir=both, tailclip=false, arrowtail=dot, penwidth="0.5", color="${
        prefs.color_black
      }", arrowsize=.4]`)

  return es.join('')
}

export function elviz(el, showassoc) {
  let els = ' '
  if (showassoc && type(el) === 'set' && len(el) === 2) {
    el = Array.from(el)
    els = `${elviz(el[0], showassoc)}→${elviz(el[1], false)}`
  } else if (type(el) === 'array') {
    els = `[${el.reduce((acc, e) => [...acc, elviz(e, showassoc)], []).join(', ')}]`
  } else if (type(el) === 'map') {
    // els = `[${el.reduce((acc, e) => [...acc, elviz(e, showassoc)], []).join(', ')}]`
  } else if (typeof el === 'object' /* more generic than type(el) */) {
    els = `{${Object.entries(el)
      .reduce((acc, e) => [...acc, elviz(e, showassoc)], [])
      .join(',')}}`
  } else {
    els = repr(el)
  }

  return escape(els)
}

function gr_list_node(
  nm,
  elems,
  { title, shape = [], bgcolor = prefs.color_yellow, showindexes = true } = {}
) {
  const node_shape = elems.length > 0 ? 'box' : 'none'

  let html = `<font face="Times-Italic" color="${
    prefs.color_black
  }" point-size="9">empty list</font>`

  if (elems.length > 0) {
    /* Compute just to see eventual size */
    const abbrev_values = abbrev_and_escape_values(elems)

    if (len(abbrev_values.join('')) <= prefs.max_horiz_array_len || len(shape) > 0) {
      html = gr_listtable_html(elems, { title, bgcolor: prefs.color_blue, showindexes, shape })
    } else {
      html = gr_vlist_html(elems, { title, bgcolor, showindexes })
    }
  }

  return `${nm} [shape="${node_shape}", space="0.0", margin="0.01", fontcolor="${
    prefs.color_black
  }", fontname="Helvetica", label=<${html}>];\n`
}

function gr_listtable_html(
  values,
  { title, shape = [], bgcolor = prefs.color_yellow, showindexes = true }
) {
  const index_html = (s, last_col = false, sides = last_col ? 'b' : 'br') =>
    `<td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="${sides}" valign="top"><font color="${
      prefs.color_black
    }" point-size="9">${s}</font></td>\n`

  const value_html = (p, s, last_col, last_row) =>
    `<td port="${p}" bgcolor="${bgcolor}" border="${last_col && last_row ? '0' : '1'}" sides="${
      last_col ? '' : 'r'
    }${last_row ? '' : 'b'}" align="center"><font point-size="11">${s}</font></td>\n`

  const newvalues = values.map(v =>
    repr(str(v).length > prefs.max_str_len ? abbrev_and_escape(str(v)) : v))

  /* Get cols, rows for possible 2D tensor if there was a shape */
  const [cols, rows] = shape.length > 1 ? shape : [shape[0] || values.length, 1]

  const insert_row = (row, i, value, col, last_row) => {
    if (col < prefs.max_list_elems - 1) {
      row.push(value_html(i, value, col === cols - 1, last_row))
    } else if (col === cols - 1) {
      if (prefs.max_list_elems !== cols) {
        row.push(value_html('...', '...', false, last_row))
      }
      row.push(value_html(i, value, true, last_row))
    }
  }

  const tablerows = newvalues.reduce((acc, value, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    if (row < prefs.max_list_elems - 1) {
      insert_row((acc[row] = acc[row] || []), i, value, col, row === rows - 1)
    } else if (row === rows - 1) {
      if (prefs.max_list_elems !== rows) {
        insert_row((acc[row - 1] = acc[row - 1] || []), '...', '...', col, false)
      }
      insert_row((acc[row] = acc[row] || []), i, value, col, true)
    }

    return acc
  }, [])

  let indexrow = newvalues.map((_, i) => index_html(i, i === cols - 1))

  if (cols > prefs.max_list_elems) {
    indexrow = indexrow
      .filter((_, i) => i < prefs.max_list_elems - 1)
      .concat([index_html('...'), index_html(cols - 1, true)])
  }

  const titlerow = `<tr><td cellspacing="0" colspan="${cols}" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="b" align="center"><font color="${
    prefs.color_black
  }" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`

  return `<table BORDER="0" CELLBORDER="0" CELLSPACING="0">
    ${title ? titlerow : ''}
    ${showindexes ? `<tr>${indexrow.join('')}</tr>` : ''}
    ${tablerows.map(row => `<tr>${row.join('')}</tr>`)}
    </table>`
}

function gr_dict_node(
  nodename,
  title,
  items,
  { highlight = null, bgcolor = prefs.color_yellow, separator = '&rarr;', reprkey = true } = {}
) {
  const html = gr_dict_html(title, items, { highlight, bgcolor, separator, reprkey })
  return `${nodename} [margin="0.03", color="${prefs.color_black}", fontcolor="${
    prefs.color_black
  }", fontname="Helvetica", style=filled, fillcolor="${bgcolor}", label=<${html}>];\n`
}

function gr_dict_html(
  title,
  items,
  { highlight = null, bgcolor = prefs.color_yellow, separator = '&rarr;', reprkey = true } = {}
) {
  const header = '<table BORDER="0" CELLPADDING="0" CELLBORDER="1" CELLSPACING="0">\n'

  const blankrow = `<tr><td colspan="3" cellpadding="1" border="0" bgcolor="${bgcolor}"></td></tr>`
  const rows = []

  if (title !== null) {
    rows.push(`<tr><td cellspacing="0" colspan="3" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="b" align="center"><font color="${
      prefs.color_black
    }" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`)
  }

  const ptrs = items.filter(it => !isatom(it[2]))
  const atoms = items.filter(it => isatom(it[2]))

  if (items.length > 0) {
    /* Do atoms first then ptrs */
    atoms.concat(ptrs).forEach(([label, key, value]) => {
      const font = highlight && key in highlight ? 'Times-Italic' : 'Helvetica'

      let name = `<td port="${label}_label" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r" align="right"><font face="${font}" color="${
        prefs.color_black
      }" point-size="11">${reprkey ? repr(key) : key} </font></td>\n`
      let sep = '<td cellspacing="0" cellpadding="0" border="0"></td>'

      if (separator) {
        name = `<td port="${label}_label" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="0" align="right"><font face="${font}" color="${
          prefs.color_black
        }" point-size="11">${reprkey ? repr(key) : key} </font></td>\n`
        sep = `<td cellpadding="0" border="0" valign="bottom"><font color="${
          prefs.color_black
        }" point-size="9">${separator}</font></td>`
      }

      let v = '   '
      if (value) {
        if (str(value).length > prefs.max_str_len) value = abbrev_and_escape(str(value))
        v = repr(value)
      }

      value = `<td port="${label}" cellspacing="0" cellpadding="1" bgcolor="${bgcolor}" border="0" align="left"><font color="${
        prefs.color_black
      }" point-size="11"> ${v}</font></td>\n`
      rows.push(`<tr>${name}${sep}${value}</tr>\n`)
    })
  } else {
    rows.push('<tr><td cellspacing="0" cellpadding="0" border="0"><font point-size="9"> ... </font></td></tr>\n')
  }

  const tail = '</table>\n'
  return header + rows.join('\n') + tail
}

function gr_vlol_node(
  nodename,
  elems,
  { title = null, bgcolor = prefs.color_green, showindexes = true, showelems = false } = {}
) {
  const html = gr_vlol_html(elems, { title, bgcolor, showindexes, showelems })
  return `${nodename} [color="${prefs.color_black}", margin="0.02", fontcolor="${
    prefs.color_black
  }", fontname="Helvetica", style=filled, fillcolor="${bgcolor}", label=<${html}>];\n`
}

function gr_vlol_html(
  elems,
  { title = null, bgcolor = prefs.color_green, showindexes = true, showelems = false } = {}
) {
  if (elems.length === 0) return ' '

  const td = (label, port, b, p, sides, bg = bgcolor) =>
    `<td port="${port}" BORDER="${b}" cellpadding="${p}" ${sides} cellspacing="0" bgcolor="${bg}" align="left"><font color="${
      prefs.color_black
    }" point-size="9">${label}</font></td>`

  const rows = elems.map((el, i) => {
    let v = showindexes ? str(i) : ' '

    if (showelems) v = el !== null ? repr(el) : ' '

    return `<tr>${i === elems.length - 1 ? td(v, i, 0, 3, '') : td(v, i, 1, 2, 'sides="b"')}</tr>`
  })

  return `<table BORDER="0" CELLPADDING="0" CELLBORDER="0" CELLSPACING="0">
${
  title !== null
    ? `<tr><td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="b" align="center"><font color="${
      prefs.color_black
    }" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`
    : ''
}
${rows.join('\n')}
</table>`
}

function gr_vlist_html(
  elems,
  { title, bgcolor = prefs.color_yellow, showindexes = true, showelems = true } = {}
) {
  if (elems.length === 0) return ' '

  const header = '<table BORDER="0" CELLPADDING="0" CELLBORDER="1" CELLSPACING="0">\n'
  const tail = '</table>\n'
  const blankrow = `<tr><td colspan="3" cellpadding="1" border="0" bgcolor="${bgcolor}"></td></tr>`
  const sep = '<td cellspacing="0" cellpadding="0" border="0"></td>'
  const rows = []

  if (title) {
    rows.push(`<tr><td cellspacing="0" colspan="3" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="b" align="center"><font color="${
      prefs.color_black
    }" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`)
  }

  const N = elems.length
  const items = []

  if (N > prefs.max_list_elems) {
    for (let i = 0; i < prefs.max_list_elems - 1; i++) {
      items.push([i, elems[i]])
    }
    items.push([new Ellipsis(), new Ellipsis()], [N - 1, elems[N - 1]])
  } else {
    for (let i = 0; i < N; i++) items.push([i, elems[i]])
  }

  if (N > 0) {
    items.forEach(([i, e]) => {
      let v
      const index = `<td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r" align="right"><font face="Helvetica" color="${
        prefs.color_black
      }" point-size="11">${i} </font></td>\n`
      if (isatom(e)) {
        if (str(e).length > prefs.max_str_len) e = abbrev_and_escape(str(e))
        /* HACK: avoid string quotes for size 2 Sets */
        v = type(e) === 'string' && e.indexOf("'") > -1 ? e : repr(e)
      } else {
        v = '   '
      }

      const value = `<td port="${i}" cellspacing="0" cellpadding="1" bgcolor="${bgcolor}" border="0" align="center"><font color="${
        prefs.color_black
      }" point-size="11"> ${v}</font></td>\n`
      rows.push(showindexes ? `<tr>${index}${sep}${value}</tr>\n` : `<tr>${value}</tr>\n`)
    })
  } else {
    rows.push('<tr><td cellspacing="0" cellpadding="0" border="0"><font point-size="9"> ... </font></td></tr>\n')
  }

  return header + rows.join(blankrow) + tail
}

function gr_vtree_node(
  nodename,
  items,
  leaf,
  {
    title,
    minimal,
    bgcolor = prefs.color_yellow,
    separator = null,
    leftfield = 'left',
    rightfield = 'right'
  } = {}
) {
  const html = gr_vtree_html(items, leaf, {
    title,
    minimal,
    bgcolor,
    separator,
    leftfield,
    rightfield
  })
  const template = (n, c, fc, bg, l) =>
    `${n} [margin="0.03", color="${c}", fontcolor="${fc}", fontname="Helvetica", style=filled, fillcolor="${bg}", label=<${l}>];\n`

  return template(nodename, prefs.color_black, prefs.color_black, bgcolor, html)
}

function gr_vtree_html(
  items,
  leaf,
  {
    title,
    minimal,
    bgcolor = prefs.color_yellow,
    separator = null,
    leftfield = 'left',
    rightfield = 'right'
  } = {}
) {
  const rows = []
  const blankrow = `<tr><td colspan="3" cellpadding="1" border="0" bgcolor="${bgcolor}"></td></tr>`

  if (title && !minimal) {
    rows.push(`<tr><td cellspacing="0" colspan="3" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="b" align="center"><font color="${
      prefs.color_black
    }" FACE="Times-Italic" point-size="11">${title}</font></td></tr>\n`)
  }

  if (items.length > 0) {
    items.forEach(([label, key, value]) => {
      const font = 'Helvetica'

      const sep = '<td cellspacing="0" cellpadding="0" border="0"></td>'

      const name = minimal
        ? leaf
          ? ''
          : `<td port="${label}_label" cellspacing="0" cellpadding="0" border="0" ><font face="${font}" point-size="11">&nbsp;&nbsp;&nbsp; </font></td>\n`
        : `<td port="${label}_label" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r" align="right"><font face="${font}" color="${
          prefs.color_black
        }" point-size="11">${key} </font></td>\n`

      // if (separator !== null) {
      //   name = `<td port="${label}_label" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="0" align="right"><font face="${font}" color="${
      //     prefs.color_black
      //   }" point-size="11">${key} </font></td>\n`
      //   sep = `<td cellpadding="0" border="0" valign="bottom"><font color="${
      //     prefs.color_black
      //   }" point-size="9">${separator}</font></td>`
      // }

      let v = '   '
      if (value !== null) {
        v = abbrev_and_escape(str(value))
        v = minimal ? v : repr(v)
      }

      value = `<td port="${label}" cellspacing="0" cellpadding="1" bgcolor="${bgcolor}" border="0" align="left"><font color="${
        prefs.color_black
      }" point-size="11"> ${v}</font></td>\n`

      rows.push(`<tr>${name}${sep}${value}</tr>\n`)
    })
  } else {
    rows.push('<tr><td cellspacing="0" cellpadding="0" border="0"><font point-size="9"> ... </font></td></tr>\n')
  }

  let sep = `<td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="0"></td>`

  if (separator !== null) {
    sep = `<td cellpadding="0" bgcolor="${bgcolor}" border="0" valign="bottom"><font color="${
      prefs.color_black
    }" point-size="15">${separator}</font></td>`
  }

  /* eslint-disable */
  const kidsep = `<tr><td colspan="3" cellpadding="0" border="1" sides="b" height="3"></td></tr>${blankrow}`
  const kidnames = `<tr><td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r" align="left"><font color="${
    prefs.color_black
  }" point-size="6">${leftfield}</font></td>${sep}<td cellspacing="0" cellpadding="1" bgcolor="${bgcolor}" border="0" align="right"><font color="${
    prefs.color_black
  }" point-size="6">${rightfield}</font></td></tr>`
  const kidptrs = `<tr><td port="${leftfield}" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r"><font color="${
    prefs.color_black
  }" point-size="1"> </font></td>${sep}<td port="${rightfield}" cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="0"><font color="${
    prefs.color_black
  }" point-size="1"> </font></td></tr>`
  const bottomsep = `<tr><td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="1" sides="r"><font color="${
    prefs.color_black
  }" point-size="3"> </font></td>${sep}<td cellspacing="0" cellpadding="0" bgcolor="${bgcolor}" border="0"><font color="${
    prefs.color_black
  }" point-size="3"> </font></td></tr>`
  /* eslint-enable */

  const bottom = leaf && minimal ? '' : `${kidsep}${kidnames}${kidptrs}${bottomsep}`
  return `<table BORDER="0" CELLPADDING="0" CELLBORDER="1" CELLSPACING="0">
  ${rows.join(blankrow)}${bottom}
  </table>`
}

function string_node(s) {
  return `    ${nodename(s)} [width=0,height=0, color="${prefs.color_black}", fontcolor="${
    prefs.color_black
  }", fontname="Helvetica", style=filled, fillcolor="${prefs.color_yellow}", label=<${string_html(s)}>];\n`
}

function string_html(s) {
  const values = Array.from(s)

  /* don't want right border to show on last. */
  const index_html = (d, last) =>
    `<td cellspacing="0" cellpadding="0" bgcolor="${prefs.color_yellow}" border="1" sides="b${
      last ? '' : 'r'
    }" valign="top"><font color="${prefs.color_black}" point-size="9">${d}</font></td>\n`
  const value_html = (d, s, last) =>
    `<td port="${d}" cellspacing="0" cellpadding="0" bgcolor="${
      prefs.color_yellow
    }" border="0" align="center"><font face="Monaco" point-size="11">${s}</font></td>\n`

  const toprow = values.map((v, i) => index_html(i, i === values.length - 1))
  const bottomrow = values.map((v, i) => value_html(i, v, i === values.length - 1))

  return `<table BORDER="0" CELLPADDING="0" CELLBORDER="0" CELLSPACING="0">
    <tr><td></td>${toprow.join('')}<td></td></tr>
    <tr><td>'</td>${bottomrow.join('')}<td>'</td></tr>
    </table>`
}

/**
 * Determine a list of lists (lol)
 *
 * @param {Array|Set} l
 * @param {Array} elems - Convenient way to ensure elem is an array
 */
function islol(l, elems = hasattr(l, Symbol.iterator) ? Array.from(l) : l) {
  return type(elems) === 'array' ? elems.every(x => hasattr(x, Symbol.iterator)) : false
}

function isatomlist(l, elems = hasattr(l, Symbol.iterator) ? Array.from(l) : l) {
  /* empty lists (or none iterables) are not atom lists */
  return type(elems) === 'array' && len(elems) !== 0 && elems.every(x => isatom(x))
}

function isatom(p) {
  return (
    ['number', 'string', 'null'].includes(type(p)) ||
    p instanceof WrapAssoc ||
    p instanceof Ellipsis
  )
}

function isplainobj(p) {
  return type(p) === 'object' && !hasattr(p, Symbol.iterator)
}

/**
 * Find all nodes reachable from p and return a list of pointers to those
 * reachable. There can't be duplicates even for cyclic graphs due to
 * visited set. Chase ptrs from but don't include frame objects.
 *
 * @param {*} p
 * @param {*} varnames
 */
function closure(p, varnames = null, visited = []) {
  if (!p || isatom(p) || visited.includes(id(p))) return []

  visited.push(id(p))

  let result = []

  /**
   * Frame objects represent execution frames. They may occur in traceback
   * objects (see below), and are also passed to registered trace functions.
   *
   * Special read-only attributes: f_back is to the previous stack frame
   * (towards the caller), or None if this is the bottom stack frame; f_code is
   * the code object being executed in this frame; f_locals is the dictionary
   * used to look up local variables; f_globals is used for global variables;
   * f_builtins is used for built-in (intrinsic) names; f_lasti gives the
   * precise instruction (this is an index into the bytecode string of the code
   * object).
   *
   * @see https://docs.python.org/3/reference/datamodel.html#frame-objects
   */

  if (typeof p !== 'types.FrameType') result.push(p)

  if (typeof p === 'types.FrameType') {
    //     frame = p
    //     info = inspect.getframeinfo(frame)
    //     for k, v in frame.f_locals.items():
    //         # error('INCLUDE frame var %s' % k)
    //         if varnames is not None and k not in varnames: continue
    //         if not ignoresym((k, v)):
    //             cl = closure(v, varnames, visited)
    //             result.extend(cl)
    //     caller_scopename = info[2]
    //     if caller_scopename != '<module>': # stop at globals
    //         cl = closure(p.f_back, varnames, visited)
    //         result.extend(cl)
  } else if (type(p) === 'object') {
    /* regular object like Tree or Node */
    Object.values(p).forEach(q => (result = result.concat(closure(q, varnames, visited))))
  } else if (type(p) === 'array') {
    /* a list or similar */
    p.forEach(q => (result = result.concat(closure(q, varnames, visited))))
  } else if (type(p) === 'set') {
    Array.from(p).forEach(q => (result = result.concat(closure(q, varnames, visited))))
  } else if (type(p) === 'dict') {
    // elif type(p)==dict:
    //     for k,q in p.items():
    //         cl = closure(q, varnames, visited)
    //         result.extend(cl)
  }
  return result
}

/**
 * Return list of (p, port-in-p, q) for all p in reachable node list
 *
 * @param {*} reachable
 * @param {*} varnames
 */
function edges(reachable, varnames = null) {
  return reachable.reduce((edges, p) => edges.concat(node_edges(p, varnames)), [])
}

/**
 * Return list of (p, fieldname-in-p, q) for all ptrs in p
 * @param {*} p
 * @param {*} varnames
 */
function node_edges(p, varnames = null) {
  const edges = []

  // if type(p) == types.FrameType:
  //     frame = p
  //     for k, v in frame.f_locals.items():
  //         if varnames is not None and k not in varnames: continue
  //         if not ignoresym((k, v)) and not isatom(v) and v is not None:
  //             edges.push((frame, k, v))
  // elif type(p) == dict:
  //     i = 0
  //     for k, v in p.items():
  //         if not isatom(v) and v is not None:
  //             edges.push((p, str(i), v))
  //         i += 1
  // elif hasattr(p, "__iter__"):
  //     for i, el in enumerate(p):
  //         if not isatom(el) and el is not None:
  //             edges.push((p, str(i), el))
  // elif hasattr(p, "__dict__"):
  //     for k, v in p.__dict__.items():
  //         if not isatom(v) and v is not None:
  //             edges.push((p, k, v))

  Object.entries(p).forEach(([k, v]) => (v !== null && !isatom(v) ? edges.push([p, k, v]) : null))

  return edges
}

/**
 * Find all connected subgraphs of same type and same fieldname. Return a list
 * of sets containing the id()s of all nodes in a specific subgraph
 *
 * @param {*} reachable
 * @param {*} varnames
 */
function connected_subgraphs(reachable, varnames = null) {
  const max_edges_for_type = max_edges_in_connected_subgraphs(reachable, varnames)

  reachable = closure(reachable, varnames).filter(p => isplainobj(p))

  /* list of sets of obj id()s */
  const subgraphs = []
  /* list of sets of obj ptrs (parallel list to track objs since can't hash on
   * some objs like lists/sets as keys) */
  const subgraphobjs = []
  const type_fieldname_map = {}

  reachable.forEach((p) => {
    const edges = node_edges(p, varnames)

    edges.forEach((e) => {
      const fieldname = e[1]
      const q = e[2]

      if (ctor(p) === ctor(q)) {
        /* Ensure that singly-linked nodes use same field */
        // const cname = ctor(p)

        // if (max_edges_for_type[cname] === 1 && cname in type_fieldname_map) {
        //   const prev_fieldname = type_fieldname_map[cname]
        //   if (fieldname !== prev_fieldname) return
        // } else {
        //   type_fieldname_map[cname] = fieldname
        // }

        /* search for an existing subgraph */
        let found = false

        for (let i = 0; i < subgraphs.length; i++) {
          if (subgraphs[i].includes(id(p)) || subgraphs[i].includes(id(q))) {
            found = true
            if (!subgraphs[i].includes(id(p))) subgraphs[i].push(id(p))
            if (!subgraphs[i].includes(id(q))) subgraphs[i].push(id(q))

            subgraphobjs[i] = subgraphobjs[i].concat([p, q])
          }
        }

        if (!found) {
          subgraphs.push([id(p), id(q)])
          subgraphobjs.push([p, q])
        }
      }
    })
  })

  const uniq = subgraphobjs.map(g => Array.from(new Set(g)))

  return [max_edges_for_type, uniq]
}

/**
 * Return mapping from node class obj to max num edges connecting nodes of
 * that same type. Ignores all but isplainobj() nodes. Ignores any node type
 * w/o at least one edge connecting to same type.
 *
 * The keys indicate the set of types (class def objects) that are involved
 * in connected subgraphs.
 *
 * Max == 1 indicates possible linked list whereas max == 2 indicates
 * possible binary tree.
 *
 * @param {*} reachable
 * @param {*} varnames
 */
function max_edges_in_connected_subgraphs(reachable, varnames = null) {
  const max_edges_for_type = {}
  reachable = closure(reachable, varnames).filter(p => isplainobj(p))

  reachable.forEach((p) => {
    const homo_edges = edges_to_same_type(p, varnames)
    const m = homo_edges.length

    if (m > 0) {
      max_edges_for_type[ctor(p)] = Math.max(max_edges_for_type[ctor(p)] || 0, m)
    }
  })

  // - - - - - - - - - - - -
  // defaultdict(<type 'int'>, {<class __main__.Node at 0x1076b83f8>: 1})
  // - - - - - - - - - - - -

  return max_edges_for_type
}

function edges_to_same_type(p, varnames) {
  const edges = node_edges(p, varnames)
  return /* homo_edges */ edges.filter(e => type(p) === type(e[2]))
}

function abbrev_and_escape_values(elems = []) {
  return elems.map(v => (v !== null ? abbrev_and_escape(str(v)) : '  '))
}

function abbrev_and_escape(s) {
  if (s === null) return s

  return escape(`${s.length > prefs.max_str_len ? `${s.substr(0, prefs.max_str_len - 1)}...` : s}`)
}
