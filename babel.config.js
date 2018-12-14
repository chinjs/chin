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
    },
    /*
    FLOW_COMMENT: {
      presets: [
        ['@babel/preset-env', {
          modules: false,
          targets: { node: targetVersion },
        }],
      ],
      plugins: [
        '@babel/plugin-transform-arrow-functions',
        '@babel/plugin-transform-parameters',
        '@babel/plugin-transform-flow-comments',
      ],
    }
    */
  }
}
