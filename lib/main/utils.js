'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})
exports.throwIf = exports.dirReplace = exports.extstr = undefined

var _path = require('path')

const extstr = (exports.extstr = pathstring =>
   (0, _path.extname)(pathstring).slice(1))
const dirReplace = (exports.dirReplace = (target, source, compare) => {
   const sources = source.split(_path.sep)
   const spoiles = target
      .split(_path.sep)
      .filter((tar, index) => !sources[index])
   return compare
      .split(_path.sep)
      .concat(spoiles)
      .join(_path.sep)
})

const throwIf = (exports.throwIf = (target, type, key) => {
   if (type && typeof target !== type) {
      throw new TypeError(`${key} is ${typeof target}`)
   }

   if (!target) {
      throw new Error(`${key} is not set`)
   }
})
