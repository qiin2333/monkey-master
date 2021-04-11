import { osType, isWindows } from 'https://deno.land/std@0.80.0/_util/os.ts';
import { format as dateFormat } from 'https://deno.land/std@0.89.0/datetime/mod.ts';
import { buildUrl } from 'https://deno.land/x/url_builder/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { exec } from 'https://deno.land/x/exec/mod.ts';
import rua from 'https://deno.land/x/rua/mod.js';
import Random from 'https://deno.land/x/random@v1.1.2/Random.js';
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';
import UPNG from 'https://cdn.skypack.dev/@pdf-lib/upng';
import jsQR from 'https://cdn.skypack.dev/jsqr';
import qrcodeTerminal from 'https://deno.land/x/qrcode_terminal/mod.js';
import { cheerio } from 'https://deno.land/x/cheerio@1.0.4/mod.ts';

import mFetch from './util/fetch.js';
import { logger } from './util/log.js';
import { initBrowser, closeBrowser, getFP } from './util/browser.js';

import SecKill from './order/ko.js';
import FqKill from './order/fqsc.js';

import {
    str2Json,
    getCookie,
    cookieParse,
    encodePwd,
    obj2qs,
    numAvg,
    genAreaId,
    isInStock,
} from './util/util.js';

const random = new Random();
const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';
const CONFIG = await loadJsonFile('conf.json');
const skuInfoCache = {};

export default class MonkeyMaster {
    constructor(options = {}) {
        this.options = options;
        this.skuids = options.skuids || [];
        this.autoReserve = CONFIG.autoReserve
        this.userAgent = CONFIG.useRandomUA
            ? rua('desktop')
            : DEFAULT_USER_AGENT;
        this.headers = new Headers({
            'User-Agent': this.userAgent,
            'cache-control': 'no-cache',
            'x-requested-with': 'XMLHttpRequest',
        });
        this.userPath = CONFIG.userPath || './cookies/';
        this.isLogged = false;
        this.postConsumes = [];
        this.buyTime = new Date().toJSON();
    }

    async init() {
        let cookieText = '';

        try {
            cookieText = Deno.readTextFileSync(this.userPath + 'data');
        } catch (error) {
            Deno.mkdirSync(this.userPath);
        }

        if (cookieText) {
            this.headers.set('Cookie', cookieText);
            this.isLogged = await this.validateCookies();
        }

        while (!this.isLogged) {
            this.isLogged = await this.loginByQRCode();
        }

        logger.info('登录成功了，来造作吧！');

        this.skuids = this.skuids.map((sku) => {
            const skuInfo = sku.split('*');
            return {
                skuid: skuInfo[0],
                count: skuInfo[1] || 1,
            };
        });

        await this.getUserInfo();
        await this.cancelSelectCartSkus();
    }

    async validateCookies() {
        const url = 'https://order.jd.com/center/list.action';
        const res = await mFetch(`${url}?rid=${Date.now()}`, {
            headers: this.headers,
        });

        return (
            !res.redirected &&
            !/NotLogin/.test(await res.text()) &&
            (await this.loginCheck(res.url))
        );
    }

    async getQRCode() {
        const url = buildUrl('https://qr.m.jd.com/show', {
            queryParams: {
                appid: 133,
                size: 147,
                t: String(Date.now()),
            },
        });

        const blob = await mFetch(url, {
            method: 'GET',
            referrer: 'https://passport.jd.com/new/login.aspx',
            headers: this.headers,
        }).then((res) => {
            this.saveCookie(res.headers.get('set-cookie'));
            return res.blob();
        });

        const buffer = await blob.arrayBuffer();

        const img = UPNG.decode(buffer);
        const { data } = jsQR(
            new Uint8ClampedArray(UPNG.toRGBA8(img)[0]),
            img.width,
            img.height
        );
        qrcodeTerminal.generate(data, { small: true });

        const unit8arr = new Deno.Buffer(buffer).bytes();
        Deno.writeFileSync('qrcode.png', unit8arr);

        return await exec(`${isWindows ? 'cmd /c' : 'open'} qrcode.png`);
    }

