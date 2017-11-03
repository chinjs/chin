import assert from 'assert'
import rewire from 'rewire'

/**
 * babel 6.7 warning: You or one of the Babel plugins you are using are using Flow declarations as bindings
 * https://github.com/speedskater/babel-plugin-rewire/issues/108
 *
 * You or one of the Babel plugins you are using are using Flow declarations as bindings.
 * Support for this will be removed in version 7. To find out the caller, grep for this
 * message and change it to a `console.trace()`.
 */

describe(`no opts => copy`, () => {
   it('src', async () => {
      const chin = rewire('../src/main').default
      await e2e(chin)
      return
   })

   it('lib', async () => {
      const chin = rewire('../lib/main').default
      await e2e(chin)
      return
   })

   async function e2e(chin) {
      const src = './test/stub_copy'
      const dest = './other/stub/dest'

      const tests = [
         [
            './test/stub_copy/bar.js',
            content => {
               const expectOut = `${dest}/bar.js`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.ifError(content.readOpts)
               assert.ifError(content.plugin)
            }
         ],
         [
            './test/stub_copy/foo.js',
            content => {
               const expectOut = `${dest}/foo.js`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.ifError(content.readOpts, null)
               assert.ifError(content.plugin)
            }
         ]
      ]
      const contents = await chin(src, dest)
      assert.deepStrictEqual(contents.length, tests.length)
      tests.forEach(([path, test]) => {
         const file = normalizePath(path)
         const content = contents.find(content => content.file === file)
         test(content)
      })
   }
})

describe(`with opts/preset => plugin`, () => {
   it('src', async () => {
      const chin = rewire('../src/main').default
      await e2e(chin)
      return
   })

   it('lib', async () => {
      const chin = rewire('../lib/main').default
      await e2e(chin)
      return
   })

   async function e2e(chin) {
      const src = './test/stub_src'
      const dest = './other/stub/dest'
      const preset = {
         plugin: async () => {},
         pluginWeir1: () => {},
         pluginWeir2: () => {}
      }
      const opts = {
         process: { js: 'plugin' },
         weirs: [
            ['./weir1', { js: ['pluginWeir1', 'utf8'] }],
            ['./weir1/weir2', { js: ['pluginWeir2', 'base64'] }]
         ],
         ignore: {
            exts: ['txt'],
            targets: [
               './targets',
               './target.md',
               './weir1/target.md',
               './weir1/weir2/target.md'
            ],
            compare: [
               './test/stub_compare',
               {
                  svg: ['png', 'jpg', 'pdf']
               }
            ]
         }
      }

      const tests = [
         [
            './test/stub_src/config.md',
            content => {
               const expectOut = `${dest}/config.md`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.ifError(content.readOpts)
               assert.ifError(content.plugin)
            }
         ],
         [
            './test/stub_src/image/uncompare.png',
            content => {
               const expectOut = `${dest}/image/uncompare.png`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.ifError(content.readOpts)
               assert.ifError(content.plugin)
            }
         ],
         [
            './test/stub_src/index.js',
            content => {
               const expectOut = `${dest}/index.js`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.deepStrictEqual(content.readOpts, null)
               assert.deepStrictEqual(content.plugin.fn, preset.plugin)
               assert.deepStrictEqual(content.plugin.name, 'plugin')
            }
         ],
         [
            './test/stub_src/weir1/index.js',
            content => {
               const expectOut = `${dest}/weir1/index.js`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.deepStrictEqual(content.readOpts, 'utf8')
               assert.deepStrictEqual(content.plugin.fn, preset.pluginWeir1)
               assert.deepStrictEqual(content.plugin.name, 'pluginWeir1')
            }
         ],
         [
            './test/stub_src/weir1/weir2/index.js',
            content => {
               const expectOut = `${dest}/weir1/weir2/index.js`
               assert.deepStrictEqual(
                  normalizeOutPath(content.out),
                  normalizePath(expectOut)
               )
               assert.deepStrictEqual(content.readOpts, 'base64')
               assert.deepStrictEqual(content.plugin.fn, preset.pluginWeir2)
               assert.deepStrictEqual(content.plugin.name, 'pluginWeir2')
            }
         ]
      ]

      const contents = await chin(src, dest, opts, preset)
      assert.deepStrictEqual(contents.length, tests.length)
      tests.forEach(([path, test]) => {
         const file = normalizePath(path)
         const content = contents.find(content => content.file === file)
         test(content)
      })
   }
})

const { format, normalize, sep } = require('path')
function normalizePath(path) {
   return normalize(path)
      .split('/')
      .join(sep)
}

function normalizeOutPath(obj) {
   return normalize(format(obj))
}
