import assert from 'assert'
import mock from 'mock-fs'
import { join, format } from 'path'
import { Transform } from 'stream'
import { chin, watch } from './src'

const { assign } = Object

const put = 'dir/put'
const out = 'dir/out'
const tree = {
  'node_modules': mock.symlink({ path: 'node_modules' }),
  [put]: {
    '1.txt': 'contents',
    'dir1': {
      '1.txt': 'contents',
      '2.txt': 'contents',
      '3.txt': 'contents',
      '4.txt': 'contents'
    },
    'dir2': {
      '1.txt': 'contents',
      '2.txt': 'contents',
      '3.txt': 'contents',
      '4.txt': 'contents'
    }
  }
}

describe('chin', () => {

  beforeEach(() => mock(tree))
  afterEach(() => mock.restore())

  const test = (config) => () =>
    chin(assign({ put, out }, config))

  describe('copy', () => {

    it('', test())

    it('', test({
      verbose: false,
      processors: undefined
    }))

    it('', test({
      verbose: false,
      processors: {}
    }))

    it('', test({
      verbose: false,
      processors: [
        ['dir1', {}],
        ['dir2', {}]
      ]
    }))

    it('', test({
      verbose: true,
      processors: undefined
    }))

    it('', test({
      verbose: true,
      processors: {}
    }))

    it('', test({
      verbose: true,
      processors: [
        ['dir1', {}],
        ['dir2', {}],
        ['/', {}]
      ]
    }))

  })

  describe('bufferProcess', () => {

    it('', test({
      processors: {
        txt: {
          options: {},
          processor: (data) => data
        }
      }
    }))

    it('', test({
      processors: {
        txt: {
          options: {},
          processor: (data, { out }) => [format(out), data]
        }
      }
    }))

    it('', test({
      processors: {
        txt: {
          options: {},
          processor: (data, { out }) => [
            [format(out), data],
            [format(out), data],
            [format(out), data]
          ]
        }
      }
    }))

  })

  describe('streamProcess', () => {

    function transform(data, encoding, callback) {
      this.push(data)
      callback()
    }

    it('', test({
      processors: {
        txt: {
          options: {},
          isStream: true,
          processor: (pipe) => pipe(new Transform({ transform }))
        }
      }
    }))

    it('', test({
      processors: {
        txt: {
          options: {},
          isStream: true,
          processor: (pipe, { out }) =>
            [format(out), pipe(new Transform({ transform }))]
        }
      }
    }))

    it('', test({
      processors: {
        txt: {
          options: {},
          isStream: true,
          processor: (pipe, { out }) => [
            [format(out), pipe(new Transform({ transform }))],
            [format(out), pipe(new Transform({ transform }))],
            [format(out), pipe(new Transform({ transform }))]
          ]
        }
      }
    }))

  })
  
  describe('delay with message', () => {
    
    const test = (txt) => () => 
      chin({
        put,
        out,
        verbose: true,
        processors: [
          ['dir1', { txt }],
          ['dir2', { txt }]
        ]
      })
      
    it('success', test({
      processor: (data, { msg }) =>
        new Promise(resolve => setTimeout(resolve, 300))
        .then(() => msg('any message'))
        .then(() => data)
    }))
    
    it('fail', test({
      processor: (data) =>
        new Promise(resolve => setTimeout(resolve, 300))
        .then(() => { throw new Error('err message') })
    }))
    
  })

})

describe('watch', () => {

  beforeEach(() => mock(tree))
  afterEach(() => mock.restore())

  const test = (callback) => () =>
    watch({ put, out }).then(watcher => {
      callback(watcher)
      watcher.close()
    })

  it('change', test(watcher =>
    watcher.emit('change', join(put, 'dir1', '4.txt'))
  ))

  it('unlink', test(watcher =>
    watcher.emit('unlink', join(put, 'dir1', '4.txt'))
  ))

  it('unlinkDir', test(watcher =>
    watcher.emit('unlinkDir', join(put, 'dir1'))
  ))

  it('add', test(watcher => {
    const addFile = '5.txt'

    mock.restore()
    mock(assign({}, tree, {
      [put]: assign({}, tree[put], {
        'dir1': assign({}, tree[put]['dir1'], {
          [addFile]: 'contents'
        })
      })
    }))

    watcher.emit('add', join(put, 'dir1', addFile))
  }))

})