    async getQRCodeTicket() {
        const url = buildUrl('https://qr.m.jd.com/check', {
            queryParams: {
                callback: `jQuery${random.int(1000000, 9999999)}`,
                appid: 133,
                token: getCookie(this.headers.get('Cookie'), 'wlfstk_smdl'),
                _: String(Date.now()),
            },
        });

        this.headers.set('Referer', 'https://passport.jd.com/');

        let r = await mFetch(url, {
            method: 'GET',
            body: null,
            headers: this.headers,
        }).then((res) => res.text());

        r = str2Json(r);

        if (r.code === 200) {
            return r.ticket;
        } else {
            logger.error(r.msg);
        }
    }

    async loginByQRCode() {
        await mFetch('https://passport.jd.com/new/login.aspx', {
            headers: this.headers,
        });

        this.headers.set('Cookie', '');

        await this.getQRCode();

        const timeLmt = 80 * 1000;
        const startTime = Date.now();
        let ticket;

        while (!ticket && Date.now() - startTime < timeLmt) {
            ticket = await this.getQRCodeTicket();
            await sleep(2);
        }

        // 校验 ticket
        if (ticket) {
            this.headers.set(
                'Referer',
                'https://passport.jd.com/uc/login?ltype=logout'
            );

            const res = await mFetch(
                `https://passport.jd.com/uc/qrCodeTicketValidation?t=${ticket}`,
                {
                    method: 'GET',
                    headers: this.headers,
                    credentials: 'include',
                }
            );

            this.saveCookie(res.headers.get('set-cookie'));

            return res.status === 200;
        }
        return false;
    }

    async getUserInfo() {
        const url = buildUrl(
            'https://passport.jd.com/user/petName/getUserInfoForMiniJd.action',
            {
                queryParams: {
                    callback: `jQuery${random.int(1000000, 9999999)}`,
                    _: String(Date.now()),
                },
            }
        );

        const res = await mFetch(url, {
            headers: this.headers,
            redirect: 'error',
        });

        const addrs = await this.getUserAddr();

        if (addrs && addrs.length) {
            const addrsMsg = addrs
                .map(
                    (addr, index) =>
                        `[${index}]: ${addr.addressName}-${addr.fullAddress}-${addr.mobile}`
                )
                .join('\n');
            const index = prompt(
                `选择下单地址: 默认为首个 \n${addrsMsg} \n`,
                0
            );
            this.addr = addrs[index];
            this.areaId = genAreaId(this.addr);
            console.log(`area id 获取成功: ${this.areaId}`);
        }
    }

    async getUserAddr() {
        const url = buildUrl('https://cd.jd.com/usual/address', {
            queryParams: {
                callback: `jQuery${random.int(1000000, 9999999)}`,
                _: String(Date.now()),
            },
        });

        this.headers.set('Referer', 'https://item.jd.com/');

        const res = await mFetch(url, { headers: this.headers });

        return str2Json(await res.text());
    }

    saveCookie(cookie) {
        if (cookie === null) return;
        const oldCookie = this.headers.get('Cookie');
        let newCookie = cookieParse(cookie);

        if (oldCookie) {
            newCookie = oldCookie + '; ' + newCookie;
        }

        this.headers.set('Cookie', newCookie);
        Deno.writeTextFileSync(this.userPath + 'data', newCookie);

        return newCookie;
    }

