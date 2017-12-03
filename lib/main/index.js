'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})

var _path = require('path')

var _extract = require('./extract.js')

var _extract2 = _interopRequireDefault(_extract)

var _transform = require('./transform.js')

var _transform2 = _interopRequireDefault(_transform)

var _utils = require('./utils.js')

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}

exports.default = (put, out, opts = {}, preset) =>
  Promise.resolve().then(() => {
    ;(0, _utils.throwIf)(put, 'string', 'put')
    ;(0, _utils.throwIf)(out, 'string', 'out')
    put = (0, _path.normalize)(put)
    out = (0, _path.normalize)(out)
    return (0, _extract2.default)(put, opts.ignore).then(files =>
      (0, _transform2.default)(
        put,
        out,
        files,
        opts.process,
        opts.weirs,
        preset
      )
    )
  })
