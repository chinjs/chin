// @flow
import assert from 'assert'
import recursiveReaddir from 'recursive-readdir'
import ora from 'ora'
import figures from 'figures'
import chalk from 'chalk'
import { join } from 'path'
import prepare from './prepare.js'
import zap from './zap.js'
import watchprocess from './watch.js'
import {
  type Config,
  type EggObj,
  type Watcher
} from '../types.js'

const BASE_COLOR = 'yellow'

const init = (config = {}) => {
  assert(config.put && typeof config.put === 'string', '')
  assert(config.out && typeof config.out === 'string', '')
  config.put = join('./', config.put)
  config.out = join('./', config.out)
  return config
}

const pushToMap = (map, f2t, ...arg) =>
  recursiveReaddir(...arg)
  .then(filepaths =>
    filepaths
    .map(f2t)
    .forEach(([dirpath,egg]) => {
      const eggs: any = map.get(dirpath)
      ;(eggs: EggObj[])
      eggs.push(egg)
    })
  )
  .then(() => map)

const chin = async (config: Config): Promise<void> => {
  const { put, out, ignored, processors, verbose } = init(config)
  const [ initialMap, f2t ] = prepare(put, out, processors)
  const map = await pushToMap(initialMap, f2t, put, ignored)
  return (
    !verbose
    ? zapAllQuiet(map)
    : zapAllVerbose(map)
  )
  .then(() => undefined)
}

const watch = async (config: Config): Promise<Watcher> => {
  const { put, out, ignored, processors, verbose, watch: watchOpts } = init(config)
  const [ initialMap, f2t ] = prepare(put, out, processors)
  const map = await pushToMap(initialMap, f2t, put, ignored)
  return (
    !verbose
    ? zapAllQuiet(map)
    : zapAllVerbose(map)
  )
  .then(() =>
    watchprocess({ map, f2t, put, out, watchOpts, ignored, verbose })
  )
  .then(watcher => watcher)
}

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

    await Promise
    .all(eggs.map(
      egg => zap(egg).then(() => spinner.text = chalk.gray(`${dirpath}: ${countByDir++} / ${eggs.length}`))
    ))
    .then(() => spinner.succeed(chalk.gray(`${dirpath}: ${eggs.length} files`)))
    .catch(err => {
      spinner.fail()
      throw err
    })

    count += countByDir
  }

  return entries.length ? recursiveZapDir(entries, count) : count
}

export { chin, watch }
export default chin