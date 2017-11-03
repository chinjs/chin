# chin
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/kthjm/chin.svg)](https://travis-ci.org/kthjm/chin)
[![Coverage Status](https://coveralls.io/repos/github/kthjm/chin/badge.svg)](https://coveralls.io/github/kthjm/chin)

> In Japan, using a microwave oven is called "chin" because the completion sound was heard like that.

Run task by unit the directory.
DIY Transform by using raw package.

## Installation
```shell
yarn add -D chin
```
## Usage

```shel
Usage: chin [options] [choose]


  Options:

    -V, --version        output the version number
    -c, --config <path>  default: chin.config.json || package.json
    -p, --preset <path>  default: chin.preset.js
    -v, --verbose
    -h, --help           output usage information
```

```json
{
    "default": {
        "put": "",
        "out": "",
        "process": {
            "ext": "bufferPlugin",
            "ext": ["bufferPlugin", "encoding"],
            "ext": ["bufferPlugin", {"encoding": "encoding", "flag": "r"}],

            "ext": ["bufferPlugin", "encoding", 0],
            "ext": ["streamPlugin", "encoding", 1],

            "ext": ["bufferPlugin", "encoding", false],
            "ext": ["streamPlugin", "encoding", true],

            "ext": ["bufferPlugin", "encoding", "buffer"],
            "ext": ["streamPlugin", "encoding", "stream"]
        },
        "weirs": [],
        "ignore": {
            "exts": [],
            "targets": [],
            "compare": []
        }
    },
    "sub": {
        "put": "",
        "out": ""
    }
}
```
```shell
chin
chin sub
```

## API

### config

default: `package.json.chin` || `chin.config.json`

#### put
#### out
#### process
##### ext
#### weirs
#### ignore
##### exts
##### targets
##### compare

### plugin
```javascript
const plugin = (opts) => {
    opts.name = `rename`
    opts.ext = `.other`
    return transform
}
```
#### `buffer`
```javascript
const transformBuffer = (data: Buffer) => {
    const result = transorm(data)
    return result
}
```
#### `stream`
```javascript
const transormStream = (readablePipe, utils) => {
    utils.writableOn(`finish`, () => {})
    return readablePipe(transform)
}
```
##### utils
[`${'readable' | 'writable'}${Name}`](https://nodejs.org/api/stream.html)

e.g. `writableOn`

<!-- - readableOn
- readableIsPaused,
- readablePause,
- readableRead,
- readableResume,
- readableSetEncoding,
- readableUnpipe,
- readableUnshift,
- readableWrap,
- readableDestroy,
- writableOn,
- writableCork,
- writableEnd,
- writableSetDefaultEncoding,
- writableUncork,
- writableWrite,
- writableDestroy -->

## License
MIT (http://opensource.org/licenses/MIT)
