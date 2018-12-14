import Babel from 'rollup-plugin-babel'
import AutoExternal from 'rollup-plugin-auto-external'
import Prettier from 'rollup-plugin-prettier'

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
  singleQuote: true,
})

export default [
  {
    input: 'src/index.js',
    output: {
      format: 'cjs',
      file: '.dist/index.js',
      exports: 'named'
    },
    plugins: [
      babel,
      autoexternal,
      prettier,
    ]
  },
  {
    input: 'bin/index.js',
    external: ['..'],
    output: {
      format: 'cjs',
      file: '.dist/chin.js',
      banner: '#!/usr/bin/env node'
    },
    plugins: [
      babel,
      autoexternal,
      prettier,
    ]
  }
]