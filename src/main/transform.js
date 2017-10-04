// @flow
import Content, { type Exts, type Preset } from './Content.js'
import { resolve, normalize, sep } from 'path'
import { throwIf, dirReplace } from './utils.js'

type Weir = [string, Exts]
export type Weirs = Array<Weir>
type Files = Array<string>
type Mixes = Array<string | Content>
type Contents = Array<Content>

export default (
   put: string,
   out: string,
   preset?: Preset,
   files: Files,
   exts?: Exts,
   weirs?: Weirs
): Array<Content> => {
   const mixes = transformWeirs(put, out, preset, files, weirs)
   return transformExts(put, out, preset, mixes, exts)
}

const transformWeirs = (
   put: string,
   out: string,
   preset?: Preset,
   files: Array<string>,
   weirs?: Weirs
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
         const exts = applicable[1]
         const outfile = dirReplace(file, put, out)
         return new Content(file, outfile, exts, preset)
      }
   })

   return mixes
}

const transformExts = (
   put: string,
   out: string,
   preset?: Preset,
   mixes: any,
   exts?: Exts
): Contents => {
   const contents: Contents = mixes.map(mixture => {
      if (typeof mixture === 'object') {
         return mixture
      } else {
         const file = mixture
         const outfile = dirReplace(mixture, put, out)
         return new Content(file, outfile, exts, preset)
      }
   })

   return contents
}
