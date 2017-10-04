import assert from 'assert'
import rewire from 'rewire'
import sinon from 'sinon'

describe(`utils: dirReplace`, () => {
   const local = rewire('../src/main/utils.js')
   const dirReplace = local.__get__('dirReplace')
   const { sep, normalize, join } = require('path')

   const toSep = string =>
      normalize(string)
         .split('/')
         .join(sep)
   const below = toSep('./hoge/fuga.ext')

   it(`src[0] === dest[0] length: src < dest`, () => {
      const source = toSep('./src/foo')
      const compare = toSep('./src/bar/baa')
      const target = join(source, below)
      const result = dirReplace(target, source, compare)
      const expect = join(compare, below)
      assert.deepStrictEqual(result, expect)
   })

   it(`src[0] === dest[0] length: src > dest`, () => {
      const source = toSep('./src/bar/baa')
      const compare = toSep('./src/foo')
      const target = join(source, below)
      const result = dirReplace(target, source, compare)
      const expect = join(compare, below)
      assert.deepStrictEqual(result, expect)
   })

   it(`src[0] !== dest[0] length: src < dest`, () => {
      const source = toSep('./src/foo')
      const compare = toSep('./dest/bar/baa')
      const target = join(source, below)
      const result = dirReplace(target, source, compare)
      const expect = join(compare, below)
      assert.deepStrictEqual(result, expect)
   })

   it(`src[0] !== dest[0] length: src > dest`, () => {
      const source = toSep('./src/bar/baa')
      const compare = toSep('./dest/foo')
      const target = join(source, below)
      const result = dirReplace(target, source, compare)
      const expect = join(compare, below)
      assert.deepStrictEqual(result, expect)
   })
})

describe(`class: Content`, () => {
   const local = rewire('../src/main/Content.js')
   const Content = local.default

   const file = 'file.js'
   const outfile = 'outfile.js'

   it(`without exts => copy`, async () => {
      const spyCopy = sinon.spy(copy)

      await local.__with__({
         _fsExtra: { copy: spyCopy }
      })(async () => {
         const content = new Content(file, outfile)

         const resultMessage = content.message()
         const expectMessage = `copy: ${file} => ${outfile}`
         assert.deepStrictEqual(resultMessage, expectMessage)

         await content.exec()
         return
      })

      assert.deepStrictEqual(spyCopy.callCount, 1)

      async function copy(argfile, argout) {
         assert.deepStrictEqual(argfile, file)
         assert.deepStrictEqual(argout, outfile)
         return
      }
   })

   describe(`with exts => throws`, () => {
      const create = (...arg) => () => new Content(file, outfile, ...arg)

      it(`isArray(exts)`, () => {
         const cause = []
         const exts = cause
         const expect = /TypeError: exts is array/
         assert.throws(create(exts), expect)
      })

      it(`isArray(pluginInfo) && pluginName !== "string"`, () => {
         const cause = 1
         const exts = { js: [cause, null] }
         const expect = /TypeError: pluginName is number/
         assert.throws(create(exts), expect)
      })

      it(`!isArray(pluginInfo) && pluginName !== "string"`, () => {
         const cause = true
         const exts = { js: cause }
         const expect = /TypeError: pluginName is boolean/
         assert.throws(create(exts), expect)
      })

      it(`plugin !== "function"`, () => {
         const cause = undefined
         const preset = { name: cause }
         const exts = { js: 'pluginName' }
         const expect = /TypeError: plugin is undefined/
         assert.throws(create(exts, preset), expect)
      })

      it(`success`, () => {
         const preset = { pluginName: () => {} }
         const exts = { js: ['pluginName', 'utf8'] }
         const content = new Content(file, outfile, exts, preset)

         const { plugin, encoding } = content
         assert.ok(typeof plugin.fn === 'function')
         assert.deepStrictEqual(plugin.name, 'pluginName')
         assert.deepStrictEqual(encoding, 'utf8')

         const resultMessage = content.message()
         const expectMessage = `pluginName: ${file} => ${outfile}`
         assert.deepStrictEqual(resultMessage, expectMessage)
      })
   })

   describe(`with exts => exec`, () => {
      const create = plugin => {
         const exts = { js: 'pluginName' }
         const preset = { pluginName: plugin }
         return new Content(file, outfile, exts, preset)
      }

      const readFile = async (file, encoding) => {}

      const withSpy = (readFile, outputFile, plugin) =>
         local.__with__({
            _fsExtra: { readFile, outputFile }
         })(async () => {
            const content = create(plugin)
            await content.exec()
            return
         })

      it(`return buffer`, async () => {
         const pluginResult = Buffer.from([])

         const spyReadFile = sinon.spy(readFile)
         const spyOutputFile = sinon.spy(outputFile)
         const spyPlugin = sinon.spy(async (data, opts) => pluginResult)

         await withSpy(spyReadFile, spyOutputFile, spyPlugin)

         assert.deepStrictEqual(spyReadFile.callCount, 1)
         assert.deepStrictEqual(spyPlugin.callCount, 1)
         assert.deepStrictEqual(spyOutputFile.callCount, 1)
         async function outputFile(outfileArg, data, opts, cb) {
            assert.ifError(opts)
            assert.ifError(cb)
            return
         }
      })

      it(`return OutpufFile$Arg`, async () => {
         const pluginResult = [
            'outFilePath',
            Buffer.from([]),
            {
               encoding: 'utf8',
               mode: 0o666,
               flag: 'a'
            },
            () => {}
         ]

         const spyReadFile = sinon.spy(readFile)
         const spyOutputFile = sinon.spy(outputFile)
         const spyPlugin = sinon.spy(async (data, opts) => pluginResult)

         await withSpy(spyReadFile, spyOutputFile, spyPlugin)

         assert.deepStrictEqual(spyReadFile.callCount, 1)
         assert.deepStrictEqual(spyPlugin.callCount, 1)
         assert.deepStrictEqual(spyOutputFile.callCount, 1)
         async function outputFile(outfileArg, data, opts, cb) {
            assert.deepStrictEqual(opts, pluginResult[2])
            assert.deepStrictEqual(cb, pluginResult[3])
            return
         }
      })

      it(`return !boolean`, async () => {
         const cause = false

         const spyReadFile = sinon.spy(readFile)
         const spyOutputFile = sinon.spy()
         const spyPlugin = sinon.spy(async (data, opts) => cause)
         await withSpy(spyReadFile, spyOutputFile, spyPlugin)
         assert.deepStrictEqual(spyReadFile.callCount, 1)
         assert.deepStrictEqual(spyPlugin.callCount, 1)
         assert.deepStrictEqual(spyOutputFile.callCount, 0)
      })

      it(`return other than that => throws`, async () => {
         const cause = {}

         const spyReadFile = sinon.spy(readFile)
         const spyOutputFile = sinon.spy()
         const spyPlugin = sinon.spy(async (data, opts) => cause)
         try {
            await withSpy(spyReadFile, spyOutputFile, spyPlugin)
         } catch (err) {
            const expectMessage = `plugin result is ${typeof cause}`
            assert.deepStrictEqual(err.message, expectMessage)
            assert.deepStrictEqual(spyReadFile.callCount, 1)
            assert.deepStrictEqual(spyPlugin.callCount, 1)
            assert.deepStrictEqual(spyOutputFile.callCount, 0)
         }
      })
   })
})
