'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var assert = _interopDefault(require('assert'))
var figures = _interopDefault(require('figures'))
var recursiveReaddir = _interopDefault(require('recursive-readdir'))
var EventEmitter = _interopDefault(require('events'))
var chokidar = _interopDefault(require('chokidar'))
var chalk = _interopDefault(require('chalk'))
var fsExtra = require('fs-extra')
var path = require('path')
var path__default = _interopDefault(path)

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg)
    var value = info.value
  } catch (error) {
    reject(error)
    return
  }

  if (info.done) {
    resolve(value)
  } else {
    Promise.resolve(value).then(_next, _throw)
  }
}

function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args)

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value)
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err)
      }

      _next(undefined)
    })
  }
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
  )
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr
}

function _iterableToArrayLimit(arr, i) {
  var _arr = []
  var _n = true
  var _d = false
  var _e = undefined

  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value)

      if (i && _arr.length === i) break
    }
  } catch (err) {
    _d = true
    _e = err
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']()
    } finally {
      if (_d) throw _e
    }
  }

  return _arr
}

function _nonIterableRest() {
  throw new TypeError('Invalid attempt to destructure non-iterable instance')
}

//

const CWD_PATHS = ['.', './'].map(path.normalize)
const PUT_EXPRESSION = ['/', '.', './', '*']
var prepare = (put, out, processors, ignored) => {
  let map, f2t

  if (!Array.isArray(processors)) {
    map = new Map([[put, []]])

    f2t = filepath => {
      return [put, createEgg(filepath, put, out, processors)]
    }
  } else {
    const pairs = createPairs(put, processors)
    map = new Map(pairs.map(([dirpath]) => [dirpath, []]))

    f2t = filepath => {
      const _pairs$find = pairs.find(([dirpath]) => filepath.includes(dirpath)),
        _pairs$find2 = _slicedToArray(_pairs$find, 2),
        dirpath = _pairs$find2[0],
        processors = _pairs$find2[1]

      return [dirpath, createEgg(filepath, put, out, processors)]
    }
  }

  return recursiveSettingMap(put, ignored, f2t, map).then(() => ({
    map,
    f2t
  }))
}

const createPairs = (put, processorsAsArray) => {
  const pairs = processorsAsArray.map(([dirpath, processors]) => [
    PUT_EXPRESSION.includes(dirpath) ? put : path.join(put, dirpath),
    processors
  ])
  if (!pairs.some(([dirpath]) => dirpath === put)) pairs.push([put, {}])
  return pairs
}

const recursiveSettingMap = (put, ignored, f2t, map) =>
  recursiveReaddir(put, ignored).then(filepaths =>
    filepaths.map(f2t).forEach(([dirpath, egg]) => {
      const eggs = map.get(dirpath)
      eggs.push(egg)
    })
  )

const createEgg = (filepath, put, out, processors = {}) =>
  Egg(
    filepath,
    path.join(out, CWD_PATHS.includes(put) ? filepath : filepath.split(put)[1]),
    processors[path.extname(filepath).slice(1)] || {}
  )

const Egg = (filepath, outpath, { isStream = false, processor, options }) => ({
  filepath,
  outpath,
  isStream,
  processor,
  options
})

//

const isString = data => typeof data === 'string'

const isProcessResult = data => Buffer.isBuffer(data) || isString(data)

const isStreamResult = data => data && typeof data.pipe === 'function'

var zap = ({ filepath, outpath, isStream, options, processor }) => {
  filepath = path__default.resolve(filepath)
  outpath = path__default.resolve(outpath)
  const ee = new EventEmitter()

  const on = (...arg) => ee.on(...arg)

  let message

  const msg = _message => (message = _message)

  let process_promise

  if (!processor) {
    process_promise = fsExtra.copy(filepath, outpath)
  } else if (!isStream) {
    process_promise = bufferProcess({
      filepath,
      options,
      processor,
      on,
      msg,
      outpath
    })
  } else {
    process_promise = streamProcess({
      filepath,
      options,
      processor,
      on,
      msg,
      outpath
    })
  }

  return process_promise.then(() => ee.emit('finish')).then(() => message)
}

const parseExBase = pathstring => {
  const _path$parse = path__default.parse(pathstring),
    root = _path$parse.root,
    dir = _path$parse.dir,
    name = _path$parse.name,
    ext = _path$parse.ext

  return {
    root,
    dir,
    name,
    ext
  }
}

const bufferProcess = ({ filepath, options, processor, on, msg, outpath }) =>
  fsExtra
    .readFile(filepath, options)
    .then(data =>
      processor(data, {
        on,
        msg,
        out: parseExBase(outpath)
      })
    )
    .then(result => createArgs(result, outpath, isProcessResult))
    .then(
      args =>
        Array.isArray(args) &&
        Promise.all(args.map(arg => fsExtra.outputFile(...arg)))
    )