    async getBuyTime() {
        const { skuid, count } = this.skuids[0];

        const url = buildUrl('https://item-soa.jd.com/getWareBusiness', {
            queryParams: {
                skuId: skuid,
                num: count,
                area: this.areaId,
            },
        });

        this.headers.set('Referer', 'https://item.jd.com/');

        // 尝试获取精确开抢时间
        let exactTime;
        try {
            const res = await mFetch(
                'https://yushou.jd.com/member/qualificationList.action',
                { headers: this.headers }
            );
            const $ = cheerio.load(await res.text());
            exactTime = $(`a[href*="${skuid}"]`)
                .parents('.cont-box')
                .find('input[id$=_buystime]')
                .val();
        } catch (e) {}

        // 尝试获取粗略开抢时间
        let buyTime;
        try {
            const { yuyueInfo } = await (await mFetch(url, { headers: this.headers })).json();
            this.yuyueInfo = yuyueInfo;
        } catch (error) {}

        try {
            buyTime = this.yuyueInfo.buyTime.match(
                /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/
            )[0];
        } catch (error) {}

        this.buyTime = buyTime = exactTime ?? buyTime;

        logger.info(`${exactTime ? '' : '粗略'}开抢时间为 ${buyTime}`);

        if (this.yuyueInfo && !this.yuyueInfo.yuyue && this.yuyueInfo.url) {
            mFetch(this.yuyueInfo.url, { headers: this.headers });
        }

        if (!buyTime) {logger.info(`${skuid} 不是预约商品，需要输入自定购买时间`);}

        return buyTime;
    }

    /**
     *
     * @param {Array} skuids
     */
    async addCart(skuids = []) {
        let url = 'https://cart.jd.com/gate.action';

        for (let { skuid, count } of skuids) {
            url = buildUrl(url, {
                queryParams: {
                    pid: skuid,
                    pcount: count,
                    ptype: 1,
                },
            });

            this.headers.set('Referer', `https://item.jd.com/${skuid}.html`);
            const res = await mFetch(url, {
                headers: this.headers,
            });

            // presale
            this.isPreSale = res.redirected && /getPresalInfo/.test(res.url);
            this.preSaleUrl = res.url;

            const ret = await this.loginCheck(res.url);

            if (res.status === 200 && ret) {
                logger.info(`商品${skuid}-加车成功`);
            } else {
                logger.info(`商品${skuid}-加车失败`);
                return ret;
            }
        }

        return true;
    }

    /**
     * 订单结算页
     */
    async getOrderInfo() {
        const url = this.isPreSale
            ? this.preSaleUrl
            : `http://trade.jd.com/shopping/order/getOrderInfo.action?rid=${Date.now()}`;
        let res;

        console.info(
            `getOrderInfo req start at ${dateFormat(
                new Date(),
                'yyyy-MM-dd HH:mm:ss.SSS'
            )}`
        );

        if (this.isPreSale) {
            const headers = new Headers(this.headers);
            headers.set('content-type', 'application/x-www-form-urlencoded');

            res = await mFetch(
                'https://trade.jd.com/shopping/async/obtainOrderExt.action',
                {
                    method: 'POST',
                    headers,
                    body: obj2qs({
                        flowType: 15,
                        preSalePaymentTypeInOptional: 1,
                    }),
                }
            );

            this.saveCookie(res.headers.get('set-cookie'));
        } else {
            res = await mFetch(url, {
                headers: this.headers,
            });
        }

        await Promise.race([this.changeOrderAddr(this.areaId), sleep(0.05)]);

        logger.info(`订单结算页面响应: ${res.status}`);

        // TODO: parse fingerprint
        // const tdjsCode = await mFetch('https://gias.jd.com/js/td.js').then((res) =>
        //   res.text()
        // );
        // new Function('$', tdjsCode)();
        // console.log(_JdJrTdRiskFpInfo);

        if (this.options.fp && this.options.eid) {
            this.fp = this.options.fp;
            this.eid = this.options.eid;
        } else if (this.fpRequired) {
            logger.info('获取必要信息中，大约需要30秒');

            const browser = await initBrowser();
            const { fp, eid } = await getFP(this.userAgent);
            this.fp = fp;
            this.eid = eid;

            await closeBrowser();

            logger.critical(`fp获取成功, fp: ${fp}, eid: ${eid}`);
        }
    }

