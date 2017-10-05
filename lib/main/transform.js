'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})

var _Content = require('./Content.js')

var _Content2 = _interopRequireDefault(_Content)

var _path = require('path')

var _utils = require('./utils.js')

function _interopRequireDefault(obj) {
   return obj && obj.__esModule ? obj : { default: obj }
}

exports.default = (put, out, files, _process, weirs, preset) => {
   const mixes = transformWeirs(put, out, files, weirs, preset)
   return transformProcess(put, out, mixes, _process, preset)
}

const transformWeirs = (put, out, files, weirs, preset) => {
   if (!weirs || !Array.isArray(weirs)) return files
   weirs

   const reweirs = weirs.map(([weirpath, weirExt]) => [
      `${put}${_path.sep}${(0, _path.normalize)(weirpath)}`,
      weirExt
   ])

   const mixes = files.map(file => {
      const includes = reweirs
         .filter(([weirpath]) => file.indexOf(weirpath) !== -1)
         .sort((a, b) => {
            const lenA = a[0].split(_path.sep).length
            const lenB = b[0].split(_path.sep).length
            return lenA > lenB ? -1 : lenA < lenB ? 1 : 0
         })
      const applicable = includes[0]
      if (!applicable) {
         return file
      } else {
         const _process = applicable[1]
         const outfile = (0, _utils.dirReplace)(file, put, out)
         return new _Content2.default(file, outfile, _process, preset)
      }
   })

   return mixes
}

const transformProcess = (put, out, mixes, _process, preset) => {
   const contents = mixes.map(mixture => {
      if (typeof mixture === 'object') {
         return mixture
      } else {
         const file = mixture
         const outfile = (0, _utils.dirReplace)(mixture, put, out)
         return new _Content2.default(file, outfile, _process, preset)
      }
   })

   return contents
}
module.exports = exports['default']
