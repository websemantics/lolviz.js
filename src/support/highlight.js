/**
 * Super tiny (questionable?) generic code highlighter
 *
 * @version 1.0.0
 * @copyright (c) 2016-2018, Web Semantics, Inc.
 * @author Adnan M.Sagar, PhD. <adnan@websemantics.ca>
 * @license Distributed under the terms of the MIT License.
 */

const rules = {
  quote: ['([\'"])(.*?)[\'"]', '$1$2$1'],
  value: ['([0-9]+.?[0-9]*)', '$1'],
  keyword: ['(const|new|let|class|extends) ', '$1 '],
  operator: ['([,()\\[\\]{}])', '$1'],
  comment: ['/\\*(.*)\\*/', '/*$1*/']
}

export const highlight = code => Object.entries(rules).reduce((acc, [name, r]) => acc.replace(new RegExp(r[0], 'gm'), `<span class="${name}">${r[1]}</span>`), code)
