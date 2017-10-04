'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})

var _fsExtra = require('fs-extra')

var _path = require('path')

var _utils = require('./utils.js')

const isArray = Array.isArray
class Content {
   constructor(file, outfile, exts, preset) {
      this.file = file
      this.out = outfile

      if (exts && typeof exts === 'object') {
         if (isArray(exts)) throw new TypeError('exts is array')

         const ext = (0, _utils.extstr)(file)
         const pluginInfo = exts[ext]
         let encoding
         if (pluginInfo) {
            let pluginName
            if (isArray(pluginInfo)) {
               pluginName = pluginInfo[0]
               encoding = pluginInfo[1]
            } else {
               pluginName = pluginInfo
            }
            ;(0, _utils.throwIf)(pluginName, 'string', `pluginName`)

            const plugin = preset[pluginName]
            ;(0, _utils.throwIf)(plugin, 'function', `plugin`)
            preset
            this.plugin = {
               fn: plugin,
               name: pluginName
            }
         }

         this.encoding = encoding || null
      }
   }

   data() {
      return Promise.resolve().then(() =>
         (0, _fsExtra.readFile)((0, _path.resolve)(this.file), this.encoding)
      )
   }

   exec() {
      const file = this.file,
         out = this.out,
         plugin = this.plugin

      return !plugin
         ? (0, _fsExtra.copy)(file, out)
         : this.data()
              .then(data => plugin.fn(data, (0, _path.parse)(out)))
              .then(result => {
                 if (!result) {
                    return
                 } else if (isArray(result)) {
                    result
                    const out = result[0]
                    result[0] = (0, _path.isAbsolute)(out)
                       ? out
                       : (0, _path.resolve)(out)
                    return (0, _fsExtra.outputFile)(...result)
                 } else if (result.constructor === Buffer) {
                    result
                    return (0, _fsExtra.outputFile)(
                       (0, _path.resolve)(out),
                       result
                    )
                 } else {
                    throw new TypeError(`plugin result is ${typeof result}`)
                 }
              })
   }

   message() {
      const file = this.file,
         out = this.out,
         plugin = this.plugin

      return `${plugin ? plugin.name : `copy`}: ${file} => ${out}`
   }
}
exports.default = Content
module.exports = exports['default']
