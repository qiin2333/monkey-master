import { osType } from 'https://deno.land/std@0.79.0/_util/os.ts';
import { buildUrl } from 'https://deno.land/x/url_builder/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { exec } from 'https://deno.land/x/exec/mod.ts';
import Random from 'https://deno.land/x/random@v1.1.2/Random.js';
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';

import { logger } from './log.js';
import { str2Json, getCookie, cookieParse, encodePwd } from './util.js';

const random = new Random();
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';
const CONFIG = await loadJsonFile('conf.json');
const skuInfoCache = {};

class MonkeyMaster {
  constructor(options = {}) {
    this.skuids = (options.skuids || '').split(',');
    this.eid = CONFIG.orderDeps.eid || prompt('未配置 eid, 请输入');
    this.fp = CONFIG.orderDeps.fp || prompt('未配置 fp, 请输入');
    this.areaId = CONFIG.orderDeps.area || prompt('未配置 area, 请输入');
    this.userAgent = CONFIG.useRandomUA
      ? this.getRandomUA()
      : DEFAULT_USER_AGENT;
    this.headers = new Headers({
      'User-Agent': this.userAgent,
      'cache-control': 'no-cache',
      'x-requested-with': 'XMLHttpRequest',
    });
    this.userPath = CONFIG.userPath || './cookies/';
    this.isLogged = false;
    this.init();
  }

  async init() {
    await this.validateCookies();
    const islogin = await this.loginByQRCode();
    if (islogin) {
      logger.info('登录成功了，来造作吧！');
    } else {
      return logger.error('登录失败');
    }
    await this.getUserInfo();
    await this.addCart(this.skuids);
    await this.buyInStock();
  }

  async checkLoginStatus() {
    await this.validateCookies();
  }

  async validateCookies() {
    const url = buildUrl('https://order.jd.com/center/list.action', {
      queryParams: { rid: Date.now() },
    });

    const res = await fetch(url);
  }

  async getQRCode() {
    const url = buildUrl('https://qr.m.jd.com/show', {
      queryParams: { appid: 133, size: 147, t: String(Date.now()) },
    });

    const blob = await fetch(url, {
      method: 'GET',
      referrer: 'https://passport.jd.com/new/login.aspx',
      headers: this.headers,
    }).then((res) => {
      this.saveCookie(res.headers.get('set-cookie'));
      return res.blob();
    });

    console.log(blob.size);
    const buffer = await blob.arrayBuffer();
    const unit8arr = new Deno.Buffer(buffer).bytes();
    Deno.writeFileSync('qrcode.png', unit8arr);
    return await exec('open qrcode.png');
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

    // 只能这样写 referer 才能参数正确，JD 后台贱货
    this.headers.set('Referer', 'https://passport.jd.com/');

    let r = await fetch(url, {
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
    const res = await fetch('https://passport.jd.com/new/login.aspx', {
      headers: this.headers,
    });

    this.saveCookie(res.headers.get('set-cookie'));

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

      const r = await fetch(
        buildUrl('https://passport.jd.com/uc/qrCodeTicketValidation', {
          queryParams: { t: ticket },
        }),
        {
          method: 'GET',
          headers: this.headers,
          credentials: 'include',
        }
      ).then((res) => {
        this.saveCookie(res.headers.get('set-cookie'));
        return res;
      });

      return r.status === 200;
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

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers.set(
        'Referer',
        'https://order.jd.com/center/list.action'
      ),
      credentials: 'include',
      redirect: 'error',
    });

    console.log(await res.text(), '----------------userInfo');
  }

  saveCookie(cookie) {
    const oldCookie = this.headers.get('Cookie');
    let newCookie = cookieParse(cookie);

    if (oldCookie) {
      newCookie = oldCookie + '; ' + newCookie;
    }

    return this.headers.set('Cookie', newCookie);
    // this.headers['Cookie'] = cookie;
  }

