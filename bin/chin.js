#!/usr/bin/env node
'use strict'

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var program = _interopDefault(require('commander'))
var __ = require('..')
var chalk = _interopDefault(require('chalk'))
var figures = _interopDefault(require('figures'))
var fsExtra = require('fs-extra')
var path$1 = require('path')

const PUT = 'assets'
const OUT = 'public'
const CONFIG1 = 'chin.config.js'
const CONFIG2 = '.chin/index.js'
const PRE_INFO = chalk.blue('info')
const PRE_FAIL = chalk.red(figures.cross)

const requireModules = requireValue =>
  requireValue.split(',').forEach(moduleName => require(moduleName))

const rooquire = filePath => require(path.join(process.cwd(), filePath))

const getConfig = configValue => {
  let config

  if (typeof configValue === 'string') {
    config = rooquire(configValue)
  } else {
    try {
      config = rooquire(CONFIG1)
    } catch (e1) {
      if (!e1.message.includes(CONFIG1)) throw e1

      try {
        config = rooquire(CONFIG2)
      } catch (e2) {
        throw !e2.message.includes(path$1.normalize(CONFIG2))
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
    .then(() =>
      program$$1.config
        ? getConfig(program$$1.config)
        : console.info(`${PRE_INFO} no config`)
    )
    .then((config = {}) => (Array.isArray(config) ? config : [config]))
    .then(configs => recursiveSpliceAction(program$$1, configs, action))
    .then(() => console.log(''))
    .catch(err => {
      console.error(PRE_FAIL, err)
      process.exit(1)
    })

const recursiveSpliceAction = (program$$1, configs, action, isCutline) => {
  const config = configs.splice(0, 1)[0]

  const _normalizeOptions = normalizeOptions(program$$1, config),
    put = _normalizeOptions.put,
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
    .then(() =>
      action({
        put,
        out,
        verbose,
        ignored,
        processors,
        watch
      })
    )
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
