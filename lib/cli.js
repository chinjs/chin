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
      .then(config => {
         config = choose ? config[choose] : config
         config = config.default || config
         ;(0, _utils.throwIf)(config, 'object', 'config')
         process.env.CHIN_ENV = choose
         process.env.CHIN_PUT = config.put
         process.env.CHIN_OUT = config.out
         return config
      })
      .then(config =>
         getPreset(opts.preset).then(preset => {
            ;(0, _utils.throwIf)(preset, 'object', 'preset')
            const put = config.put,
               out = config.out,
               process = config.process,
               weirs = config.weirs,
               ignore = config.ignore

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
         return content
            .exec()
            .then(message => {
               ora.succeed(message)
            })
            .catch(err => {
               ora.fail(content.messageTranslate())
               throw err
            })
      })
   ).then(() => ora.stop())
}

const contentsExec = contents =>
   Promise.all(contents.map(content => content.exec()))

const rooquire = require('app-root-path').require

const getConfig = config =>
   Promise.resolve().then(() => {
      if (config) {
         return rooquire(config)
      } else {
         return rooquire(`package.json`).chin || rooquire(`chin.config.json`)
      }
   })

const getPreset = preset =>
   Promise.resolve().then(() => {
      if (preset) {
         return rooquire(preset)
      } else {
         return rooquire(`chin.preset.js`)
      }
   })

const errorHandler = err => {
   const message = (0, _chalk.cyan)(`
  ${err}
  `)
   console.error(message)
   return process.exit(1)
}
