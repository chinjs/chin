#!/usr/bin/env node
import program from 'commander'
import cli from './cli.js'

program.version(require('../package.json').version)

program
   .arguments(`[choose]`)
   .option(`-c, --config <path>`, `default: chin.config.json || package.json`)
   .option(`-p, --preset <path>`, `default: chin.preset.js`)
   .option(`-v, --verbose`)

program.parse(process.argv)

cli(program.args[0], {
   config: program.config,
   preset: program.preset,
   verbose: program.verbose
})