    async submitOrder() {
        const url = 'https://trade.jd.com/shopping/order/submitOrder.action';
        const {
            eid = this.eid,
            fp = this.fp,
            riskControl,
            password,
        } = this.options;

        const payload = {
            overseaPurchaseCookies: '',
            vendorRemarks: '[]',
            'submitOrderParam.sopNotPutInvoice': 'false',
            'submitOrderParam.trackID': 'TestTrackId',
            'submitOrderParam.ignorePriceChange': '0',
            'submitOrderParam.btSupport': '0',
            // riskControl: '',
            'submitOrderParam.isBestCoupon': 1,
            'submitOrderParam.jxj': 1,
            'submitOrderParam.trackId': 'TestTrackId',
            'submitOrderParam.eid': eid || '',
            'submitOrderParam.fp': fp || '',
            'submitOrderParam.needCheck': 1,
        };

        if (this.isPreSale) {
            payload['submitOrderParam.presalePayType'] = 1;
            payload['submitOrderParam.payType4YuShou'] = 1;
            payload['preSalePaymentTypeInOptional'] = 1;
            payload['flowType'] = 15;
        }

        if (password) {
            payload['submitOrderParam.payPassword'] = encodePwd(password);
        }

        console.info(
            `submit_order req start at ${dateFormat(
                new Date(),
                'yyyy-MM-dd HH:mm:ss.SSS'
            )}`
        );

        const headers = new Headers(this.headers);
        headers.set('Host', 'trade.jd.com');
        headers.set(
            'Referer',
            'http://trade.jd.com/shopping/order/getOrderInfo.action'
        );
        headers.set('content-type', 'application/x-www-form-urlencoded');

        const res = await mFetch(url, {
            method: 'POST',
            headers,
            body: obj2qs(payload),
        });

        let ret = false;

        try {
            const retJson = await res.json();
            ret = retJson.success;
            if (!ret) {
                logger.critical(retJson);
            }
        } catch (error) {}

        return ret;
    }

    /**
     * 获取预约地址
     * @param {string} skuId "10025432414406"
     */
    async getReserveUrl(skuId) {
        const url = buildUrl('https://yushou.jd.com/youshouinfo.action', {
            queryParams: {
                callback: 'fetchJSON',
                sku: skuId,
            },
        });

        let res = await mFetch(
            url,
            {
                method: 'GET',
                referer: `https://item.jd.com/${skuId}.html`,
                headers: this.headers,
            }
        );
        // await logger.info(await res.text())
        const retJson = str2Json(await res.text());
        return retJson['url'] ? 'https:' + retJson['url'] : ''
    }

    /**
     * 根据skuId预约商品
     * @param {string} skuId "10025432414406"
     */
    async makeReserve(skuId) {
        if (!skuId) return;

        const reserveUrl = await this.getReserveUrl(skuId);

        if (!reserveUrl) {
            logger.info(`${skuId} 非预约商品`);
            return;
        }

        const res = await mFetch(
            reserveUrl,
            {
                method: 'GET',
                referer: `https://item.jd.com/${skuId}.html`,
                headers: this.headers,
            }
        );

        const $ = cheerio.load(await res.text());
        if ($('p.bd-right-code').text().trim()) {
            logger.info(`${skuId} 预约结果: 需要验证码, 无法预约`);
            return;
        }
        const reserveResult = $('p.bd-right-result').text().trim();
        logger.info(`${skuId} 预约结果: ${reserveResult}`);
    }

    /**
     * 预约所有商品
     */
    async reserveAll() {
        logger.info('尝试自动预约:')
        for (let { skuid, count } of this.skuids) {
            await this.makeReserve(skuid)
        }
    }

    /**
     * 定时下单
     * @param {string} time "yyyy-MM-dd HH:mm:ss.SSS"
     */
    async buyOnTime(time) {
        if (!time) time = this.buyTime;
        const setTimeStamp = Date.parse(time);
        const runOrder = async () => {
            // 流式并行处理加快速度，但可能出错
            await Promise.race([this.addCart(this.skuids), sleep(0.06)]);
            await Promise.race([
                this.getOrderInfo(),
                sleep(this.options.intersection || 0.5),
            ]);
            await this.submitOrder();
        };

        await this.cancelSelectCartSkus();
        await this.waiting4Start(setTimeStamp);
        await runOrder();
    }

