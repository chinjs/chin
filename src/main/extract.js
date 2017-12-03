// @flow
import recursiveReadDir from 'recursive-readdir'
import { resolve, normalize, sep } from 'path'
import { throwIf, extstr, dirReplace } from './utils.js'
const { isArray } = Array

type FilePathes = Array<string>
type Targets = FilePathes
type Compare = [string, { [ext: string]: string | Array<string> }]
export type Opts$Extract = {
  exts?: Array<string>,
  targets?: Targets,
  compare?: Compare
}

export default (put: string, opts: Opts$Extract = {}): Promise<FilePathes> =>
  Promise.resolve()
    .then(() => ignoreTargets(opts.targets, put))
    .then(ignores => ignoreCompare(ignores, opts.compare, put))
    .then(ignores => {
      const ignoreFn = HoIgnoreFn(opts.exts, ignores)
      return recursiveReadDir(put, [ignoreFn])
    })

const ignoreTargets = (targets = [], put): FilePathes =>
  targets.map(target => `${put}${sep}${normalize(target)}`)

const ignoreCompare = (
  ignores: FilePathes,
  compare?: Compare,
  put: string
): Promise<FilePathes> =>
  Promise.resolve().then(() => {
    if (!compare || !isArray(compare)) return ignores
    ;(compare: Compare)

    throwIf(compare[0], 'string', 'extract.compare[0]')
    throwIf(compare[1], 'object', 'extract.compare[1]')
    const compareSrc = normalize(compare[0])
    const compareOpts = compare[1]
    const replacePath = HoReplacePath(compareOpts, compareSrc, put)

    return recursiveReadDir(compareSrc)
      .then(files => files.map(replacePath))
      .then(files => files.filter(path => path))
      .then(files => {
        files.forEach(file => {
          if (!isArray(file)) {
            ignores.push(file)
          } else {
            const files = file
            files.forEach(file => ignores.push(file))
          }
        })
        return ignores
      })
  })

const HoReplacePath = (compareOpts, compareSrc, put) => compareFile => {
  const sourceExt: any = compareOpts[extstr(compareFile)]
  if (sourceExt) {
    const srcReplaced = dirReplace(compareFile, compareSrc, put)
    return !isArray(sourceExt)
      ? extReplace(srcReplaced, sourceExt)
      : sourceExt.map(srcExt => extReplace(srcReplaced, srcExt))
  }
}

const extReplace = (file: string, newExt: string): string => {
  const dotIndex = file.lastIndexOf('.')
  return `${file.slice(0, dotIndex)}.${newExt}`
}

const HoIgnoreFn = (exts = [], ignores) => (filepath, stats) =>
  exts.find(ext => extstr(filepath) === ext) ||
  ignores.find(ignorepath => filepath.includes(ignorepath))
