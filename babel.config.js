const targetVersion = '6'

module.exports = {
  env: {
    TEST: {
      presets: [
        ['@babel/preset-env', {
          targets: { node: targetVersion }
        }],
        '@babel/preset-flow',
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
        }]
      ],
      plugins: []
    }
  }
}