    async seckillOnTime(time) {
        if (!time) time = this.buyTime;
        const setTimeStamp = Date.parse(time);
        const { skuid, count } = this.skuids[0];

        const ko = new SecKill({
            ...this.options,
            skuid,
            num: count,
            headers: this.headers,
        });

        const runOrder = async () => {
            // 抢5分钟
            if (Date.now() - setTimeStamp > 1000 * 60 * 30) {
                logger.critical('抢购时间已过，停止任务');
                return Deno.exit();
            }

            const koEnabled = await ko.getSeckillUrl();

            if (koEnabled) {
                await ko.getSecKillOrderInfo();
                logger.critical(`已获取到抢购地址: ${ko.url}`);
            }

            if (koEnabled && ko.koInfo) {
                const ret = await ko.submitSecKillOrder();
                logger.critical(ret);
                if (ret.success && ret.orderId) {
                    logger.info(
                        `恭喜！已抢到，订单号 ${ret.orderId}, 付款链接: ${ret.pcUrl}, 金额: ${ret.totalMoney}`
                    );
                    return ret;
                }
            } else {
                logger.critical('不存在抢购');
            }

            await sleep(random.real(2, 5));
            runOrder();
        };

        await this.cancelSelectCartSkus();
        await this.waiting4Start(setTimeStamp);
        await runOrder();
    }

    async fqkillOnTime(time, num = 1) {
        if (!time) time = this.buyTime;
        const setTimeStamp = Date.parse(time);
        const { skuid, count } = this.skuids[0];

        const fq = new FqKill({
            ...this.options,
            skuid,
            num: count,
            addr: this.addr,
            headers: this.headers,
        });

        clearInterval(this.fqCreateOrderTimer);
        this.fqCreateOrderTimer = setInterval(() => {
            fq.createOrder();
        }, 5 * 60 * 1000);

        await fq.createOrder();

        const runOrder = async () => {
            // 抢5分钟
            if (Date.now() - setTimeStamp > 1000 * 60 * 5) {
                logger.critical('抢购时间已过，停止任务');
                return Deno.exit();
            }

            if (await fq.submitOrder()) {
                return true;
            }

            await sleep(0.2);
            runOrder();
        };

        await this.cancelSelectCartSkus();
        await this.waiting4Start(setTimeStamp);
        await runOrder();
    }

    async timeSyncWithJD() {
        const syncStartTime = Date.now();
        const res = await mFetch(
            `https://gias.jd.com/js/td.js?t=${syncStartTime}`
        );
        const syncEndTime = Date.now();
        const xTrace = res.headers.get('x-trace');
        const resTimeStr = xTrace?.match(/.*;200\-(\d+)\-.*/);
        const serverTime = resTimeStr ? +resTimeStr[1] : Date.now();

        // 一般 resp download 时间远小于 TTFB
        const postConsume = parseInt((syncEndTime - syncStartTime) / 2, 10);

        // 每次同步再次计算平均偏移时间
        this.postConsumes.push(postConsume);

        console.info(`本次同步耗时 ${postConsume * 2} ms`);

        // 只取最后20个样本，多了干扰
        if (this.postConsumes.length > 20) {
            this.postConsumes.shift();
        }

        return serverTime;
    }

    async waiting4Start(setTimeStamp) {
        this.jdTime = Date.now();

        while (setTimeStamp > this.jdTime) {
            this.jdTime = await this.timeSyncWithJD();
            const timeRemainMS = setTimeStamp - this.jdTime - numAvg(this.postConsumes);
            const timeRemainSec = (timeRemainMS / 1000).toFixed(3);

            console.info(
                '\x1b[36m%s\x1b[0m',
                `[当前本地时间：${dateFormat(
                    new Date(),
                    'yyyy-MM-dd HH:mm:ss.SSS'
                )}，JD时间：${dateFormat(
                    new Date(this.jdTime),
                    'yyyy-MM-dd HH:mm:ss.SSS'
                )}] 距离抢购还剩 ${timeRemainSec} 秒`
            );

            // 30秒同步一次时间
            if (timeRemainSec > 5 * 60) {
                await sleep(random.real(5, 60));
            } else if (timeRemainSec > 10) {
                await sleep(random.real(5, 9));
            } else {
                console.log(
                    '\x1b[33m%s\x1b[0m',
                    `--------------闭眼祈祷, 默数${Math.ceil(
                        timeRemainSec
                    )}下再看结果喔---------------`
                );
                await sleep(timeRemainSec);
                break;
            }
        }
    }

