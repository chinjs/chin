// @flow
import recursiveReaddir from 'recursive-readdir'
import { join, extname } from 'path'
import {
  type Path,
  type Processors,
  type Ignored,
  type EggObj,
  type F2TFn
} from '../types.js'

const createMap = (put, ignored, f2t, map) =>
  recursiveReaddir(put, ignored)
  .then(filepaths => filepaths.map(f2t).forEach(([ dirpath, egg ]) => {
    const eggs: any = map.get(dirpath);(eggs: EggObj[])
    eggs.push(egg)
  }))
  .then(() => map)

export default (
  put: Path,
  out: Path,
  processors: any,
  ignored: Ignored
): Promise<{
  map: Map<Path, EggObj[]>,
  f2t: F2TFn
}> => {

  let initialMap, f2t

  if (!Array.isArray(processors)) {
    (processors: Processors | void)
    
    initialMap = new Map([ [put, []] ])
    
    f2t = (filepath: Path) => {
      return [put, createEgg(filepath, put, out, processors)]
    }
  } else {
    (processors: [Path, Processors][])
    
    const findEntries = processors.map(([dirpath,_processors]) => [
      (dirpath === '/' || dirpath === './' || dirpath === '*')
      ? put
      : join(put, dirpath),
      _processors
    ])
    
    initialMap = new Map([ [put, []] ].concat(findEntries.map(([ dirpath ]) => [dirpath, []] )))
    
    f2t = (filepath: Path) => {
      const [dirpath, processors] = findEntries.find(([ dirpath ]) => filepath.includes(dirpath)) || [put, {}]
      return [dirpath, createEgg(filepath, put, out, processors)]
    }
  }
  
  return createMap(put, ignored, f2t, initialMap).then(map => ({ map, f2t }))
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