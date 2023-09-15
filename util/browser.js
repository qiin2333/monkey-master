import puppeteer from 'https://deno.land/x/puppeteer/mod.ts';
import { readLines } from 'https://deno.land/std/io/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';

let browser;

export async function initBrowser() {
    browser = await puppeteer.launch();
    return browser;
}

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
 * @param {String} skuid
 * @param {String} userAgent
 */
export async function getFP(skuid, ua) {
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.goto(`https://fq.jr.jd.com/major/index.html?skuId=${skuid}`);
    await sleep(0.5);
    return await page.evaluate('window.getJsToken((t) => {window.ret = t}, 1e3), ret');
}
