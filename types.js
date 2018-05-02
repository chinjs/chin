// @flow

export type Path = string

export type Config = {
  put: Path,
  out: Path,
  clean?: boolean,
  verbose?: boolean,
  ignored?: Ignored,
  watch?: ChokidarOpts,
  processors?: Processors | [Path, Processors][]
}

export type Ignored = Matcher[]
export type Matcher = string

export type ChokidarOpts = { [name: string]: any }

export type Extension = string

export type Processors = {
  [Extension]: {
    isStream?: boolean,
    options?: ReadFileOpts | CreateReadStreamOpts,
    processor?: ProcessorFn | StreamProcessorFn
  }
}

export type ReadFileOpts = {
  encoding?: string | null,
  flag?: string
}

export type CreateReadStreamOpts = {
  encoding?: string | null,
  flags?: string,
  fd?: number | null,
  mode?: number,
  autoClose?: boolean,
  start?: number,
  end?: number,
  highWaterMark?: number
}

export type FileData = Buffer | string
export type ProcessorFn = (data: FileData, util: Util) => ProcessorResult | Promise<ProcessorResult>
export type ProcessorResult = FileData | [Path, FileData] | [Path, FileData][]

export type PipeData = stream$Duplex | stream$Writable
export type PipeFn = (dest: PipeData) => PipeData
export type StreamProcessorFn = (pipe: PipeFn, util: Util) => StreamProcessorResult | Promise<StreamProcessorResult>
export type StreamProcessorResult = PipeData | [Path, PipeData] | [Path, PipeData][]

export type EventName = 'finish'
export type OnFn = (event: EventName, callback: Function) => events$EventEmitter

export type Out = {
  root: string,
  dir: string,
  name: string,
  ext: string
}

export type Util = { on: OnFn, out: Out }

export type EggObj = {
  filepath: Path,
  outpath: Path,
  isStream: boolean,
  options?: ReadFileOpts | CreateReadStreamOpts,
  processor?: ProcessorFn | StreamProcessorFn
}

export type F2TFn = (filepath: Path) => [Path, EggObj]

export type Watcher = any