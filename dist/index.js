'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var path = require('path')
var path__default = _interopDefault(path)
var EventEmitter = _interopDefault(require('events'))
var fsExtra = require('fs-extra')
var chokidar = _interopDefault(require('chokidar'))
var chalk = _interopDefault(require('chalk'))
var assert = _interopDefault(require('assert'))
var recursiveReaddir = _interopDefault(require('recursive-readdir'))
var ora = _interopDefault(require('ora'))
var figures = _interopDefault(require('figures'))

//

//

var prepare = (put, out, processors) => {
  if (!Array.isArray(processors)) {
    return [
      new Map([[put, []]]),
      filepath => createPair(filepath, put, out, put, processors)
    ]
  }

  const processorsEntries = processors.map(([dirpath, _processors]) => [
    dirpath === '/' || dirpath === './' ? put : path.join(put, dirpath),
    _processors
  ])

  return [
    new Map(
      [[put, []]].concat(processorsEntries.map(([dirpath]) => [dirpath, []]))
    ),
    filepath =>
      createPair(
        filepath,
        put,
        out,
        ...(processorsEntries.find(([path$$1]) =>
          filepath.includes(path$$1)
        ) || [put])
      )
  ]
}

const createPair = (filepath, put, out, dirpath, processors = {}) => [
  dirpath,
  Egg(
    filepath,
    path.join(out, filepath.split(put)[1]),
    processors[path.extname(filepath).slice(1)]
  )
]

const Egg = (
  filepath,
  outpath,
  { isStream = false, processor, options } = {}
) => ({
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

  let process_promise

  if (!processor) {
    process_promise = fsExtra.copy(filepath, outpath)
  } else if (!isStream) {
    process_promise = bufferProcess({
      filepath,
      options,
      processor,
      on,
      outpath
    })
  } else {
    process_promise = streamProcess({
      filepath,
      options,
      processor,
      on,
      outpath
    })
  }

  return process_promise.then(() => ee.emit('finish'))
}

const parseExBase = pathstring => {
  var _path$parse = path__default.parse(pathstring)

  const root = _path$parse.root,
    dir = _path$parse.dir,
    name = _path$parse.name,
    ext = _path$parse.ext

  return { root, dir, name, ext }
}

const bufferProcess = ({ filepath, options, processor, on, outpath }) =>
  fsExtra
    .readFile(filepath, options)
    .then(data => processor(data, { on, out: parseExBase(outpath) }))
    .then(result => createArgs(result, outpath, isProcessResult))
    .then(
      args =>
        Array.isArray(args) &&
        Promise.all(args.map(arg => fsExtra.outputFile(...arg)))
    )

const streamProcess = ({ filepath, options, processor, on, outpath }) =>
  new Promise((resolve, reject) => {
    const readable = fsExtra.createReadStream(filepath, options)
    readable.on('error', reject)

    Promise.resolve()
      .then(() =>
        processor((...arg) => readable.pipe(...arg), {
          on,
          out: parseExBase(outpath)
        })
      )
      .then(result => createArgs(result, outpath, isStreamResult))
      .then(
        args =>
          !Array.isArray(args)
            ? resolve()
            : Promise.all(
                args.map(([outpath, piped]) =>
                  fsExtra
                    .ensureDir(
                      path__default.resolve(path__default.dirname(outpath))
                    )
                    .then(
                      () =>
                        new Promise(resolve => {
                          const writable = fsExtra.createWriteStream(outpath)
                          writable.on('error', reject)
                          writable.on('finish', resolve)
                          piped.pipe(writable)
                        })
                    )
                )
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

var asyncToGenerator = function(fn) {
  return function() {
    var gen = fn.apply(this, arguments)
    return new Promise(function(resolve, reject) {
      function step(key, arg) {
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
          return Promise.resolve(value).then(
            function(value) {
              step('next', value)
            },
            function(err) {
              step('throw', err)
            }
          )
        }
      }

      return step('next')
    })
  }
}

var slicedToArray = (function() {
  function sliceIterator(arr, i) {
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
        if (!_n && _i['return']) _i['return']()
      } finally {
        if (_d) throw _e
      }
    }

    return _arr
  }

  return function(arr, i) {
    if (Array.isArray(arr)) {
      return arr
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i)
    } else {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance'
      )
    }
  }
})()

//

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

  const opts = { map, f2t, put, out, ignored, verbose }

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

