#!/usr/bin/env node
'use strict'

var _commander = require('commander')

var _commander2 = _interopRequireDefault(_commander)

var _cli = require('./cli.js')

var _cli2 = _interopRequireDefault(_cli)

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

_commander2.default.version(require('../package.json').version)

_commander2.default
  .arguments(`[choose]`)
  .option(`-c, --config <path>`, `default: chin.config.json || package.json`)
  .option(`-p, --preset <path>`, `default: chin.preset.js`)
  //  .option(`-r, --require <package>`)
  .option(`-v, --verbose`)

_commander2.default.parse(process.argv)

// if (program.require) {
//    program.require.split(',').forEach(moduleName => require(moduleName))
// }

;(0, _cli2.default)(_commander2.default.args[0], {
  config: _commander2.default.config,
  preset: _commander2.default.preset,
  verbose: _commander2.default.verbose
})
