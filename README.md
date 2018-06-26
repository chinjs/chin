# chin

[![npm](https://img.shields.io/npm/v/chin.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/chin)
[![npm](https://img.shields.io/npm/dm/chin.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/chin)
[![Build Status](https://img.shields.io/travis/chinjs/chin.svg?longCache=true&style=flat-square)](https://travis-ci.org/chinjs/chin)
[![Coverage Status](https://img.shields.io/codecov/c/github/chinjs/chin.svg?longCache=true&style=flat-square)](https://codecov.io/github/chinjs/chin)

<!-- ![](https://i.gyazo.com/b3ed81be202ee18b88f2e5058135f6dd.jpg)
> To use a microwave is called "chin" in Japan because the completion sound was heard like that.😺 -->

Let's build files by writing plugin easily.

## Installation
```shell
yarn add -D chin
```
## CLI
```shell

  Usage: chin [options] [command]

  Options:

    -c, --config [path]     [default: chin.config.js || .chin/index.js]
    -i, --put <path>        [default: assets]
    -o, --out <path>        [default: public]
    -r, --require <name..>  splited by ","
    --clean                 remove "out" before
    -q, --quiet
    -v, --version           output the version number
    -h, --help              output usage information

  Commands:

    watch [options]

  Example:

    chin -c -r babel-register,dotenv/config

```
## Config
```js
const config = {

  /* core */
  put: dirpath,
  out: dirpath,
  ignored?: Matcher[],
  processors?: processors | [path, processors][],

  /* optional */
  clean?: boolean,
  quiet?: boolean,

  /* hooks */
  before?: Function,
  after?: Function,

  /* used in `watch` */
  watch?: ChokidarOpts

}

export default config | config[]
```

#### `put/out: dirpath`
directory path. (`put => out`)

#### `ignored: Matcher[]`
Used for [recursive-readdir](https://github.com/jergason/recursive-readdir) (and [chokidar](https://github.com/paulmillr/chokidar)).

#### `clean: boolean`
[remove](https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove.md) `config.out` before process.

#### `quiet: boolean`
Whether log or not.

#### `before/after: Function`
Hook function.

#### `watch: {}`
[chokidar](https://github.com/paulmillr/chokidar)'s options. If `config.watch.ignored` is void, `config.ignored` used.

### `processors: {[ext]}`
```js
type Processors = {
  [extension]: {
    isStream?: boolean,
    options?: ReadFileOpts | CreateReadStreamOpts,
    processor?: processor | streamProcessor
  }
}
```
`.` is unnecessary at `[extension]` (not `.txt` but `txt`). Files that match no processor will be just copied.

`isStream` switches read-file function that `options` belongs.
- [`readFile`](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
- [`createReadStream`](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

So `processor` has two type. The outpath can be edited like `[outpath, result]` or `[outpath, result][]`.

```js
const processor = (data, util) =>
  dataTransformed |
  [outpath, dataTransformed] |
  [outpath, dataTransformed][]

const streamProcessor = (pipe, util) =>
  pipe(streamDuplex) |
  [outpath, pipe(streamDuplex)] |
  [outpath, pipe(streamDuplex)][]
```
#### `util: {}`
- `on`: `"finish"` is emitted after write.
- `out`: [parsed](https://nodejs.org/api/path.html#path_path_parse_path) default outpath.

### Array in Config

Both `config` and `config.processors` can set as array.

In `config.processors` that set as `[path, processors][]`, Files are matched by `config.processors.find()`, so the index used as priority, and not be fallbacked.

```js
export default [
  {
    put: 'assets',
    out: 'public',
    processors: [
      ['dir1/dir2', { [ext]: {} }], // assets/dir1/dir2/** => public/dir1/dir2/**
      ['dir1/file1.ext', { [ext]: {} }], // assets/dir1/file1.ext => public/dir1/file1.ext
      ['dir1/', { [ext]: {} }], // assets/dir1/** => public/dir1/**
      ['*', { [ext]: {} }] // assets/** => public/**
    ]
  },
  {..},
  {..}
]
```

## Plugin
Example:
```js
export const plugin = (opts) => {
  const isStream = true
  const options = {}
  const processor = (pipe, util) => {}
  return { isStream, options, processor }
}

export const pluginWithHook = (opts) => {
  const isStream = false
  const options = {}
  const processor = (data, util) => {}

  const before = () => {}
  const after = () => {}

  return { isStream, options, processor, before, after }
}
```
```js
import { plugin, pluginWithHook } from './plugins'

const ext = plugin()
const extWithHook = pluginWithHook()

export default {
  processors: {
    [ext_0]: ext,
    [ext_1]: extWithHook
  },
  before: () => extWithHook.before(),
  after: () => extWithHook.after()
}
```

## License
MIT (http://opensource.org/licenses/MIT)
