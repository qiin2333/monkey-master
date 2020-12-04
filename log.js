import { Logger } from 'https://deno.land/x/log/mod.ts';

const minLevelForConsole = 'DEBUG'; // config.minLevelForConsole
const minLevelForFile = 'ERROR'; // config.minLevelForFile
// const minLevelForConsole = 'INFO'
// const minLevelForFile = 'ERROR'
// const minLevelForFile = 'CRITICAL'

const fileName = './run.log';

// import this logger in your sub modules so that you have one logger for your whole process
export const logger = await Logger.getInstance(
  minLevelForConsole,
  minLevelForFile,
  fileName
);
