'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})

var _fsExtra = require('fs-extra')

var _path = require('path')

var _utils = require('./utils.js')

const isArray = Array.isArray

const pluginTypeMap = new Map([
   [0, 'buffer'],
   [1, 'stream'],
   [false, 'buffer'],
   [true, 'stream'],
   ['buffer', 'buffer'],
   ['stream', 'stream']
])

class Content {
   constructor(file, outfile, _process, preset) {
      this.file = file

      var _parse = (0, _path.parse)(outfile)

      const root = _parse.root,
         dir = _parse.dir,
         name = _parse.name,
         ext = _parse.ext

      this.out = { root, dir, name, ext }

      if (_process && preset) {
         let pluginName, readOpts, pluginType

         if (typeof _process === 'string') {
            pluginName = _process
         } else if (isArray(_process)) {
            _process
            pluginName = _process[0]
            readOpts = _process[1]
            pluginType = _process[2]
         } else if (typeof _process === 'object') {
            _process
            const pluginExt = _process[(0, _utils.extstr)(file)]

            if (typeof pluginExt === 'string') {
               pluginName = pluginExt
            } else if (isArray(pluginExt)) {
               pluginExt
               pluginName = pluginExt[0]
               readOpts = pluginExt[1]
               pluginType = pluginExt[2]
            }
         }

         if (pluginName) {
            const plugin = preset[pluginName]
            ;(0, _utils.throwIf)(plugin, 'function', 'plugin')
            this.readOpts = readOpts || null
            this.plugin = {
               name: pluginName,
               type: pluginTypeMap.get(pluginType) || 'buffer',
               fn: plugin
            }
         }
      }
   }

   outpath() {
      if (this.out.basename) {
         throw new Error(`must not set "basename" in outputObject`)
      } else {
         return (0, _path.resolve)((0, _path.format)(this.out))
      }
   }

   exec() {
      const file = this.file,
         plugin = this.plugin

      const filepath = (0, _path.resolve)(file)

      if (!plugin) {
         return (0, _fsExtra.copy)(filepath, this.outpath())
      }

      const readOpts = this.readOpts
      const type = plugin.type,
         fn = plugin.fn

      const transform = fn(this.out)

      if (type === 'buffer') {
         transform
         return (0, _fsExtra.readFile)(filepath, readOpts)
            .then(transform)
            .then(
               data =>
                  data &&
                  data.constructor === Buffer &&
                  (0, _fsExtra.outputFile)(this.outpath(), data)
            )
      } else if (type === 'stream') {
         transform
         const outDir = this.out.dir
         if (!outDir) {
            throw new Error(`"dir" in outputObject`)
         } else {
            return (0, _fsExtra.ensureDir)((0, _path.resolve)(outDir)).then(
               () =>
                  new Promise((resolve, reject) => {
                     const readable = (0, _fsExtra.createReadStream)(
                        filepath,
                        readOpts
                     )
                     readable.on('error', reject)

                     const result = transform(readable)

                     if (
                        !result ||
                        !('_readableState' in result) ||
                        !('_writableState' in result)
                     ) {
                        readable.destroy(
                           new Error(`transform must return stream`)
                        )
                     } else {
                        const writable = (0, _fsExtra.createWriteStream)(
                           this.outpath()
                        )
                        writable.on('error', reject)
                        writable.on('finish', resolve)

                        result.pipe(writable)
                     }
                  })
            )
         }
      }
   }

   message() {
      const file = this.file,
         out = this.out,
         plugin = this.plugin

      const which = plugin ? plugin.name : `copy`
      const normalizeFile = (0, _path.normalize)(file)
      const normalizeOut = (0, _path.normalize)((0, _path.format)(out))
      return `${which}: ${normalizeFile} => ${normalizeOut}`
   }
}
exports.default = Content
module.exports = exports['default']
