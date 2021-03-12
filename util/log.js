import * as log from 'https://deno.land/std/log/mod.ts';
import { format as dateFormat } from 'https://deno.land/std@0.89.0/datetime/mod.ts';

await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler('DEBUG', {
            formatter: (logRecord) =>
                `[${dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}] ${
                    logRecord.msg
                }`,
        }),
        file: new log.handlers.FileHandler('WARNING', {
            filename: `${Deno.cwd()}/run.log`,
            formatter: '{levelName} {datetime} {msg}',
        }),
    },

    loggers: {
        default: {
            level: 'DEBUG',
            handlers: ['console', 'file'],
        },
    },
});

export const logger = log.getLogger();
