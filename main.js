import { osType } from 'https://deno.land/std@0.79.0/_util/os.ts';
import { buildUrl } from 'https://deno.land/x/url_builder/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { exec } from 'https://deno.land/x/exec/mod.ts';
import Random from 'https://deno.land/x/random@v1.1.2/Random.js';

import { logger } from './log.js';
import { str2Json, getCookie, cookieParse } from './util.js';

const random = new Random();

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';

class MonkeyMaster {
  constructor(options = {}) {
    this.skuids = (options.skuids || '').split(',');
    this.userAgent = options.useRandomUA
      ? this.getRandomUA()
      : DEFAULT_USER_AGENT;
    this.headers = new Headers({
      'User-Agent': this.userAgent,
      'cache-control': 'no-cache',
      'x-requested-with': 'XMLHttpRequest',
    });
    this.userPath = options.userPath || './cookies/';
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
      this.headers.set('Referer','https://passport.jd.com/uc/login?ltype=logout');

      const r = await fetch(
        buildUrl('https://passport.jd.com/uc/qrCodeTicketValidation', {
          queryParams: { t: ticket },
        }),
        {
          method: 'GET',
          headers: this.headers,
          credentials: 'include',
        }
      ).then(res => {
        this.saveCookie(res.headers.get('set-cookie'));
        return res;
      })

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

    console.log(await res.text(), '----------------userInfo')
  }

  saveCookie(cookie) {
    // console.log(cookie);
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
        }
      })

      this.headers.set('Referer', `https://item.jd.com/${skuid}.html`)
      const res = await fetch(url, {headers: this.headers});
      const ret = await this.loginCheck(res.url);

      if (ret) {
        logger.info(`商品${skuid}-加车成功`);
      } else {
        logger.info(`商品${skuid}-加车失败`);
        return ret
      }
    }

    return true;
  }

  async loginCheck(url) {
    if (/login\.aspx/g.test(url)) {
      return await this.loginByQRCode()
    } else {
      return true
    }
  }
}

const ins = new MonkeyMaster({
  skuids: prompt('输入抢购skuid', '100015521042'),
});