const streamProcess = ({ filepath, options, processor, on, msg, outpath }) =>
  new Promise((resolve, reject) => {
    const readable = fsExtra.createReadStream(filepath, options)
    readable.on('error', reject)
    Promise.resolve()
      .then(() =>
        processor((...arg) => readable.pipe(...arg), {
          on,
          msg,
          out: parseExBase(outpath)
        })
      )
      .then(result => createArgs(result, outpath, isStreamResult))
      .then(
        args =>
          Array.isArray(args) &&
          Promise.all(
            args.map(([outpath, stream]) => {
              stream.on('error', reject)
              return fsExtra
                .ensureDir(
                  path__default.resolve(path__default.dirname(outpath))
                )
                .then(
                  () =>
                    new Promise(resolve => {
                      const writable = fsExtra.createWriteStream(outpath)
                      writable.on('error', reject)
                      writable.on('finish', resolve)
                      stream.pipe(writable)
                    })
                )
            })
          )
      )
      .then(resolve)
  })

const createArgs = (result, outpath, isProcessed) =>
  isProcessed(result)
    ? [[outpath, result]]
    : !Array.isArray(result)
    ? false
    : isString(result[0]) && isProcessed(result[1])
    ? [result]
    : result.filter(
        arg => Array.isArray(arg) && isString(arg[0]) && isProcessed(arg[1])
      )

var watchprocess = ({ map, f2t, put, out, watchOpts, ignored, verbose }) => {
  const watcher = chokidar.watch(
    put,
    Object.assign(
      {
        ignored,
        ignorePermissionErrors: true
      },
      watchOpts
    )
  )

  const errorHandler = err => {
    console.error(err)
    watcher.close()
  }

  const opts = {
    map,
    f2t,
    put,
    out,
    ignored,
    verbose
  }
  watcher.on('error', errorHandler)
  watcher.on(
    'ready',
    () =>
      verbose &&
      console.log(chalk.cyan('[start]') + ' ' + chalk.gray(put + ' => ' + out))
  )
  watcher.on('add', filepath => {
    const eggs = map.get(findKey(map, filepath))
    return (
      !eggs.some(egg => egg.filepath === filepath) &&
      onAdd(filepath, opts).catch(errorHandler)
    )
  })
  watcher.on('change', filepath => onChange(filepath, opts).catch(errorHandler))
  watcher.on('unlink', filepath => onUnlink(filepath, opts).catch(errorHandler))
  watcher.on('unlinkDir', dirpath =>
    onUnlinkDir(path.resolve(dirpath), opts).catch(errorHandler)
  )
  return watcher
}

const a2r = absolutePath =>
  path.join('./', absolutePath.split(path.resolve())[1])

const findKey = (map, longerPath) =>
  []
    .concat([...map.keys()])
    .filter(dirpath => longerPath.includes(dirpath))
    .map(dirpath => dirpath.split(path.sep))
    .sort((p, c) => (p.length > c.length ? -1 : p.length < c.length ? 1 : 0))[0]
    .join(path.sep)

const onAdd =
  /*#__PURE__*/
  (function() {
    var _ref = _asyncToGenerator(function*(filepath, { f2t, map, verbose }) {
      const _f2t = f2t(filepath),
        _f2t2 = _slicedToArray(_f2t, 2),
        dirpath = _f2t2[0],
        egg = _f2t2[1]

      const eggs = map.get(dirpath)
      eggs.push(egg)
      yield zap(egg)
      return (
        verbose &&
        console.log(
          chalk.green('[added]') +
            ' ' +
            chalk.gray(filepath + ' => ' + egg.outpath)
        )
      )
    })

    return function onAdd(_x, _x2) {
      return _ref.apply(this, arguments)
    }
  })()

const onChange =
  /*#__PURE__*/
  (function() {
    var _ref2 = _asyncToGenerator(function*(filepath, { map, verbose }) {
      const eggs = map.get(findKey(map, filepath))
      const egg = eggs.find(egg => egg.filepath === filepath)
      return (
        egg &&
        zap(egg).then(
          () =>
            verbose &&
            console.log(
              chalk.yellow('[changed]') +
                ' ' +
                chalk.gray(filepath + ' => ' + egg.outpath)
            )
        )
      )
    })

    return function onChange(_x3, _x4) {
      return _ref2.apply(this, arguments)
    }
  })()

const onUnlink =
  /*#__PURE__*/
  (function() {
    var _ref3 = _asyncToGenerator(function*(filepath, { map, verbose }) {
      const eggs = map.get(findKey(map, filepath))
      const spliceIndex = eggs.findIndex(egg => egg.filepath === filepath)
      if (spliceIndex === -1) return
      const outpath = eggs.splice(spliceIndex, 1)[0].outpath
      yield fsExtra.remove(path.resolve(outpath))
      return (
        verbose &&
        console.log(
          chalk.red('[unlinked]') +
            ' ' +
            chalk.gray(filepath + ' => ' + outpath)
        )
      )
    })

    return function onUnlink(_x5, _x6) {
      return _ref3.apply(this, arguments)
    }
  })()

