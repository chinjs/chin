'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})

var _recursiveReaddir = require('recursive-readdir')

var _recursiveReaddir2 = _interopRequireDefault(_recursiveReaddir)

var _path = require('path')

var _utils = require('./utils.js')

function _interopRequireDefault(obj) {
   return obj && obj.__esModule ? obj : { default: obj }
}

const isArray = Array.isArray

exports.default = (put, opts = {}) =>
   Promise.resolve()
      .then(() => ignoreTargets(opts.targets, put))
      .then(ignores => ignoreCompare(ignores, opts.compare, put))
      .then(ignores => {
         const ignoreFn = HoIgnoreFn(opts.exts, ignores)
         return (0, _recursiveReaddir2.default)(put, [ignoreFn])
      })

const ignoreTargets = (targets = [], put) =>
   targets.map(target => `${put}${_path.sep}${(0, _path.normalize)(target)}`)

const ignoreCompare = (ignores, compare, put) =>
   Promise.resolve().then(() => {
      if (!compare || !isArray(compare)) return ignores
      compare
      ;(0, _utils.throwIf)(compare[0], 'string', 'extract.compare[0]')
      ;(0, _utils.throwIf)(compare[1], 'object', 'extract.compare[1]')
      const compareSrc = (0, _path.normalize)(compare[0])
      const compareOpts = compare[1]
      const replacePath = HoReplacePath(compareOpts, compareSrc, put)

      return (0, _recursiveReaddir2.default)(compareSrc)
         .then(files => files.map(replacePath))
         .then(files => files.filter(path => path))
         .then(files => {
            files.forEach(file => {
               if (!isArray(file)) {
                  ignores.push(file)
               } else {
                  const files = file
                  files.forEach(file => ignores.push(file))
               }
            })
            return ignores
         })
   })

const HoReplacePath = (compareOpts, compareSrc, put) => compareFile => {
   const sourceExt = compareOpts[(0, _utils.extstr)(compareFile)]
   if (sourceExt) {
      const srcReplaced = (0, _utils.dirReplace)(compareFile, compareSrc, put)
      return !isArray(sourceExt)
         ? extReplace(srcReplaced, sourceExt)
         : sourceExt.map(srcExt => extReplace(srcReplaced, srcExt))
   }
}

const extReplace = (file, newExt) => {
   const dotIndex = file.lastIndexOf('.')
   return `${file.slice(0, dotIndex)}.${newExt}`
}

const HoIgnoreFn = (exts = [], ignores) => (filepath, stats) =>
   exts.find(ext => (0, _utils.extstr)(filepath) === ext) ||
   ignores.find(ignorepath => filepath.indexOf(ignorepath) !== -1)
module.exports = exports['default']
