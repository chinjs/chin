import assert from 'assert'
import rewire from 'rewire'
import sinon from 'sinon'

describe(`class Content:`, () => {
   const file = './src/file.js'
   const outfile = './dest/foo/outfile.js'

   describe(`throws`, () => {
      const local = rewire('../src/main/Content.js')
      const Content = local.default

      it(`pluginName && !plugin`, () => {
         const preset = { existPluginName: () => {} }
         const cause = 'notExistPluginName'
         const processes = [
            cause,
            [cause, 'encoding'],
            [cause, { encoding: 'encoding' }],
            [cause, { encoding: 'encoding' }, 0],
            [cause, { encoding: 'encoding' }, 1],
            { js: cause },
            { js: [cause, 'encoding'] },
            { js: [cause, { encoding: 'encoding' }] },
            { js: [cause, { encoding: 'encoding' }, 0] },
            { js: [cause, { encoding: 'encoding' }, 1] }
         ]
         processes.forEach(_process => {
            assert.throws(
               () => new Content(file, outfile, _process, preset),
               /TypeError: plugin is undefined/
            )
         })
      })
   })

   describe(`without pluginName => copy`, () => {
      const local = rewire('../src/main/Content.js')
      const Content = local.default
      const { normalize, resolve } = require('path')

      it(`no process/preset`, async () => {
         await test(file, outfile)
      })

      it(`with process/preset, but the ext not match`, async () => {
         const cause = 'jsx'
         const _process = { [cause]: 'pluginName' }
         const preset = { pluginName: () => {} }
         await test(file, outfile, _process, preset)
      })

      async function test(...arg) {
         const spyCopy = sinon.spy(copy)

         await local.__with__({
            _fsExtra: { copy: spyCopy }
         })(async () => {
            const content = new Content(...arg)

            const resultMessage = content.message()
            const expectMessage = `copy: ${normalize(file)} => ${normalize(
               outfile
            )}`
            assert.deepStrictEqual(resultMessage, expectMessage)

            await content.exec()
            assert.deepStrictEqual(spyCopy.callCount, 1)
            return
         })

         async function copy(argfile, argout) {
            assert.deepStrictEqual(argfile, resolve(file))
            assert.deepStrictEqual(argout, resolve(outfile))
            return
         }
      }
   })

   describe(`with pluginName => plugin`, () => {
      const local = rewire('../src/main/Content.js')
      const Content = local.default

      const plugin = () => {}
      const preset = { pluginName: plugin }
      const pluginName = 'pluginName'
      const readOpts = { encoding: 'utf8' }

      it(`process === "pluginName"`, () => {
         const _process = pluginName
         test(_process, {
            readOpts: null,
            plugin: {
               name: pluginName,
               type: 'buffer',
               fn: plugin
            }
         })
      })
      it(`process === ["pluginName",readOpts]`, () => {
         const _process = [pluginName, readOpts]
         test(_process, {
            readOpts,
            plugin: {
               name: pluginName,
               type: 'buffer',
               fn: plugin
            }
         })
      })
      it(`process === ["pluginName",readOpts,bufferKey]`, () => {
         ;[0, false, 'buffer', undefined, null].forEach(pluginType => {
            const _process = [pluginName, readOpts, pluginType]
            test(_process, {
               readOpts,
               plugin: {
                  name: pluginName,
                  type: 'buffer',
                  fn: plugin
               }
            })
         })
      })
      it(`process === ["pluginName",readOpts,streamKey]`, () => {
         ;[1, true, 'stream'].forEach(pluginType => {
            const _process = [pluginName, readOpts, pluginType]
            test(_process, {
               readOpts,
               plugin: {
                  name: pluginName,
                  type: 'stream',
                  fn: plugin
               }
            })
         })
      })
      it(`process === {ext}`, () => {
         const _process = { js: [pluginName, readOpts, 1] }
         test(_process, {
            readOpts,
            plugin: {
               name: pluginName,
               type: 'stream',
               fn: plugin
            }
         })
      })

      function test(_process, expect) {
         const { readOpts, plugin } = new Content(
            file,
            outfile,
            _process,
            preset
         )
         assert.deepStrictEqual({ readOpts, plugin }, expect)
      }
   })

   describe(`exec type === "buffer"`, () => {
      const local = rewire('../src/main/Content.js')
      const Content = local.default

      const { resolve } = require('path')
      const reOutpath = expect => resolve(expect)

      it(`result.constructor === Buffer`, async () => {
         const expectOutPath = './dest/foo/bar/rename.txt'
         const outputFileCount = 1
         const pluginResult = Buffer.from([])

         return test(outputFileCount, reOutpath(expectOutPath), opts => {
            opts.dir = `${opts.dir}/bar`
            opts.name = 'rename'
            opts.ext = '.txt'
            return () => pluginResult
         })
      })

      it(`result.constructor !== Buffer`, async () => {
         const expectOutPath = './dest/foo/baa/rename.md'
         const outputFileCount = 0
         const pluginResults = ['string', 4, undefined, true, false]

         return Promise.all(
            pluginResults.map(pluginResult =>
               test(outputFileCount, reOutpath(expectOutPath), opts => {
                  opts.dir = `${opts.dir}/baa`
                  opts.name = 'rename'
                  opts.ext = '.md'
                  return () => pluginResult
               })
            )
         )
      })

      async function test(outputFileCount, outpath, plugin) {
         const spyReadFile = sinon.spy(async () => {
            /* do nothing */
         })
         const spyOutputFile = sinon.spy(async () => {
            /* do nothing */
         })
         const spyPlugin = sinon.spy(plugin)

         await local.__with__({
            _fsExtra: {
               readFile: spyReadFile,
               outputFile: spyOutputFile
            }
         })(async () => {
            const _process = { js: 'pluginBuffer' }
            const preset = { pluginBuffer: spyPlugin }
            const content = new Content(file, outfile, _process, preset)

            await content.exec()

            assert.deepStrictEqual(spyReadFile.callCount, 1)
            assert.deepStrictEqual(spyPlugin.callCount, 1)
            assert.deepStrictEqual(spyOutputFile.callCount, outputFileCount)

            assert.deepStrictEqual(content.outpath(), outpath)
            return
         })

         return
      }
   })

   describe(`exec type === "stream"`, () => {
      const local = rewire('../src/main/Content.js')
      const Content = local.default
      const { Readable, Writable, Transform } = require('stream')

      it(`!result => resolve()`, async () => {
         const plugin = opts => readable => undefined

         return frame(plugin, content => {
            return content.exec().then(() => assert.ok(true))
         })
      })

      it(`result !== stream => throw`, async () => {
         const expectMessage = 'transform must return stream'
         const plugin = opts => readable => ({})

         return frame(plugin, content => {
            return content.exec().catch(err => {
               assert.deepStrictEqual(err.message, expectMessage)
            })
         })
      })

      const plugin = opts => readable => readable.pipe(new Transform())

      it(`readable.emit("error")`, async () => {
         const message = `readableStream emit "error"`

         return frame(plugin, async (content, readable) => {
            try {
               setTimeout(() => readable.emit('error', new Error(message)), 100)
               await content.exec()
            } catch (err) {
               assert.deepStrictEqual(err.message, message)
            }
         })
      })

      it(`writable.emit("error")`, async () => {
         const message = `writableStream emit "error"`

         return frame(plugin, async (content, readable, writable) => {
            try {
               setTimeout(() => writable.emit('error', new Error(message)), 100)
               await content.exec()
            } catch (err) {
               assert.deepStrictEqual(err.message, message)
            }
         })
      })

      it(`writable.emit("finish")`, async () => {
         const message = `writableStream emit "finish"`

         return frame(plugin, async (content, readable, writable) => {
            setTimeout(() => writable.emit('finish', message), 100)
            const result = await content.exec()
            assert.deepStrictEqual(result, message)
         })
      })

      async function frame(plugin, test) {
         const readable = new Readable()
         readable._read = function(size) {}

         const writable = new Writable()
         writable._write = function(size) {}

         return local.__with__({
            _fsExtra: {
               ensureDir: async () => {},
               createReadStream: () => readable,
               createWriteStream: () => writable
            }
         })(async () => {
            const _process = ['pluginBuffer', null, 1]
            const preset = { pluginBuffer: plugin }
            const content = new Content(file, outfile, _process, preset)
            return test(content, readable, writable)
         })
      }
   })
})
