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
import type {
  Path,
  ReadFileOpts,
  CreateReadStreamOpts,
  ProcessorFn,
  StreamProcessorFn
} from './types.js'

const isString = (data) => typeof data === 'string'
const isProcessResult = (data) => Buffer.isBuffer(data) || isString(data)
const isStreamResult = (data) => data && typeof data.pipe === 'function'

export default ({ filepath, outpath, isStream, options, processor }: {
  filepath: Path,
  outpath: Path,
  isStream: boolean,
  options: any,
  processor: any
}): Promise<void | string> => {

  filepath = path.resolve(filepath)
  outpath = path.resolve(outpath)

  const ee = new EventEmitter()
  const on = (...arg) => ee.on(...arg)

  let message
  const msg = (_message) => message = _message

  let process_promise

  if (!processor) {
    process_promise = copy(filepath, outpath)
  } else if (!isStream) {
    ;(processor: ProcessorFn)
    ;(options: ReadFileOpts)
    process_promise = bufferProcess({ filepath, options, processor, on, msg, outpath })
  } else {
    ;(processor: StreamProcessorFn)
    ;(options: CreateReadStreamOpts)
    process_promise = streamProcess({ filepath, options, processor, on, msg, outpath })
  }

  return process_promise
  .then(() => ee.emit('finish'))
  .then(() => message)
}

const parseExBase = (pathstring) => {
  const { root, dir, name, ext } = path.parse(pathstring)
  return { root, dir, name, ext }
}

const bufferProcess = ({ filepath, options, processor, on, msg, outpath }) => {
  const readedFile: any = readFile(filepath, options)
  ;(readedFile: Promise<string | Buffer>)
  return readedFile
  .then(data => processor(data, { on, msg, out: parseExBase(outpath) }))
  .then(result => createArgs(result, outpath, isProcessResult))
  .then(args =>
    Array.isArray(args) &&
    Promise.all(args.map(arg => outputFile(...arg)))
  )
}

const streamProcess = ({ filepath, options, processor, on, msg, outpath }) =>
  new Promise((resolve, reject) => {

    const readable = createReadStream(filepath, options)
    readable.on('error', reject)

    Promise.resolve()
    .then(() =>
      processor(
        (...arg) => readable.pipe(...arg),
        { on, msg, out: parseExBase(outpath) }
      )
    )
    .then(result => createArgs(result, outpath, isStreamResult))
    .then(args =>
      Array.isArray(args) &&
      Promise.all(args.map(([outpath,stream]) => {
        stream.on('error', reject)
        return ensureDir(path.resolve(path.dirname(outpath))).then(() =>
          new Promise(resolve => {
            const writable = createWriteStream(outpath)
            writable.on('error', reject)
            writable.on('finish', resolve)
            stream.pipe(writable)
          })
        )
      }))
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