    /**
     *
     *
     * @param {number} [interval=5]   轮询间隔，单位秒
     * @memberof MonkeyMaster
     */
    async buySingleSkuInStock(interval = 5) {
        const { skuid, count } = this.skuids[0];

        await this.prepareToOrder(this.skuids[0]);

        while (true) {
            const skuStockInfo = await this.getSkuStockInfo(
                [skuid],
                this.areaId
            );

            if (!skuStockInfo) {
                logger.debug(`${skuid} 库存查询异常，重新查询`);
                continue;
            }

            if (isInStock(skuStockInfo[skuid])) break;

            const runInterval = random.real(2, interval);

            logger.info(`${skuid} 暂无库存，${runInterval} 秒后再次查询`);

            await sleep(runInterval);
        }

        logger.info(`${skuid} 好像有货了喔，下单试试`);

        if (await this.submitOrder()) {
            return true;
        } else {
            await sleep(interval);
            return await this.buySingleSkuInStock(interval);
        }
    }

    async buyMultiSkusInStock(interval = 5) {
        let theSkuInStock = null;

        const skuids = this.skuids.map((sku) => sku.skuid);

        while (!theSkuInStock) {
            const skuStockInfo = await this.getSkuStockInfo(
                skuids,
                this.areaId
            );

            if (!skuStockInfo) {
                logger.debug(`${skuids} 库存查询异常，重新查询`);
                continue;
            }

            theSkuInStock = this.skuids.find(({ skuid }) =>
                isInStock(skuStockInfo[skuid])
            );

            if (theSkuInStock) break;

            const runInterval = random.real(2, interval);

            logger.info(`${skuids} 暂无库存，${runInterval} 秒后再次查询`);

            await sleep(runInterval);
        }

        logger.info(`${theSkuInStock.skuid} 好像有货了喔，下单试试`);

        await this.prepareToOrder(theSkuInStock);

        if (await this.submitOrder()) {
            return true;
        } else {
            await sleep(interval);
            return await this.buyMultiSkusInStock(interval);
        }
    }

    /**
     *
     * 下单准备（清空-加车-结算）
     * @param {Object} skuInfo
     * @returns
     */
    async prepareToOrder({ skuid, count = 1 }) {
        const cart = await this.getCartInfo();
        const skuDetails = cart.find(({ item }) => {
            if (item.items && item.items.length) {
                return item.items.some(({ item }) => item.Id === skuid);
            } else {
                // console.log(item.Id, skuid);
                return item.Id === skuid;
            }
        });

        if (skuDetails) {
            logger.info(`${skuid}在购物车中，尝试勾选ing`);
            const isSelected = await this.cartItemSelectToggle(
                skuDetails,
                count
            );

            if (!isSelected) {
                return logger.critical('商品勾选失败，检查配置');
            }
        } else {
            logger.info(`${skuid} 不在购物车中，尝试加车ing`);
            await this.addCart([{ skuid, count }]);
        }

        await this.getOrderInfo();
    }

    async loginCheck(url) {
        if (/(login|passport)/g.test(url)) {
            return await this.loginByQRCode();
        } else {
            return true;
        }
    }

    /**
     *
     *
     * @param {Array} skuids
     * @param {String} areaId
     */
    async getSkuStockInfo(skuids, areaId) {
        const url = buildUrl('https://c0.3.cn/stocks', {
            queryParams: {
                callback: `jQuery${random.int(1000000, 9999999)}`,
                type: 'getstocks',
                skuIds: skuids.join(','),
                area: areaId,
                _: String(Date.now()),
            },
        });

        let stockInfo;

        try {
            const res = await mFetch(url, { timeout: 1000 });

            if (res.ok) {
                stockInfo = str2Json(await res.text());
            }
        } catch {}

        return stockInfo;
    }

