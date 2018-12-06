import Flow from 'rollup-plugin-flow'
import Babel from 'rollup-plugin-babel'
import AutoExternal from 'rollup-plugin-auto-external'
import Prettier from 'rollup-plugin-prettier'

const shebang = '#!/usr/bin/env node'

const babel = Babel({
  exclude: 'node_modules/**'
})

const autoexternal = AutoExternal({
  builtins: true,
  dependencies: true
})

const prettier = Prettier({
  parser: 'babylon',
  tabWidth: 2,
  semi: false,
  singleQuote: true
})

export default [
  {
    input: 'src/index.js',
    output: {
      format: 'cjs',
      file: 'dist/index.js',
      exports: 'named'
    },
    plugins: [
      Flow({ pretty: true }),
      babel,
      autoexternal,
      prettier
    ]
  },
  {
    input: 'src/bin.index.js',
    external: ['..'],
    output: {
      format: 'cjs',
      file: 'bin/chin.js',
      banner: shebang
    },
    plugins: [
      babel,
      autoexternal,
      prettier
    ]
  }
]