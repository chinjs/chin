import flow from 'rollup-plugin-flow'
import babel from 'rollup-plugin-babel'
import autoExternal from 'rollup-plugin-auto-external'
import prettier from 'rollup-plugin-prettier'

export default {
  input: 'src/index.js',
  output: { format: 'cjs', file: 'dist/index.js', exports: 'named' },
  plugins: [
    flow({ pretty: true }),
    babel({ exclude: 'node_modules/**' }),
    autoExternal({
      builtins: true,
      dependencies: true
    }),
    prettier({
      tabWidth: 2,
      semi: false,
      singleQuote: true
    })
  ]
}