    async getCartInfo() {
        const url = buildUrl('https://api.m.jd.com/api', {
            queryParams: {
                // functionId: 'pcCart_jc_getCurrentCart',
                functionId: 'pcCart_jc_cartUnCheckAll',
                appid: 'JDC_mall_cart',
                loginType: 3,
            },
        });

        const payload = {
            serInfo: {
                area: this.areaId,
                'user-key': getCookie(this.headers.get('Cookie'), 'user-key'),
            },
            cartExt: {
                specialId: 1,
            },
        };

        this.headers.set('Referer', 'https://cart.jd.com/');

        const res = await mFetch(url, {
            headers: this.headers,
            body: JSON.stringify(payload),
        });

        if (res.url !== url) {
            await this.loginCheck(res.url);
        }

        let cartInfo = await res.json();
        let vendors = [];
        let ret = [];

        try {
            cartInfo = cartInfo['resultData']['cartInfo'];
            vendors = cartInfo['vendors'];

            for (let vendor of vendors) {
                ret = ret.concat(vendor['sorted']);
            }
        } catch (error) {}

        return ret;
    }

    async cancelSelectCartSkus() {
        const url = 'https://cart.jd.com/cancelAllItem.action';

        const payload = {
            t: 0,
            outSkus: '',
            random: random.int(1000000, 9999999),
        };

        const res = await mFetch(url, {
            method: 'POST',
            headers: this.headers,
            payload: JSON.stringify(payload),
        });

        this.saveCookie(res.headers.get('set-cookie'));
        return res.headers.status === 200;
    }

    /**
     * 修改购物车中商品勾选切换，并可修改数量
     * @param {Object} singleItem sku details
     * @param {Number} count 勾选数量
     */
    async cartItemSelectToggle(singleItem, count) {
        const promotionId = singleItem.item.promotionId;

        if (promotionId && singleItem.item.items) {
            singleItem = singleItem.item.items[0];
        }

        const {
            item: { olderVendorId, Id, skuUuid, useUuid },
            checkedNum,
        } = singleItem;

        const theSkus = [
            {
                Id,
                num: count || checkedNum,
                skuUuid,
                useUuid,
            },
        ];

        const payload = {
            operations: [{ TheSkus: theSkus }],
            serInfo: { area: this.areaId },
        };

        if (promotionId && singleItem.item.items) {
            payload.operations = [
                {
                    carttype: '3',
                    ThePacks: [
                        {
                            num: 1,
                            sType: 13,
                            Id: promotionId,
                            TheSkus: theSkus,
                        },
                    ],
                },
            ];
        }

        const url = buildUrl('https://api.m.jd.com/api', {
            queryParams: {
                functionId: 'pcCart_jc_changeSkuNum',
                appid: 'JDC_mall_cart',
                loginType: 3,
                body: JSON.stringify(payload),
            },
        });

        this.headers.set('Referer', 'https://cart.jd.com/');

        const res = await mFetch(url, {
            method: 'POST',
            headers: this.headers,
        }).then((r) => r.json());

        return res.code === 0;
    }

    async changeOrderAddr(areaId) {
        const [provinceId, cityId, countyId, townId] = areaId
            .split('_')
            .map((item) => Number(item));

        const headers = new Headers(this.headers);
        headers.set('Host', 'trade.jd.com');
        headers.set(
            'Referer',
            'http://trade.jd.com/shopping/order/getOrderInfo.action'
        );
        headers.set('content-type', 'application/x-www-form-urlencoded');

        await mFetch(
            'https://trade.jd.com/shopping/dynamic/consignee/saveConsignee.action',
            {
                method: 'POST',
                headers,
                body: obj2qs({
                    'consigneeParam.newId': this.addr.id,
                    'consigneeParam.type': null,
                    'consigneeParam.commonConsigneeSize': 20,
                    'consigneeParam.isUpdateCommonAddress': 0,
                    'consigneeParam.giftSenderConsigneeName': '',
                    'consigneeParam.giftSendeConsigneeMobile': '',
                    'consigneeParam.noteGiftSender': false,
                    'consigneeParam.isSelfPick': 0,
                    'consigneeParam.selfPickOptimize': 0,
                    'consigneeParam.pickType': 0,
                }),
            }
        );
    }
}
