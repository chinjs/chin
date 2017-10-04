// @flow
import { readFile, outputFile, copy } from 'fs-extra'
import { resolve, isAbsolute, parse, format } from 'path'
import { throwIf, extstr } from './utils.js'
const { isArray } = Array

type Ext = string
export type Exts = { [ext: string]: Ext }

type WriteFile$Opts = {
   encoding?: ?string,
   mode?: number,
   flag?: string
}

type OutpufFile$Arg = [
   string,
   Buffer | string | Uint8Array,
   string | WriteFile$Opts,
   (err: ?ErrnoError) => void
]

type PathObject = {
   root: string,
   dir: string,
   base: string,
   ext: string,
   name: string
}

type Plugin$Result = Buffer | OutpufFile$Arg | void
type Plugin = (
   data: Buffer,
   opts: PathObject
) => Plugin$Result | Promise<Plugin$Result>
export type Preset = { [name: string]: Plugin }

export default class Content {
   file: string
   out: string
   encoding: string | null
   plugin: ?{
      fn: Plugin,
      name: string
   }
   constructor(file: string, outfile: string, exts?: Exts, preset: any): void {
      this.file = file
      this.out = outfile

      if (exts && typeof exts === 'object') {
         if (isArray(exts)) throw new TypeError('exts is array')

         const ext = extstr(file)
         const pluginInfo = exts[ext]
         let encoding
         if (pluginInfo) {
            let pluginName
            if (isArray(pluginInfo)) {
               pluginName = pluginInfo[0]
               encoding = pluginInfo[1]
            } else {
               pluginName = pluginInfo
            }
            throwIf(pluginName, 'string', `pluginName`)

            const plugin = preset[pluginName]
            throwIf(plugin, 'function', `plugin`)
            ;(preset: Preset)
            this.plugin = {
               fn: plugin,
               name: pluginName
            }
         }

         this.encoding = encoding || null
      }
   }

   data(): Promise<Buffer> {
      return Promise.resolve().then(() =>
         readFile(resolve(this.file), this.encoding)
      )
   }

   exec(): Promise<void> {
      const { file, out, plugin } = this
      return !plugin
         ? copy(file, out)
         : this.data()
              .then(data => plugin.fn(data, parse(out)))
              .then((result: any) => {
                 if (!result) {
                    return
                 } else if (isArray(result)) {
                    ;(result: OutpufFile$Arg)
                    const out = result[0]
                    result[0] = isAbsolute(out) ? out : resolve(out)
                    return outputFile(...result)
                 } else if (result.constructor === Buffer) {
                    ;(result: Buffer)
                    return outputFile(resolve(out), result)
                 } else {
                    throw new TypeError(`plugin result is ${typeof result}`)
                 }
              })
   }

   message() {
      const { file, out, plugin } = this
      return `${plugin ? plugin.name : `copy`}: ${file} => ${out}`
   }
}
