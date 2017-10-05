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
