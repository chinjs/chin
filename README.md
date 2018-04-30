# chin

[![npm](https://img.shields.io/npm/v/chin.svg?style=flat-square)](https://www.npmjs.com/package/chin)
[![npm](https://img.shields.io/npm/dm/chin.svg?style=flat-square)](https://www.npmjs.com/package/chin)
[![Build Status](https://img.shields.io/travis/kthjm/chin.svg?style=flat-square)](https://travis-ci.org/kthjm/chin)
[![Coverage Status](https://img.shields.io/codecov/c/github/kthjm/chin.svg?style=flat-square)](https://codecov.io/github/kthjm/chin)

![](https://i.gyazo.com/b3ed81be202ee18b88f2e5058135f6dd.jpg)
> To use a microwave is called "chin" in Japan because the completion sound was heard like that.

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
export default {
  put: dirpath,
  out: dirpath,
  processors?: Processors | [dirpath, Processors][],
  before?: Function,
  after?: Function,
  clean?: boolean,
  quiet?: boolean,
  ignored?: Matcher[],
  watch?: ChokidarOpts
}
```

#### `put/out: dirpath`
directory path. `put => out`

#### `before/after: Function`
Hook function.

#### `clean: boolean`
[remove](https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove.md) `config.out` before process.

#### `quiet: boolean`
Whether log or not.

#### `ignored: Matcher[]`
Used for [recursive-readdir](https://github.com/jergason/recursive-readdir) (and [chokidar](https://github.com/paulmillr/chokidar)).

#### `watch: {}`
[chokidar](https://github.com/paulmillr/chokidar)'s options. If `config.watch.ignored` is void, `config.ignored` used.

### `processors: Processors | [dirpath, Processors][]`
```js
type Processors = {
  [extension]: {
    isStream?: boolean,
    options?: ReadFileOpts | CreateReadStreamOpts,
    processor?: processor | streamProcessor
  }
}
```
`isStream` switches read-file function that `options` belongs.
- [`readFile`](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
- [`createReadStream`](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

`processor` is passed the result.
```js
const processor = (data, util) => dataTransformed
const streamProcessor = (pipe, util) => pipe(streamDuplex)
```
Able to edit outpath like `[outpath, result]` or `[outpath, result][]`.

#### `util: {}`
- `on`: `"finish"` is emitted after write.
- `out`: [parsed](https://nodejs.org/api/path.html#path_path_parse_path) default outpath.

`config.processors` can be set as array. file is matched by `processors.find()`, so the index used as priority, and not be fallbacked. A file that match no processor will be just copied. 
```js
export default {
  put: 'assets',
  out: 'public',
  processors: [
    ['dir1/dir2', { [ext]: {} }], // assets/dir1/dir2/** => public/dir1/dir2/**
    ['dir1', { [ext]: {} }], // assets/dir1/** => public/dir1/**
    ['.', { [ext]: {} }] // assets/** => public/**
  ]
}
```
## Plugin
Example:
```js
export const plugin = (opts) => {
  return (data, util) => {}
}

export const pluginWithHook = (opts) => {
  const before = () => {}
  const after = () => {}
  const processor = (data, util) => {}
  return { before, after, processor }
}
```
```js
import { plugin, pluginWithHook } from './plugins'

const { before, after, processor } = pluginWithHook({})

export default {
  before: () => {
    before()
  },
  after: () => {
    after()
  },
  processors: {
    [ext1]: { processor: plugin({}) },
    [ext2]: { processor }
  }
}
```

## License
MIT (http://opensource.org/licenses/MIT)
