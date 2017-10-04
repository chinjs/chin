# chin
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/kthjm/chin.svg)](https://travis-ci.org/kthjm/chin)
[![Coverage Status](https://coveralls.io/repos/github/kthjm/chin/badge.svg)](https://coveralls.io/github/kthjm/chin)
> In Japan, using a microwave oven is called "chin" because the completion sound was heard like that.

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
## API
```json
{
    "default": {
        "put": "",
        "out": "",
        "exts": {},
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
## License
MIT (http://opensource.org/licenses/MIT)
