'use strict'

Object.defineProperty(exports, '__esModule', {
   value: true
})

var _ora = require('ora')

var _ora2 = _interopRequireDefault(_ora)

var _chalk = require('chalk')

var _main = require('./main')

var _main2 = _interopRequireDefault(_main)

var _utils = require('./main/utils.js')

function _interopRequireDefault(obj) {
   return obj && obj.__esModule ? obj : { default: obj }
}

exports.default = (choose, opts) =>
   getConfig(opts.config)
      .then(config =>
         getPreset(opts.preset).then(preset => {
            config = choose ? config[choose] : config
            config = config.default || config
            ;(0, _utils.throwIf)(config, 'object', 'config')
            ;(0, _utils.throwIf)(preset, 'object', 'preset')
            var _config = config
            const put = _config.put,
               out = _config.out,
               process = _config.process,
               weirs = _config.weirs,
               ignore = _config.ignore

            return [put, out, { process, weirs, ignore }, preset]
         })
      )
      .then(arg =>
         (0, _main2.default)(...arg).then(
            opts.verbose ? contentsExecOra : contentsExec
         )
      )
      .catch(errorHandler)

const contentsExecOra = contents => {
   const ora = (0, _ora2.default)()
   ora.start()
   return Promise.all(
      contents.map(content => {
         const ora = (0, _ora2.default)()
         const message = content.message()
         return content
            .exec()
            .then(() => ora.succeed(message))
            .catch(err => {
               ora.fail(message)
               throw err
            })
      })
   ).then(() => ora.stop())
}

const contentsExec = contents =>
   Promise.all(contents.map(content => content.exec()))

const rooquire = require('app-root-path').require

const getConfig = config =>
   Promise.resolve()
      .then(() => {
         if (config) {
            return rooquire(config)
         } else {
            return rooquire(`package.json`).chin || rooquire(`chin.config.json`)
         }
      })
      .catch(err => {
         const message = config ? `${config} is not found` : `config is not set`
         throw new Error(message)
      })

const getPreset = preset =>
   Promise.resolve()
      .then(() => {
         if (preset) {
            return rooquire(preset)
         } else {
            return rooquire(`chin.preset.js`)
         }
      })
      .catch(err => {
         const message = preset ? `${preset} is not found` : `preset is not set`
         throw new Error(message)
      })

const errorHandler = err => {
   const message = (0, _chalk.cyan)(`
  ${err}
  `)
   console.error(message)
   return process.exit(1)
}
module.exports = exports['default']
