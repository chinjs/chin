# chin

[![npm](https://img.shields.io/npm/v/chin.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/chin)
[![npm](https://img.shields.io/npm/dm/chin.svg?longCache=true&style=flat-square)](https://www.npmjs.com/package/chin)
[![Build Status](https://img.shields.io/travis/chinjs/chin.svg?longCache=true&style=flat-square)](https://travis-ci.org/chinjs/chin)
[![Coverage Status](https://img.shields.io/codecov/c/github/chinjs/chin.svg?longCache=true&style=flat-square)](https://codecov.io/github/chinjs/chin)

Simple build tool that matches and processes files with extension instead of regexp.

## Usage
```js
const imagemin = require('chin-plugin-imagemin')

const img2min = imagemin()

module.exports = {
  put: 'assets',
  out: 'public',
  processors: {
    png: img2min,
    jpg: img2min
  }
}
```
```shell
yarn add -D chin chin-plugin-imagemin
yarn chin -c
```

    package.json
    chin.config.js
    assets
    ├─ sitemap.xml
    |─ robots.txt
    └─ images
       ├─ foo.png
       └─ bar.jpg
    public
    ├─ sitemap.xml // copied
    |─ robots.txt  // copied
    └─ images
       ├─ foo.png  // optimized
       └─ bar.jpg  // optimized


## Config

It's called `chin.config.js` or `.chin/index.js` in the root directory of your project typically. You can export config as an array.

#### put/out
directory path. `put` => `out`

#### processors

plugins can be found  [here](https://yarnpkg.com/en/packages?q=%2A&p=1&keywords%5B0%5D=chin-plugin).

```js
const processors = { [ext]: plugin() }
```
`.` is unnecessary at `[ext]`. Unmatch files is not ignored but copied.

`processors` can be an array:
```js
const processors = [ path, { [ext]: plugin() } ][]
```
Files are matched by `processors.find()`, so the index express priority and not be fallbacked.

example:
```js
const processors = [
  ['dir1/file.ext', { ext }],  // [put]/dir1/file.ext => [out]/dir1/file.ext
  ['dir1/dir2', { ext }],      // [put]/dir1/dir2/**  => [out]/dir1/dir2/**
  ['dir1/', { ext }],          // [put]/dir1/**       => [out]/dir1/**
  ['*', { ext }]               // [put]/**            => [out]/**
]
```

#### ignored
`Matcher[]`. Passed to [recursive-readdir](https://github.com/jergason/recursive-readdir).

#### clean
`boolean`. [Remove](https://github.com/jprichardson/node-fs-extra/blob/master/docs/remove.md) `config.out` before process.

#### quiet
`boolean`. Whether log or not.

#### before/after
Hook function.

#### watch
`chin watch` use as [chokidar](https://github.com/paulmillr/chokidar) options. If `watch.ignored` is void, `ignored` fallbacked.

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

## Plugin

Plugin can also be written by yourself easily.

```js
type Plugin = (opts: any) => {
  isStream: boolean,
  options: ReadFileOpts | CreateReadStreamOpts,
  processor: processor | streamProcessor,
  [custom]: any
}
```
`isStream` switches the following read-file function.
- [`readFile`](https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback)
- [`createReadStream`](https://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)

So the type of both `processor` and `options` is determined by `isStream`.

In `processor`, the outpath can be edited like `[outpath, result]` or `[outpath, result][]`.

```js
const processor = (data, util) =>
  processed |
  [outpath, processed] |
  [outpath, processed][]

const streamProcessor = (pipe, util) =>
  pipe(stream) |
  [outpath, pipe(stream)] |
  [outpath, pipe(stream)][]
```

### util
#### out
[parsed](https://nodejs.org/api/path.html#path_path_parse_path) outpath without `base` for assignable.
```js
const { format } = require('path')
const outpath = format(Object.assign(util.out, { ext: '.other' }))
```

#### on
`"finish"` is emitted after write.

## License
MIT (http://opensource.org/licenses/MIT)