  /**
   *
   * @param {Array} skuids
   */
  async addCart(skuids = []) {
    let url = 'https://cart.jd.com/gate.action';
    const payload = { pcount: 1, ptype: 1 };

    for (let skuid of skuids) {
      url = buildUrl(url, {
        queryParams: {
          pid: skuid,
          ...payload,
        },
      });

      this.headers.set('Referer', `https://item.jd.com/${skuid}.html`);
      const res = await fetch(url, { headers: this.headers });
      const ret = await this.loginCheck(res.url);

      if (ret) {
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
    const url = buildUrl(
      'http://trade.jd.com/shopping/order/getOrderInfo.action',
      {
        queryParams: {
          rid: String(Date.now()),
        },
      }
    );

    const res = await fetch(url);
    console.log(await res.text());
  }

  async submitOrder() {
    const url = 'https://trade.jd.com/shopping/order/submitOrder.action';
    const orderDeps = CONFIG.orderDeps;

    const payload = {
      overseaPurchaseCookies: '',
      vendorRemarks: '[]',
      'submitOrderParam.sopNotPutInvoice': 'false',
      // 'submitOrderParam.presalePayType': 1,   # 预售
      'submitOrderParam.trackID': 'TestTrackId',
      'submitOrderParam.ignorePriceChange': '0',
      'submitOrderParam.btSupport': '0',
      riskControl: orderDeps.riskControl,
      'submitOrderParam.isBestCoupon': 1,
      'submitOrderParam.jxj': 1,
      'submitOrderParam.trackId': 'TestTrackId',
      // 'submitOrderParam.payType4YuShou': 1,    # 预售
      'submitOrderParam.eid': this.eid,
      'submitOrderParam.fp': this.fp,
      'submitOrderParam.needCheck': 1,
    };

    if (orderDeps.password) {
      payload['submitOrderParam.payPassword'] = encodePwd(orderDeps.password);
    }

    this.headers.set('Host', 'trade.jd.com');
    this.headers.set(
      'Referer',
      'http://trade.jd.com/shopping/order/getOrderInfo.action'
    );
    this.headers.set('content-type', 'application/x-www-form-urlencoded');

    logger.info(`submit_order req start at ${Date()}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    console.log(await res.text());

    return res.status === 200;
  }

  /**
   * 定时下单
   */
  async buyOnTime() {}

  /**
   *
   *
   * @param {number} [interval=5]   轮询间隔，单位秒
   * @memberof MonkeyMaster
   */
  async buyInStock(interval = 5) {
    let isInStock = false;

    while (!isInStock) {
      isInStock = await this.getSkuStockInfo(this.skuids, this.areaId);
      await sleep(interval);
    }
    await this.getOrderInfo();
    await this.submitOrder();
  }

  async loginCheck(url) {
    if (/login\.aspx/g.test(url)) {
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

    const res = await fetch(url, { headers: this.headers });
    const stockInfo = str2Json(await res.text());

    logger.info(stockInfo, '库存信息');

    return (
      stockInfo &&
      stockInfo['skuState'] === 1 &&
      [33, 40].includes(stockInfo['StockState'])
    );
  }

  async getCartInfo() {
    const url = buildUrl('https://api.m.jd.com/api', {
      queryParams: {
        functionId: 'pcCart_jc_getCurrentCart',
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

    const res = await fetch(url, {
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    let cartInfo = {};
    let vendors = [];
    let ret = [];

    try {
      cartInfo = str2Json(await res.text())['resultData']['cartInfo'];
      vendors = cartInfo['vendors'];

      for (let vendor of vendors) {
        ret.push(vendor['sorted']);
      }
    } catch (error) {}

    return ret;
  }

  async cancelSelectCartSkus() {
    const url = 'https://cart.jd.com/cancelAllItem.action';
    const payload = {
      t: 0,
      outSkus: '',
      random: random.int(),
    };

    return await fetch(url, {
      payload: JSON.stringify(payload),
    }).then((res) => res.headers.status === 200);
  }
}

const ins = new MonkeyMaster({
  skuids: prompt('输入抢购skuid,可以是多个，以逗号(,)分割', '100015521042'),
});
