// @flow
import { normalize } from 'path'
import extract, { type Opts$Extract } from './extract.js'
import transform, { type Weirs } from './transform.js'
import { throwIf } from './utils.js'
import type Content, { Preset, Exts } from './Content.js'

export default (
   put: string,
   out: string,
   preset?: Preset,
   opts: {
      exts?: Exts,
      weirs?: Weirs,
      ignore?: Opts$Extract
   } = {}
): Promise<Array<Content>> =>
   Promise.resolve().then(() => {
      throwIf(put, 'string', 'put')
      throwIf(out, 'string', 'out')
      put = normalize(put)
      out = normalize(out)
      return extract(put, opts.ignore).then(files =>
         transform(put, out, preset, files, opts.exts, opts.weirs)
      )
   })
