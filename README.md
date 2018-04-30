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
  clean?: boolean,
  quiet?: boolean,
  ignored?: Matcher[],
  watch?: ChokidarOpts,
  processors?: Processors | [dirpath, Processors][],
  before: Function,
  after: Function
}
```

#### `put/out: dirpath`
directory path. `put => out`

#### `clean: boolean`
[remove](https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove.md) `config.out` before process.

#### `quiet: boolean`
Whether log or not.

#### `ignored: Matcher[]`
`Matcher` is used for [minimatch](https://github.com/isaacs/minimatch) and [anymatch](https://github.com/micromatch/anymatch).

#### `watch: {}`
[chokidar](https://github.com/paulmillr/chokidar)'s options. If `config.watch.ignored` is void, `config.ignored` used.

#### `before/after: Function`
Hook function.

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
Able to edit outpath like `[outpath, result] | [outpath, result][]`.

#### `util: {}`
- `on`: `"finish"` is emitted after write.
- `out`: [parsed](https://nodejs.org/api/path.html#path_path_parse_path) default outpath.

`config.processors` can be set as array. file is matched by `processors.find()`, so the index used as priority. A file that is not matched is just copied.
```js
export default {
  put: 'assets',
  out: 'public',
  processors: [
    ['dir1', { [ext]: {} }], // assets/dir1/** => public/dir1/**
    ['dir2', { [ext]: {} }], // assets/dir2/** => public/dir2/**
    ['/', { [ext]: {} }] // assets/** => public/**
  ]
}
```
## Plugin
Example:
```js
export default (opts) => {
  const processor = (data, util) => {}
  const before = () => {}
  const after = () => {}
  return { processor, after, before }
}
```
```js
import pluginWithHook from './plugin'

const { processor, before, after } = pluginWithHook({})

export default {
  processors: { [ext]: { processor } },
  before: () => before(),
  after: () => after()
}
```

## License
MIT (http://opensource.org/licenses/MIT)
