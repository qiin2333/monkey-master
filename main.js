import { osType } from 'https://deno.land/std@0.79.0/_util/os.ts';
import { buildUrl } from 'https://deno.land/x/url_builder/mod.ts';
import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { exec } from 'https://deno.land/x/exec/mod.ts';
import Random from 'https://deno.land/x/random@v1.1.2/Random.js';

import { logger } from './log.js';
import { str2Json, getCookie } from './util.js';

const random = new Random();

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.67 Safari/537.36';

class MonkeyMaster {
  constructor(options = {}) {
    this.skuid = options.skuid;
    this.userAgent = options.useRandomUA
      ? this.getRandomUA()
      : DEFAULT_USER_AGENT;
    this.headers = { 'User-Agent': this.userAgent };
    this.userPath = options.userPath || './cookies/';
    this.isLogged = false;
    this.init();
  }

  init() {
    this.checkLoginStatus();
    this.loginByQRCode();
  }

  async checkLoginStatus() {
    this.validateCookies();
  }

  async validateCookies() {
    const url = buildUrl('https://order.jd.com/center/list.action', {
      queryParams: { rid: Date.now() },
    });

    await fetch(url).then(res => {
      console.log(res.headers)
    })
  }

  async getQRCode() {
    const url = buildUrl('https://qr.m.jd.com/show', {
      queryParams: { appid: 133, size: 147, t: Date.now() },
    });

    const blob = await fetch(url, {
      method: 'GET',
      body: null,
      referrer: 'https://passport.jd.com/new/login.aspx',
      credentials: 'include',
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
        appid: 133,
        callback: `jQuery${random.int(1000000, 9999999)}`,
        token: getCookie(this.cookies, 'wlfstk_smdl'),
        _: Date.now(),
      },
    });

    let r = await fetch(url, {
      method: 'GET',
      body: null,
      referrer: 'https://passport.jd.com/new/login.aspx',
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
    await fetch('https://passport.jd.com/new/login.aspx', {
      headers: this.headers,
    });

    await this.getQRCode();

    const timeLmt = 30 * 1000;
    const startTime = Date.now();
    let ticket;

    while (!ticket && Date.now() - startTime < timeLmt) {
      ticket = await this.getQRCodeTicket();
      await sleep(2);
    }

    // 校验 ticket
    if (ticket) {
      const r = fetch(
        buildUrl('https://passport.jd.com/uc/qrCodeTicketValidation', {
          queryParams: { t: ticket },
        }),
        {
          headers: this.headers,
          referrer: 'https://passport.jd.com/uc/login?ltype=logout',
        }
      );

      console.log(r);
    }
  }

  saveCookie(cookie) {
    this.cookies = cookie;
    // this.headers['Cookie'] = cookie;
  }
}

const ins = new MonkeyMaster({
  skuid: prompt('输入抢购skuid', '100016516660'),
});