const onAdd = (() => {
  var _ref = asyncToGenerator(function*(filepath, { f2t, map, verbose }) {
    var _f2t = f2t(filepath),
      _f2t2 = slicedToArray(_f2t, 2)

    const dirpath = _f2t2[0],
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

const onChange = (() => {
  var _ref2 = asyncToGenerator(function*(filepath, { map, verbose }) {
    const eggs = map.get(findKey(map, filepath))
    const egg = eggs.find(function(egg) {
      return egg.filepath === filepath
    })

    return (
      egg &&
      zap(egg).then(function() {
        return (
          verbose &&
          console.log(
            chalk.yellow('[changed]') +
              ' ' +
              chalk.gray(filepath + ' => ' + egg.outpath)
          )
        )
      })
    )
  })

  return function onChange(_x3, _x4) {
    return _ref2.apply(this, arguments)
  }
})()

const onUnlink = (() => {
  var _ref3 = asyncToGenerator(function*(filepath, { map, verbose }) {
    const eggs = map.get(findKey(map, filepath))
    const spliceIndex = eggs.findIndex(function(egg) {
      return egg.filepath === filepath
    })

    if (spliceIndex === -1) return

    const outpath = eggs.splice(spliceIndex, 1)[0].outpath

    yield fsExtra.remove(path.resolve(outpath))
    return (
      verbose &&
      console.log(
        chalk.red('[unlinked]') + ' ' + chalk.gray(filepath + ' => ' + outpath)
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

//

const BASE_COLOR = 'yellow'

const init = (config = {}) => {
  assert(config.put && typeof config.put === 'string', '')
  assert(config.out && typeof config.out === 'string', '')
  config.put = path.join('./', config.put)
  config.out = path.join('./', config.out)
  return config
}

const pushToMap = (map, f2t, ...arg) =>
  recursiveReaddir(...arg)
    .then(filepaths =>
      filepaths.map(f2t).forEach(([dirpath, egg]) => {
        const eggs = map.get(dirpath)
        eggs.push(egg)
      })
    )
    .then(() => map)

const chin = (() => {
  var _ref = asyncToGenerator(function*(config) {
    var _init = init(config)

    const put = _init.put,
      out = _init.out,
      ignored = _init.ignored,
      processors = _init.processors,
      verbose = _init.verbose

    var _prepare = prepare(put, out, processors),
      _prepare2 = slicedToArray(_prepare, 2)

    const initialMap = _prepare2[0],
      f2t = _prepare2[1]

    const map = yield pushToMap(initialMap, f2t, put, ignored)
    return (!verbose ? zapAllQuiet(map) : zapAllVerbose(map)).then(function() {
      return undefined
    })
  })

  return function chin(_x) {
    return _ref.apply(this, arguments)
  }
})()

const watch = (() => {
  var _ref2 = asyncToGenerator(function*(config) {
    var _init2 = init(config)

    const put = _init2.put,
      out = _init2.out,
      ignored = _init2.ignored,
      processors = _init2.processors,
      verbose = _init2.verbose,
      watchOpts = _init2.watch

    var _prepare3 = prepare(put, out, processors),
      _prepare4 = slicedToArray(_prepare3, 2)

    const initialMap = _prepare4[0],
      f2t = _prepare4[1]

    const map = yield pushToMap(initialMap, f2t, put, ignored)
    return (!verbose ? zapAllQuiet(map) : zapAllVerbose(map))
      .then(function() {
        return watchprocess({ map, f2t, put, out, watchOpts, ignored, verbose })
      })
      .then(function(watcher) {
        return watcher
      })
  })

  return function watch(_x2) {
    return _ref2.apply(this, arguments)
  }
})()

const zapAllQuiet = map => Promise.all([].concat(...[...map.values()]).map(zap))

const zapAllVerbose = map =>
  recursiveZapDir([].concat([...map.entries()])).then(count =>
    console.log(chalk[BASE_COLOR](`${figures.pointer} ${count} files`))
  )

const recursiveZapDir = (() => {
  var _ref3 = asyncToGenerator(function*(entries, count = 0) {
    var _entries$splice$ = slicedToArray(entries.splice(0, 1)[0], 2)

    const dirpath = _entries$splice$[0],
      eggs = _entries$splice$[1]

    const spinner = ora({ color: BASE_COLOR }).start(chalk.gray(`${dirpath}: `))

    let countByDir = 0

    yield Promise.all(
      eggs.map(function(egg) {
        return zap(egg).then(function() {
          return (spinner.text = chalk.gray(
            `${dirpath}: ${countByDir++} / ${eggs.length}`
          ))
        })
      })
    )
      .then(function() {
        return spinner.succeed(chalk.gray(`${dirpath}: ${eggs.length} files`))
      })
      .catch(function(err) {
        spinner.fail()
        throw err
      })

    count += countByDir

    return entries.length ? recursiveZapDir(entries, count) : count
  })

  return function recursiveZapDir(_x3) {
    return _ref3.apply(this, arguments)
  }
})()

exports.chin = chin
exports.watch = watch
exports.default = chin
