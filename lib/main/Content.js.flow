// @flow
import {
   copy,
   readFile,
   ensureDir,
   createReadStream,
   createWriteStream,
   outputFile
} from 'fs-extra'
import { resolve, normalize, isAbsolute, parse, format } from 'path'
import { throwIf, extstr } from './utils.js'
const { isArray } = Array

type ReadFile$Opts = { encoding: string, flag?: string }
type ReadFile$Second = string | ReadFile$Opts
type Process$Tuple = [string, ReadFile$Second, any]
type Process$Object = { [ext: string]: string | Process$Tuple }
export type Process = string | Process$Tuple | Process$Object

type PathObject = {
   root?: string,
   dir?: string,
   ext?: string,
   name?: string,
   base?: string
}
type BufferFn$Result = Buffer | void
type TransformBufferFn = (
   data: Buffer
) => BufferFn$Result | Promise<BufferFn$Result>

type TransformStreamFn = (stream: stream$Readable) => stream$Transform

type PluginFn = (opts: PathObject) => TransformBufferFn | TransformStreamFn
export type Preset = { [name: string]: PluginFn }

const pluginTypeMap = new Map([
   [0, 'buffer'],
   [1, 'stream'],
   [false, 'buffer'],
   [true, 'stream'],
   ['buffer', 'buffer'],
   ['stream', 'stream']
])

export default class Content {
   file: string
   out: PathObject
   readOpts: ReadFile$Second | null | void
   plugin: ?{
      name: string,
      type: 'buffer' | 'stream',
      fn: PluginFn
   }

   constructor(
      file: string,
      outfile: string,
      _process?: any,
      preset?: Preset
   ): void {
      this.file = file

      const { root, dir, name, ext } = parse(outfile)
      this.out = { root, dir, name, ext }

      if (_process && preset) {
         let pluginName: string | void,
            readOpts: ReadFile$Second | void,
            pluginType: string | void

         if (typeof _process === 'string') {
            pluginName = _process
         } else if (isArray(_process)) {
            ;(_process: Process$Tuple)
            pluginName = _process[0]
            readOpts = _process[1]
            pluginType = _process[2]
         } else if (typeof _process === 'object') {
            ;(_process: Process$Object)
            const pluginExt: string | Process$Tuple = _process[extstr(file)]

            if (typeof pluginExt === 'string') {
               pluginName = pluginExt
            } else if (isArray(pluginExt)) {
               ;(pluginExt: Process$Tuple)
               pluginName = pluginExt[0]
               readOpts = pluginExt[1]
               pluginType = pluginExt[2]
            }
         }

         if (pluginName) {
            const plugin = preset[pluginName]
            throwIf(plugin, 'function', 'plugin')
            this.readOpts = readOpts || null
            this.plugin = {
               name: pluginName,
               type: pluginTypeMap.get(pluginType) || 'buffer',
               fn: plugin
            }
         }
      }
   }

   outpath() {
      if (this.out.basename) {
         throw new Error(`must not set "basename" in outputObject`)
      } else {
         return resolve(format(this.out))
      }
   }

   exec(): void | Promise<void> {
      const { file, plugin } = this
      const filepath = resolve(file)

      if (!plugin) {
         return copy(filepath, this.outpath()).then(() =>
            this.messageTranslate()
         )
      }

      const { readOpts } = this
      const { type, fn } = plugin
      const transform: any = fn(this.out)

      if (type === 'buffer') {
         ;(transform: TransformBufferFn)
         return readFile(filepath, readOpts)
            .then(transform)
            .then(data => {
               if (data && data.constructor === Buffer) {
                  return outputFile(this.outpath(), data).then(() =>
                     this.messageTranslate()
                  )
               } else {
                  return this.messageLeaveAs()
               }
            })
      } else if (type === 'stream') {
         ;(transform: TransformStreamFn)
         const outDir = this.out.dir
         if (!outDir) {
            throw new Error(`"dir" in outputObject`)
         } else {
            return ensureDir(resolve(outDir)).then(
               () =>
                  new Promise((resolve, reject) => {
                     const readable = createReadStream(filepath, readOpts)
                     readable.on('error', reject)

                     const writable = createWriteStream(this.outpath())
                     writable.on('error', reject)
                     writable.on('finish', () =>
                        resolve(this.messageTranslate())
                     )

                     const pipe = readable.pipe.bind(readable)
                     const utils = prepareUtils(readable, writable)
                     const result = transform(pipe, utils)

                     if (!result) {
                        resolve(this.messageLeaveAs())
                     } else if (
                        !result.pipe ||
                        typeof result.pipe !== 'function' ||
                        !('readable' in result)
                     ) {
                        readable.destroy(
                           new Error(`transform must return stream`)
                        )
                     } else {
                        result.pipe(writable)
                     }
                  })
            )
         }
      }
   }

   messageTranslate() {
      const { file, out, plugin } = this
      const which = plugin ? plugin.name : `copy`
      const normalizeFile = normalize(file)
      const normalizeOut = normalize(format(out))
      return `${which}: ${normalizeFile} => ${normalizeOut}`
   }

   messageLeaveAs() {
      const { file } = this
      const normalizeFile = normalize(file)
      return `leave: ${normalizeFile}`
   }
}

const readableMethods = [
   'on',
   'isPaused',
   'pause',
   'read',
   'resume',
   'setEncoding',
   'unpipe',
   'unshift',
   'wrap',
   'destroy'
]

const writableMethods = [
   'on',
   'cork',
   'end',
   'setDefaultEncoding',
   'uncork',
   'write',
   'destroy'
]

const prepareUtils = (readable, writable) => {
   const utils = {}

   readableMethods.forEach(name => {
      const utilName = `readable${upperOnlyFirst(name)}`
      utils[utilName] = readable[name]
   })

   writableMethods.forEach(name => {
      const utilName = `writable${upperOnlyFirst(name)}`
      utils[utilName] = writable[name]
   })

   return utils
}

const upperOnlyFirst = string => `${string[0].toUpperCase()}${string.slice(1)}`
