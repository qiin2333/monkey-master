import * as log from 'https://deno.land/std@0.224.0/log/mod.ts';
import { format as dateFormat } from 'https://deno.land/std@0.89.0/datetime/mod.ts';

log.setup({
    handlers: {
        console: new log.ConsoleHandler('DEBUG', {
            formatter: (logRecord) =>
                `[${dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS')}] ${
                    logRecord.msg
                }`,
        }),
        file: new log.FileHandler('WARN', {
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
