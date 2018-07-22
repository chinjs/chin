// @flow
import assert from 'assert'
import ora from 'ora'
import figures from 'figures'
import chalk from 'chalk'
import consola from 'consola'
import { normalize, join } from 'path'
import prepare from './prepare.js'
import zap from './zap.js'
import watchprocess from './watch.js'
import { type Config, type Watcher } from '../types.js'

const BASE_COLOR = 'yellow'

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
  recursiveZapDir([].concat([...map.entries()]))
  .then(count => console.log(chalk[BASE_COLOR](`${figures.pointer} ${count} files`)))

const recursiveZapDir = async (entries, count = 0) => {

  const [ dirpath, eggs ] = entries.splice(0, 1)[0]

  if (eggs.length) {
    const spinner = ora({ color: BASE_COLOR }).start(chalk.gray(`${dirpath}: `))

    let countByDir = 0

    await Promise.all(eggs.map(egg =>
      zap(egg)
      .then(() => spinner.text = chalk.gray(`${dirpath}: ${countByDir++} / ${eggs.length}`))
      .catch(({ message }) => consola.error(message))
    ))
    .then(() => spinner.succeed(chalk.gray(`${dirpath}: ${eggs.length} files`)))

    count += countByDir
  }

  return entries.length ? recursiveZapDir(entries, count) : count
}

export { chin, watch }
export default chin