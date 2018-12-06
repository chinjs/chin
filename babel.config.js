const targetVersion = '6'

module.exports = {
  env: {
    TEST: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-flow',
        'power-assert',
      ],
      plugins: [
        'istanbul',
        '@babel/plugin-transform-runtime',
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