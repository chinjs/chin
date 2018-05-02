// @flow
import { join, extname } from 'path'
import {
  type Path,
  type Processors,
  type EggObj,
  type F2TFn
} from '../types.js'

export default (put: Path, out: Path, processors: any): [Map<Path, EggObj[]>, F2TFn] => {

  if (!Array.isArray(processors)) {
    (processors: Processors | void)
    return [
      new Map([ [put, []] ]),
      (filepath: Path) => [put, createEgg(filepath, put, out, processors)]
    ]
  }

  (processors: [Path, Processors][])

  const findEntries = processors.map(([dirpath,_processors]) => [
    (dirpath === '/' || dirpath === './' || dirpath === '*')
    ? put
    : join(put, dirpath),
    _processors
  ])

  return [
    new Map([
      [put, []]
    ].concat(findEntries.map(([dirpath]) =>
      [dirpath, []]
    ))),
    (filepath: Path) => {
      const [dirpath, processors] = findEntries.find(([path]) => filepath.includes(path)) || [put, {}]
      return [dirpath, createEgg(filepath, put, out, processors)]
    }
  ]
}

const createEgg = (filepath, put, out, processors = {}) =>
  Egg(
    filepath,
    join(out, filepath.split(put)[1]),
    processors[extname(filepath).slice(1)] || {}
  )

const Egg = (filepath, outpath, { isStream = false, processor, options }): EggObj => ({
  filepath,
  outpath,
  isStream,
  processor,
  options
})