import { Logger } from 'https://deno.land/x/log/mod.ts'
import { format as dateFormat } from 'https://deno.land/std@0.89.0/datetime/mod.ts';

const minLevelConsole = 'DEBUG'
const minLevelFile = 'WARNING'
const fileName = `./run.log`

// log.setup({
//     handlers: {
//         console: new log.ConsoleHandler('DEBUG', {
//             formatter: (logRecord) =>
//                 `[${dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}] ${
//                     logRecord.msg
//                 }`,
//         }),
//         file: new log.FileHandler('WARN', {
//             filename: `${Deno.cwd()}/run.log`,
//             formatter: '{levelName} {datetime} {msg}',
//         }),
//     },

//     loggers: {
//         default: {
//             level: 'DEBUG',
//             handlers: ['console', 'file'],
//         },
//     },
// });

export const logger = await Logger.getInstance(minLevelConsole, minLevelFile, fileName, false);
