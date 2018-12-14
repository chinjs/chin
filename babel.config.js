const targetVersion = '6'

module.exports = {
  presets: [
    '@babel/preset-flow',
  ],
  env: {
    TEST: {
      presets: [
        ['@babel/preset-env', {
          targets: { node: targetVersion }
        }],
        'power-assert',
      ],
      plugins: [
        'istanbul'
      ]
    },
    BUILD: {
      presets: [
        ['@babel/preset-env', {
          modules: false,
          targets: { node: targetVersion },
        }],
      ],
      plugins: [

      ],
    }
  }
}