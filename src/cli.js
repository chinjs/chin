import Ora from 'ora'
import { cyan } from 'chalk'
import chin from './main'
import { throwIf } from './main/utils.js'

export default (choose, opts) =>
  getConfig(opts.config)
    .then(config => {
      config = choose ? config[choose] : config
      config = config.default || config
      throwIf(config, 'object', 'config')
      process.env.CHIN_ENV = choose
      process.env.CHIN_PUT = config.put
      process.env.CHIN_OUT = config.out
      return config
    })
    .then(config =>
      getPreset(opts.preset).then(preset => {
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
  const message = cyan(`
  ${err}
  `)
  console.error(message)
  return process.exit(1)
}
