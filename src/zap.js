// @flow
import path from 'path'
import EventEmitter from 'events'
import {
  copy,
  readFile,
  outputFile,
  ensureDir,
  createReadStream,
  createWriteStream
} from 'fs-extra'
import {
  type Path,
  type ReadFileOpts,
  type CreateReadStreamOpts,
  type ProcessorFn,
  type StreamProcessorFn
} from '../types.js'

const isString = (data) => typeof data === 'string'
const isProcessResult = (data) => Buffer.isBuffer(data) || isString(data)
const isStreamResult = (data) => data && typeof data.pipe === 'function'

export default ({ filepath, outpath, isStream, options, processor }: {
  filepath: Path,
  outpath: Path,
  isStream: boolean,
  options: any,
  processor: any
}): Promise<boolean> => {

  filepath = path.resolve(filepath)
  outpath = path.resolve(outpath)

  const ee = new EventEmitter()
  const on = (...arg) => ee.on(...arg)

  let process_promise

  if (!processor) {
    process_promise = copy(filepath, outpath)
  } else if (!isStream) {
    ;(processor: ProcessorFn)
    ;(options: ReadFileOpts)
    process_promise = bufferProcess({ filepath, options, processor, on, outpath })
  } else {
    ;(processor: StreamProcessorFn)
    ;(options: CreateReadStreamOpts)
    process_promise = streamProcess({ filepath, options, processor, on, outpath })
  }

  return process_promise.then(() => ee.emit('finish'))
}

const parseExBase = (pathstring) => {
  const { root, dir, name, ext } = path.parse(pathstring)
  return { root, dir, name, ext }
}

const bufferProcess = ({ filepath, options, processor, on, outpath }) =>
  readFile(filepath, options)
  .then(data => processor(data, { on, out: parseExBase(outpath) }))
  .then(result => createArgs(result, outpath, isProcessResult))
  .then(args =>
    Array.isArray(args) &&
    Promise.all(args.map(arg => outputFile(...arg)))
  )

const streamProcess = ({ filepath, options, processor, on, outpath }) =>
  new Promise((resolve, reject) => {

    const readable = createReadStream(filepath, options)
    readable.on('error', reject)

    Promise.resolve()
    .then(() =>
      processor(
        (...arg) => readable.pipe(...arg),
        { on, out: parseExBase(outpath) }
      )
    )
    .then(result => createArgs(result, outpath, isStreamResult))
    .then(args =>
      !Array.isArray(args) ? resolve() :
      Promise.all(
        args.map(([outpath,piped]) =>
          ensureDir(
            path.resolve(
              path.dirname(outpath)
            )
          )
          .then(() =>
            new Promise(resolve => {
              const writable = createWriteStream(outpath)
              writable.on('error', reject)
              writable.on('finish', resolve)
              piped.pipe(writable)
            })
          )
        )
      )
    )
    .then(resolve)
  })

const createArgs = (result, outpath, isProcessed) =>
  isProcessed(result)
    ? [ [outpath, result] ] :
  !Array.isArray(result)
    ? false :
  isString(result[0]) && isProcessed(result[1])
    ? [ result ]
    : result.filter(arg => Array.isArray(arg) && isString(arg[0]) && isProcessed(arg[1]))