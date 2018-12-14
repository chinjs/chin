// @flow
import recursiveReaddir from 'recursive-readdir'
import { normalize, join, extname } from 'path'
import type {
  Path,
  Processors,
  Ignored,
  EggObj,
  F2TFn
} from './types.js'

const CWD_PATHS = ['.', './'].map(normalize)
const PUT_EXPRESSION = ['/', '.', './', '*']

export default (
  put: Path,
  out: Path,
  processors: any,
  ignored: Ignored | void
): Promise<{
  map: Map<Path, EggObj[]>,
  f2t: F2TFn
}> => {

  let map, f2t

  if (!Array.isArray(processors)) {
    (processors: Processors | void)
    map = new Map([ [put, []] ])
    f2t = (filepath: Path) => {
      return [put, createEgg(filepath, put, out, processors)]
    }
  } else {
    (processors: [Path, Processors][])
    const pairs = createPairs(put, processors)
    map = new Map(pairs.map(([ dirpath ]) => [dirpath, []]))
    f2t = (filepath: Path) => {
      const [dirpath, processors] = pairs.find(([ dirpath ]) => filepath.includes(dirpath))
      return [dirpath, createEgg(filepath, put, out, processors)]
    }
  }

  return recursiveSettingMap(put, ignored, f2t, map).then(() => ({ map, f2t }))
}

const createPairs = (put, processorsAsArray) => {
  const pairs = processorsAsArray.map(([ dirpath, processors ]) => [
    PUT_EXPRESSION.includes(dirpath) ? put : join(put, dirpath),
    processors
  ])

  if (!pairs.some(([ dirpath ]) => dirpath === put)) pairs.push([put, {}])

  return pairs
}

const recursiveSettingMap = (put, ignored, f2t, map) =>
  recursiveReaddir(put, ignored).then(filepaths =>
    filepaths.map(f2t).forEach(([ dirpath, egg ]) => {
      const eggs: any = map.get(dirpath);(eggs: EggObj[])
      eggs.push(egg)
    })
  )

const createEgg = (filepath, put, out, processors = {}) =>
  Egg(
    filepath,
    join(out, CWD_PATHS.includes(put) ? filepath : filepath.split(put)[1]),
    processors[extname(filepath).slice(1)] || {}
  )

const Egg = (filepath, outpath, { isStream = false, processor, options }): EggObj => ({
  filepath,
  outpath,
  isStream,
  processor,
  options
})