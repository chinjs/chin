// @flow
import chokidar from 'chokidar'
import chalk from 'chalk'
import { remove } from 'fs-extra'
import { sep, join, resolve } from 'path'
import zap from './zap.js'
import type {
  EggObj,
  F2TFn,
  Path,
  Ignored,
  ChokidarOpts,
  Watcher,
} from './types.js'

export default ({ map, f2t, put, out, watchOpts, ignored, verbose }: {
  map: Map<Path, EggObj[]>,
  f2t: F2TFn,
  put: Path,
  out: Path,
  watchOpts?: ChokidarOpts,
  ignored?: Ignored,
  verbose?: boolean,
}): Watcher => {

  const watcher = chokidar.watch(put, Object.assign({
    ignored,
    ignorePermissionErrors: true
  }, watchOpts))

  const errorHandler = (err) => {
    console.error(err)
    watcher.close()
  }

  const opts = { map, f2t, put, out, ignored, verbose }

  watcher.on('error', errorHandler)

  watcher.on('ready', () =>
    verbose &&
    console.log(chalk.cyan('[start]') + ' ' + chalk.gray(put + ' => ' + out))
  )

  watcher.on('add', filepath => {
    const eggs: any = map.get(findKey(map, filepath))
    ;(eggs: EggObj[])

    return (
      !eggs.some(egg => egg.filepath === filepath) &&
      onAdd(filepath, opts).catch(errorHandler)
    )
  })

  watcher.on('change', filepath =>
    onChange(filepath, opts).catch(errorHandler)
  )

  watcher.on('unlink', filepath =>
    onUnlink(filepath, opts).catch(errorHandler)
  )

  watcher.on('unlinkDir', dirpath =>
    onUnlinkDir(resolve(dirpath), opts).catch(errorHandler)
  )

  return watcher
}

const a2r = (absolutePath) => join('./', absolutePath.split(resolve())[1])

const findKey = (map, longerPath) =>
  [].concat([...map.keys()])
  .filter(dirpath => longerPath.includes(dirpath))
  .map(dirpath => dirpath.split(sep))
  .sort((p, c) =>
    p.length > c.length ? -1 :
    p.length < c.length ? 1 :
    0
  )
  [0]
  .join(sep)

const onAdd = async (filepath, { f2t, map, verbose }) => {
  const [ dirpath, egg ] = f2t(filepath)

  const eggs: any = map.get(dirpath)
  ;(eggs: EggObj[])
  eggs.push(egg)

  await zap(egg)
  return verbose && console.log(chalk.green('[added]') + ' ' + chalk.gray(filepath + ' => ' + egg.outpath))
}

const onChange = async (filepath, { map, verbose }) => {
  const eggs: any = map.get(findKey(map, filepath))
  ;(eggs: EggObj[])

  const egg = eggs.find(egg => egg.filepath === filepath)

  return egg && zap(egg).then(() =>
    verbose && console.log(chalk.yellow('[changed]') + ' ' + chalk.gray(filepath + ' => ' + egg.outpath))
  )
}

const onUnlink = async (filepath, { map, verbose }) => {
  const eggs: any = map.get(findKey(map, filepath))
  ;(eggs: EggObj[])

  const spliceIndex = eggs.findIndex(egg => egg.filepath === filepath)

  if (spliceIndex === -1) return

  const { outpath } = eggs.splice(spliceIndex, 1)[0]
  await remove(resolve(outpath))
  return verbose && console.log(chalk.red('[unlinked]') + ' ' + chalk.gray(filepath + ' => ' + outpath))
}

const onUnlinkDir = (dirpath, { map, put, out, verbose }) =>
  Promise
  .all(
    []
    .concat(...[...map.values()].map(eggs => recursiveRemoveEgg(eggs, dirpath)))
    .map(({ filepath, outpath }) =>
      remove(resolve(outpath))
      .then(() => verbose && console.log(chalk.red('[unlinked]') + ' ' + chalk.gray(filepath + ' => ' + outpath)))
    )
  )
  .then(() => dirpath.split(put).join(out))
  .then(outpath =>
    remove(outpath)
    .then(() => verbose && console.log(chalk.red('[unlinked]') + ' ' + chalk.gray(a2r(dirpath) + ' => ' + a2r(outpath))))
  )

const recursiveRemoveEgg = (eggs, dirpath, spliced = []) => {
  const spliceIndex = eggs.findIndex(({ filepath }) => resolve(filepath).includes(dirpath))
  return spliceIndex === -1 ? spliced : recursiveRemoveEgg(
    eggs,
    dirpath,
    spliced.concat(eggs.splice(spliceIndex, 1))
  )
}