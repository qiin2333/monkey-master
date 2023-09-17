import puppeteer from 'https://deno.land/x/puppeteer/mod.ts';
import { readLines } from 'https://deno.land/std/io/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { Cookie } from 'https://deno.land/x/another_cookiejar/mod.ts';

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
 * @param {String} skuid
 * @param {String} ua
 * @param {String} cookieString
 * @returns
 */
export async function getFP(skuid, ua, cookieString) {
    const page = await browser.newPage();
    const cookieArray = cookieString
        .split(';')
        .map((item) => ({
            ...Cookie.from(item),
            domain: '.jd.com',
            path: '/',
            expires: 3600 + Date.now(),
        }))
        .filter(({ name }) => name);
    await page.setRequestInterception(true);
    page.on('request', async(req) => {
        if (req.isInterceptResolutionHandled()) return;
        if (
            req.url().startsWith('https://api.m.jd.com/api?functionId=wareBusiness')
        ) {
            // console.log(req.headers());
        } else req.continue();
    });
    await page.setUserAgent(ua);
    await page.setCookie(...cookieArray);
    await page.goto(`https://fq.jr.jd.com/major/index.html?skuId=${skuid}`);
    await page.waitForRequest('https://api.m.jd.com/api?functionId=wareBusiness.style&screen=1920*1080');

    const jsToken = await page.evaluate(
        'window.getJsToken((t) => {window.r = t}, 1e3), r'
    );
    // const h5st = await page.evaluate(
    //     'window.getJsToken((t) => {window.r = t}, 1e3), r'
    // );
    await page.close();
    return jsToken;
}
