export const examples = [
  {
    title: 'Vertical layout',
    description: 'Display an array vertically',
    code: `const vlist = ['2016-08-12', 107.779999, 108.440002, 107.779999, 108.18]

render(objviz(vlist))`
  },
  {
    title: 'Horizontal layout',
    description:
      'Display an array horizontally using list and object graph visualization functions',
    code: `const hlist = range(ord('a'), ord('h'), i => ([i, chr(i)])).reduce((dict, [k, v]) => dict.set(k, v), new Map())

render(listviz(hlist))
render(objviz(hlist))`
  },
  {
    title: 'Mixed layout',
    description: 'Display a list of lists using object graph visualization',
    code: `const table = [
['Date', 'Open', 'High', 'Low', 'Close', 'Volume'],
['2016-08-12', 107.779999, 108.440002, 107.779999, 108.18, 18612300, 108.18]
]

render(objviz(table))`
  },
  {
    title: 'Custom layout',
    description:
      'Using Javascript <b>Map</b> and <b>Set</b> as a replacement for Python <b>dict</b> and <b>tuple</b>',
    code: `const items = d => Array.from(d).reduce((set, [k, v]) => set.add(new Set([k, v])), new Set())
const list = range(ord('a'), ord('h'), i => ([i, chr(i)])).reduce((dict, [k, v]) => dict.set(k, v), new Map())
const tuplelist = items(list)

render(listviz(tuplelist))
render(objviz(tuplelist))`
  },
  {
    title: 'Simple list',
    description: 'Display an array of strings',
    code: `const mom = ['hi', 'mom']

render(objviz(mom))`
  },
  {
    title: 'Map list',
    description: 'Display a Map list (dict) initilized from object entries',
    code: `const suser = new Map(Object.entries({ 'superuser': true, 'mgr': false }))

render(objviz(suser))`
  },
  {
    title: 'Long list',
    description: 'Display a long list vertically',
    code: `const longly = range(0, 20, i => (\`elem\${i}\`))

render(objviz(longly))`
  },
  {
    title: 'Linked-list layout',
    description: 'Display a simple linked-list',
    code: `class Node {
constructor(value, next = null) {
this.value = value
this.next = next
}
}

let head = new Node('tombu')
head = new Node('parrt', head)
head = new Node("xue", head)

render(objviz(head))`
  },
  {
    title: 'List of objects',
    description: 'Display a list of individual linked-list nodes',
    code: `class Node {
constructor(value, next = null) {
this.value = value
this.next = next
}
}

const a = [new Node('parrt'), new Node('mary')]

render(objviz(a))`
  },
  {
    title: 'Mixed list',
    description: 'Display an array of mixed values',
    code: `const head = ['parrt', new Set(['mary', null])]

render(objviz(head))`
  },
  {
    title: 'Flawed empty list',
    description: 'Incorrect list of list initialization',
    code: `const empty = []
const data = array(5).map(() => empty)

render(lolviz(data))`
  },
  {
    title: 'List of common value',
    description: 'Whoops! should be different list object',
    code: `const empty = []
const data = array(5).map(() => empty)
data[0].push(['a', 4])
data[2].push(['b', 9])

render(lolviz(data))`
  },
  {
    title: 'Proper empty list',
    description: 'Correct way to initialize list of list',
    code: `const list = array(5).map(() => [])

render(lolviz(list))`
  },
  {
    title: 'Elaborate list of list',
    description: '',
    code: `const key = 'a'
const value = 99

const table = [
['Date', 'Open', 'High', 'Low', 'Close', 'Volume'],
['2016-08-12', 107.779999, 108.440002, 107.779999, 108.18, 18612300, 108.18]
]

/* Assume keys are single-element strings */
const hashcode = (o) => ord(o)
const bucket_index = hashcode(key) % len(table)
const bucket = table[bucket_index]

/* Add association to the bucket */
bucket.push([key, value])

render(lolviz(table))
render(objviz(table))`
  },
  {
    title: 'Another mixed list',
    description: 'Display a mixed list with object graph visualization',
    code: `const courses = [['msan501', 51], ['msan502', 32], ['msan692', 101]]

render(objviz(courses))`
  },
  {
    title: 'String list',
    description: 'Display a string as a list of characters',
    code: `const newyork = 'New York'

render(strviz(newyork))`
  },
  {
    title: 'Tree layout',
    description: 'Display a binary tree structure',
    code: `class Tree {
constructor(value, left = null, right = null) {
this.value = value
this.left = left
this.right = right
}
}

const root = new Tree('parrt',
new Tree('mary',
new Tree('jim',
	new Tree('srinivasan'),
	new Tree('april'))),
new Tree('xue', null, new Tree('mike')))

render(treeviz(root))`
  },
  {
    title: 'Scalar layout',
    description: 'Display rank zero tensor',
    code: `class Tensor {
  constructor(shape, values) {
    this.shape = shape
    this.values = values
  }
}

const scalar = new Tensor([1], [42])

render(lolviz(scalar.values, { shape: scalar.shape }))`
  },
  {
    title: 'Vector layout',
    description: 'Display rank one tensor',
    code: `class Tensor {
  constructor(shape, values) {
    this.shape = shape
    this.values = values
  }
}

const vector = new Tensor([5], [1, 2, 3, 4, 5])
const large = new Tensor([16], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

render(lolviz(vector.values, { shape: vector.shape }))
render(lolviz(large.values, { shape: large.shape }))`
  },
  {
    title: 'Matrix layout',
    description: 'Display rank two tensor',
    code: `class Tensor {
  constructor(shape, values) {
    this.shape = shape
    this.values = values
  }
}

const matrix = new Tensor([4, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
const large = new Tensor([14, 14], [
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])

render(lolviz(matrix.values, { shape: matrix.shape }))
render(lolviz(large.values, { shape: large.shape }))`
  },
  {
    title: 'Tensor layout',
    description: 'Display rank <b>n</b> tensor',
    code: `class Tensor {
  constructor(shape, values) {
    this.shape = shape
    this.values = values
  }
}

const tensor = new Tensor([3, 3, 3], [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39])

render(lolviz(tensor.values, { shape: tensor.shape }))`
  }
]
