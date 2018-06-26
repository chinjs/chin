#!/usr/bin/env node
'use strict'

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var consola = _interopDefault(require('consola'))
var appRootPath = require('app-root-path')
var fsExtra = require('fs-extra')
var program = _interopDefault(require('commander'))
var __ = require('..')

const PUT = 'assets'
const OUT = 'public'
const CONFIG1 = 'chin.config.js'
const CONFIG2 = '.chin/index.js'

const requireModules = requireValue =>
  requireValue.split(',').forEach(moduleName => require(moduleName))

const isThrow = message => !message.includes('Cannot find module')

const getConfig = configValue => {
  let config
  if (typeof configValue === 'string') {
    config = appRootPath.require(configValue)
  } else {
    try {
      config = appRootPath.require(CONFIG1)
    } catch (e1) {
      if (isThrow(e1.message)) throw e1
      try {
        config = appRootPath.require(CONFIG2)
      } catch (e2) {
        throw isThrow(e2.message)
          ? e2
          : new Error(`Cannot find ${CONFIG1} || ${CONFIG2}`)
      }
    }
  }
  return 'default' in config ? config['default'] : config
}

var action = (program$$1, action) =>
  Promise.resolve()
    .then(() => program$$1.require && requireModules(program$$1.require))
    .then(
      () =>
        program$$1.config
          ? getConfig(program$$1.config)
          : consola.info('no config')
    )
    .then((config = {}) => (Array.isArray(config) ? config : [config]))
    .then(configs => recursiveSpliceAction(program$$1, configs, action))
    .then(() => console.log(''))
    .catch(err => {
      consola.error(err)
      process.exit(1)
    })

const recursiveSpliceAction = (program$$1, configs, action, isCutline) => {
  const config = configs.splice(0, 1)[0]

  var _normalizeOptions = normalizeOptions(program$$1, config)

  const put = _normalizeOptions.put,
    out = _normalizeOptions.out,
    clean = _normalizeOptions.clean,
    verbose = _normalizeOptions.verbose
  const before = config.before,
    after = config.after,
    ignored = config.ignored,
    processors = config.processors,
    watch = config.watch

  return Promise.resolve()
    .then(() => verbose && isCutline && cutLog())
    .then(() => verbose && declareLog(program$$1.version(), put, out))
    .then(() => typeof before === 'function' && before())
    .then(() => clean && fsExtra.remove(out))
    .then(() => action({ put, out, verbose, ignored, processors, watch }))
    .then(() => typeof after === 'function' && after())
    .then(
      () =>
        configs.length &&
        recursiveSpliceAction(program$$1, configs, action, true)
    )
}

const normalizeOptions = (program$$1, config) => ({
  put: program$$1.put || config.put || PUT,
  out: program$$1.out || config.out || OUT,
  clean: program$$1.clean || config.clean,
  verbose: !program$$1.quiet && !config.quiet
})

const cutLog = () => console.log('\n---------------')

const declareLog = (version, put, out) =>
  console.log(`
chin@${version}
put: ${put}
out: ${out}
`)

program
  .option('-c, --config [path]', `[default: ${CONFIG1} || ${CONFIG2}]`)
  .option('-i, --put <path>', `[default: ${PUT}]`)
  .option('-o, --out <path>', `[default: ${OUT}]`)
  .option('-r, --require <name..>', 'splited by ","')
  .option('--clean', 'remove "out" before')
  .option('-q, --quiet')
  .version(require('../package.json').version, '-v, --version')
  .on('--help', () =>
    console.log(`
  Example:

    chin -c -r babel-register,dotenv/config
`)
  )

program
  .command('watch')
  .option('-c, --config [path]', `[default: ${CONFIG1} || ${CONFIG2}]`)
  .option('-i, --put <path>', `[default: ${PUT}]`)
  .option('-o, --out <path>', `[default: ${OUT}]`)
  .option('-r, --require <name...>', 'splited by ","')
  .option('--clean', 'remove "out" before')
  .option('-q, --quiet')
  .on('--help', () => console.log(``))
  .action(() => action(program, __.watch))

program.parse(process.argv)

program.args.length === 0
  ? action(program, __.chin)
  : program.args[0].constructor !== program.Command && program.help()