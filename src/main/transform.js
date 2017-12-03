// @flow
import Content, { type Process, type Preset } from './Content.js'
import { resolve, normalize, sep } from 'path'
import { throwIf, dirReplace } from './utils.js'

type Weir = [string, Process]
export type Weirs = Array<Weir>
type Files = Array<string>
type Mixes = Array<string | Content>
type Contents = Array<Content>

export default (
  put: string,
  out: string,
  files: Files,
  _process?: Process,
  weirs?: Weirs,
  preset?: Preset
): Array<Content> => {
  const mixes = transformWeirs(put, out, files, weirs, preset)
  return transformProcess(put, out, mixes, _process, preset)
}

const transformWeirs = (
  put: string,
  out: string,
  files: Array<string>,
  weirs?: Weirs,
  preset?: Preset
): Files | Mixes => {
  if (!weirs || !Array.isArray(weirs)) return files
  ;(weirs: Weirs)

  const reweirs: Weirs = weirs.map(([weirpath, weirExt]) => [
    `${put}${sep}${normalize(weirpath)}`,
    weirExt
  ])

  const mixes: Mixes = files.map(file => {
    const includes = reweirs
      .filter(([weirpath]) => file.includes(weirpath))
      .sort((a, b) => {
        const lenA = a[0].split(sep).length
        const lenB = b[0].split(sep).length
        return lenA > lenB ? -1 : lenA < lenB ? 1 : 0
      })
    const applicable = includes[0]
    if (!applicable) {
      return file
    } else {
      const _process = applicable[1]
      const outfile = dirReplace(file, put, out)
      return new Content(file, outfile, _process, preset)
    }
  })

  return mixes
}

const transformProcess = (
  put: string,
  out: string,
  mixes: any,
  _process?: Process,
  preset?: Preset
): Contents => {
  const contents: Contents = mixes.map(mixture => {
    if (typeof mixture === 'object') {
      return mixture
    } else {
      const file = mixture
      const outfile = dirReplace(mixture, put, out)
      return new Content(file, outfile, _process, preset)
    }
  })

  return contents
}
