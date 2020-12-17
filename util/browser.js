import pptr from 'https://esm.sh/puppeteer-core/lib/esm/puppeteer/web.js';
import { readLines } from 'https://deno.land/std/io/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';

const p = await Deno.run({
  cmd: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '--headless',
    '--remote-debugging-port=8964',
    '--profile-directory=/tmp/pptr/',
    '--crash-dumps-dir=/tmp/crash/',
    'http://github.com',
  ],
  stdout: 'piped',
  stderr: 'piped',
});

// get the ws url from Chrome Output
async function logChromeOuput() {
  for await (const line of readLines(p.stderr)) {
    console.info('chrome output:', line);

    const i = line.indexOf('ws://');

    if (i > 0) {
      return line.slice(i);
    }
  }
}

const ws = await logChromeOuput();

const browser = await pptr.connect({
  browserWSEndpoint: ws,
  ignoreHTTPSErrors: true,
});

export async function closeBrowser() {
  return await browser.close();
}

/**
 *
 *
 * @export
 * @param {String} skuid
 * @returns
 */
export async function getAreaId(skuid) {
  const page = await browser.newPage();
  await page.goto(`https://item.jd.com/${skuid}.html`);
  return await page.$eval('.ui-area-text', (el) => el.dataset.id);
}
/**
 *
 *
 * @export
 * @param {String} userAgent
 */
export async function getFP(ua) {
  const page = await browser.newPage();
  await page.setUserAgent(ua);
  await page.goto(`https://trade.jd.com/shopping/order/getOrderInfo.action`);
  await sleep(0.5);
  return await page.evaluate('_JdTdudfp');
}
