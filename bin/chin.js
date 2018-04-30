#!/usr/bin/env node
const program = require('commander')
const { version } = require('../package.json')
const { chin, watch } = require('..')
const { actionFrame, PUT, OUT, CONFIG1, CONFIG2 } = require('./action.js')

program
  .option('-c, --config [path]', `[default: ${CONFIG1} || ${CONFIG2}]`)
  .option('-i, --put <path>', `[default: ${PUT}]`)
  .option('-o, --out <path>', `[default: ${OUT}]`)
  .option('-r, --require <name..>', 'splited by ","')
  .option('--clean', 'remove "out" before')
  .option('-q, --quiet')
  .version(version, '-v, --version')
  .on('--help', () => console.log(
`
  Example:

    chin -c -r babel-register,dotenv/config
`
  ))

program
  .command('watch')
  .option('-c, --config [path]', `[default: ${CONFIG1} || ${CONFIG2}]`)
  .option('-i, --put <path>', `[default: ${PUT}]`)
  .option('-o, --out <path>', `[default: ${OUT}]`)
  .option('-r, --require <name...>', 'splited by ","')
  .option('--clean', 'remove "out" before')
  .option('-q, --quiet')
  .on('--help', () => console.log(``))
  .action(() => actionFrame(program, watch))

program.parse(process.argv)

program.args.length === 0
  ? actionFrame(program, chin)
  : program.args[0].constructor !== program.Command && program.help()