// @flow
import assert from 'assert'
import figures from 'figures'
import chalk from 'chalk'
import { normalize, join } from 'path'
import prepare from './prepare.js'
import zap from './zap.js'
import watchprocess from './watch.js'
import { type Config, type Watcher } from '../types.js'

const BASE_COLOR = 'cyan'
const PRE_SUCC = chalk.green(figures.tick)
const PRE_FAIL = chalk.red(figures.cross)

const init = (config = {}) => {
  assert(config.put && typeof config.put === 'string', '')
  assert(config.out && typeof config.out === 'string', '')
  config.put = normalize(config.put)
  config.out = normalize(config.out)
  return config
}

const chin = async (config: Config): Promise<void> => {
  const { put, out, ignored, processors, verbose } = init(config)
  const { map } = await prepare(put, out, processors, ignored)
  await zapAll(map, verbose)
  return undefined
}

const watch = async (config: Config): Promise<Watcher> => {
  const { put, out, ignored, processors, verbose, watch: watchOpts } = init(config)
  const { map, f2t } = await prepare(put, out, processors, ignored)
  await zapAll(map, verbose)
  const watcher = watchprocess({ map, f2t, put, out, watchOpts, ignored, verbose })
  return watcher
}

const zapAll = (map, verbose) =>
  !verbose
  ? zapAllQuiet(map)
  : zapAllVerbose(map)

const zapAllQuiet = (map) =>
  Promise.all([].concat(...[...map.values()]).map(zap))

const zapAllVerbose = (map) =>
  recursiveZapDir([].concat([...map.entries()])).then(count =>
    console.log(chalk[BASE_COLOR](`${figures.pointer} ${count} files`))
  )

const recursiveZapDir = async (entries, count = 0) => {

  const [ dirpath, eggs ] = entries.splice(0, 1)[0]

  if (eggs.length) {
    console.log(`${dirpath}: ${chalk[BASE_COLOR](`${eggs.length} files`)}`)
    
    let countByDir = 0

    await Promise.all(eggs.map(egg =>
      zap(egg)
      .then(msg => console.log(`${PRE_SUCC} ${chalk.gray(`${egg.filepath}${msg ? `: ${msg}` : ''}`)}`))
      .then(() => countByDir++)
      .catch(err => console.log(`${PRE_FAIL} ${chalk.gray(`${egg.filepath}: ${err.message}`)}`))
    ))

    count += countByDir
  }

  return entries.length ? recursiveZapDir(entries, count) : count
}

export { chin, watch }
export default chin