import consola from 'consola'
import { require as rooquire } from 'app-root-path'
import { remove } from 'fs-extra'

export const PUT = 'assets'
export const OUT = 'public'
export const CONFIG1 = 'chin.config.js'
export const CONFIG2 = '.chin/index.js'

const requireModules = (requireValue) =>
  requireValue
  .split(',')
  .forEach(moduleName => require(moduleName))

const getConfig = (configValue) => {
  let config
  
  if (typeof configValue === 'string') {
    config = rooquire(configValue)
  } else {
    try { config = rooquire(CONFIG1) }
    catch (e1) {
      if (!e1.message.includes(CONFIG1)) throw e1
      try { config = rooquire(CONFIG2) }
      catch (e2) { throw !e2.message.includes(CONFIG2) ? e2 : new Error(`Cannot find ${CONFIG1} || ${CONFIG2}`) }
    }
  }

  return 'default' in config ? config['default'] : config
}

export default (program, action) => Promise.resolve()
  .then(() =>
    program.require &&
    requireModules(program.require)
  )
  .then(() =>
    program.config
      ? getConfig(program.config)
      : consola.info('no config')
  )
  .then((config = {}) =>
    Array.isArray(config)
      ? config
      : [config]
  )
  .then(configs =>
    recursiveSpliceAction(
      program,
      configs,
      action
    )
  )
  .then(() => console.log(''))
  .catch((err) => {
    consola.error(err)
    process.exit(1)
  })

const recursiveSpliceAction = (program, configs, action, isCutline) => {

  const config = configs.splice(0, 1)[0]

  const { put, out, clean, verbose } = normalizeOptions(program, config)
  const { before, after, ignored, processors, watch } = config

  return Promise.resolve()
  .then(() =>
    verbose &&
    isCutline &&
    cutLog()
  )
  .then(() =>
    verbose &&
    declareLog(program.version(), put, out)
  )
  .then(() =>
    typeof before === 'function' &&
    before()
  )
  .then(() =>
    clean &&
    remove(out)
  )
  .then(() =>
    action({ put, out, verbose, ignored, processors, watch })
  )
  .then(() =>
    typeof after === 'function' &&
    after()
  )
  .then(() =>
    configs.length &&
    recursiveSpliceAction(
      program,
      configs,
      action,
      true
    )
  )
}

const normalizeOptions = (program, config) => ({
  put: program.put || config.put || PUT,
  out: program.out || config.out || OUT,
  clean: program.clean || config.clean,
  verbose: !program.quiet && !config.quiet
})

const cutLog = () => console.log('\n---------------')

const declareLog = (version, put, out) => console.log(`
chin@${version}
put: ${put}
out: ${out}
`)