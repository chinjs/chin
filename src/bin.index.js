import program from 'commander'
import { chin, watch } from '..'
import action, { PUT, OUT, CONFIG1, CONFIG2 } from './bin.action.js'

program
  .option('-c, --config [path]', `[default: ${CONFIG1} || ${CONFIG2}]`)
  .option('-i, --put <path>', `[default: ${PUT}]`)
  .option('-o, --out <path>', `[default: ${OUT}]`)
  .option('-r, --require <name..>', 'splited by ","')
  .option('--clean', 'remove "out" before')
  .option('-q, --quiet')
  .version(require('../package.json').version, '-v, --version')
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
  .action(() => action(program, watch))

program.parse(process.argv)

program.args.length === 0
  ? action(program, chin)
  : program.args[0].constructor !== program.Command && program.help()