const onUnlinkDir = (dirpath, { map, put, out, verbose }) =>
  Promise.all(
    []
      .concat(
        ...[...map.values()].map(eggs => recursiveRemoveEgg(eggs, dirpath))
      )
      .map(({ filepath, outpath }) =>
        fsExtra
          .remove(path.resolve(outpath))
          .then(
            () =>
              verbose &&
              console.log(
                chalk.red('[unlinked]') +
                  ' ' +
                  chalk.gray(filepath + ' => ' + outpath)
              )
          )
      )
  )
    .then(() => dirpath.split(put).join(out))
    .then(outpath =>
      fsExtra
        .remove(outpath)
        .then(
          () =>
            verbose &&
            console.log(
              chalk.red('[unlinked]') +
                ' ' +
                chalk.gray(a2r(dirpath) + ' => ' + a2r(outpath))
            )
        )
    )

const recursiveRemoveEgg = (eggs, dirpath, spliced = []) => {
  const spliceIndex = eggs.findIndex(({ filepath }) =>
    path.resolve(filepath).includes(dirpath)
  )
  return spliceIndex === -1
    ? spliced
    : recursiveRemoveEgg(
        eggs,
        dirpath,
        spliced.concat(eggs.splice(spliceIndex, 1))
      )
}

const BASE_COLOR = 'cyan'
const PRE_SUCC = chalk.green(figures.tick)
const PRE_FAIL = chalk.red(figures.cross)

const init = (config = {}) => {
  assert(config.put && typeof config.put === 'string', '')
  assert(config.out && typeof config.out === 'string', '')
  config.put = path.normalize(config.put)
  config.out = path.normalize(config.out)
  process.env.CHIN_PUT = config.put
  process.env.CHIN_OUT = config.out
  return config
}

const chin =
  /*#__PURE__*/
  (function() {
    var _ref = _asyncToGenerator(function*(config) {
      const _init = init(config),
        put = _init.put,
        out = _init.out,
        ignored = _init.ignored,
        processors = _init.processors,
        verbose = _init.verbose

      const _ref2 = yield prepare(put, out, processors, ignored),
        map = _ref2.map

      yield zapAll(map, verbose)
      return
    })

    return function chin(_x) {
      return _ref.apply(this, arguments)
    }
  })()

const watch =
  /*#__PURE__*/
  (function() {
    var _ref3 = _asyncToGenerator(function*(config) {
      const _init2 = init(config),
        put = _init2.put,
        out = _init2.out,
        ignored = _init2.ignored,
        processors = _init2.processors,
        verbose = _init2.verbose,
        watchOpts = _init2.watch

      const _ref4 = yield prepare(put, out, processors, ignored),
        map = _ref4.map,
        f2t = _ref4.f2t

      yield zapAll(map, verbose)
      const watcher = watchprocess({
        map,
        f2t,
        put,
        out,
        watchOpts,
        ignored,
        verbose
      })
      return watcher
    })

    return function watch(_x2) {
      return _ref3.apply(this, arguments)
    }
  })()

const zapAll = (map, verbose) =>
  !verbose ? zapAllQuiet(map) : zapAllVerbose(map)

const zapAllQuiet = map => Promise.all([].concat(...[...map.values()]).map(zap))

const zapAllVerbose = map =>
  recursiveZapDir(map.size === 1, [].concat([...map.entries()])).then(count =>
    console.log(chalk[BASE_COLOR](`${figures.pointer} ${count} files`))
  )

const recursiveZapDir =
  /*#__PURE__*/
  (function() {
    var _ref5 = _asyncToGenerator(function*(isOneDir, entries, count = 0) {
      const _entries$splice$ = _slicedToArray(entries.splice(0, 1)[0], 2),
        dirpath = _entries$splice$[0],
        eggs = _entries$splice$[1]

      if (eggs.length) {
        console.log(
          (isOneDir ? `` : `${dirpath}: `) +
            chalk[BASE_COLOR](`${eggs.length} files`)
        )
        let countByDir = 0
        yield Promise.all(
          eggs.map(egg =>
            zap(egg)
              .then(msg =>
                console.log(
                  `${PRE_SUCC} ${chalk.gray(
                    `${egg.filepath}${msg ? `: ${msg}` : ''}`
                  )}`
                )
              )
              .then(() => countByDir++)
              .catch(err =>
                console.log(
                  `${PRE_FAIL} ${chalk.gray(`${egg.filepath}: ${err.message}`)}`
                )
              )
          )
        )
        count += countByDir
      }

      return entries.length ? recursiveZapDir(isOneDir, entries, count) : count
    })

    return function recursiveZapDir(_x3, _x4) {
      return _ref5.apply(this, arguments)
    }
  })()

exports.chin = chin
exports.watch = watch
exports.default = chin
