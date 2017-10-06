import Ora from 'ora'
import { cyan } from 'chalk'
import chin from './main'
import { throwIf } from './main/utils.js'

export default (choose, opts) =>
   getConfig(opts.config)
      .then(config =>
         getPreset(opts.preset).then(preset => {
            config = choose ? config[choose] : config
            config = config.default || config
            throwIf(config, 'object', 'config')
            throwIf(preset, 'object', 'preset')
            const { put, out, process, weirs, ignore } = config
            return [put, out, { process, weirs, ignore }, preset]
         })
      )
      .then(arg =>
         chin(...arg).then(opts.verbose ? contentsExecOra : contentsExec)
      )
      .catch(errorHandler)

const contentsExecOra = contents => {
   const ora = Ora()
   ora.start()
   return Promise.all(
      contents.map(content => {
         const ora = Ora()
         return content
            .exec()
            .then(message => {
               ora.succeed(message)
            })
            .catch(err => {
               ora.fail(content.message())
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
   const message = cyan(`
  ${err}
  `)
   console.error(message)
   return process.exit(1)
}
