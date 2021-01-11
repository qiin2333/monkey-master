import { buildUrl } from 'https://deno.land/x/url_builder/mod.ts';
// import { sleep } from 'https://deno.land/x/sleep/mod.ts';
import { logger } from './log.js';
import Random from 'https://deno.land/x/random@v1.1.2/Random.js';
import mFetch from './fetch.js';
import { str2Json, obj2qs } from './util.js';

const random = new Random();

export default class SecKill {
    constructor(options = {}) {
        this.options = options;
        this.skuid = options.skuid;
        this.num = options.num;
        this.headers = new Headers(options.headers);
        this.koInfo = {};
    }

    async getSeckillUrl() {
        // const skuId = this.skuid;
        // const url = buildUrl('https://itemko.jd.com/itemShowBtn', {
        //     queryParams: {
        //         skuId,
        //         from: 'pc',
        //         callback: `jQuery${random.int(1000000, 9999999)}`,
        //         _: String(Date.now()),
        //     },
        // });

        // this.headers.set('Host', 'itemko.jd.com');
        // this.headers.set('Referer', `https://item.jd.com/${skuId}.html`);

        // const res = await mFetch(url, {
        //     headers: this.headers,
        // });

        // const ret = str2Json(await res.text());

        // this.url = ret.url;
        // return ret.url;

        return `https://marathon.jd.com/seckill/seckill.action?skuId=${
            this.skuid
        }&num=${this.num}&rid=${Date.now()}`;
    }

    async getSecKillOrderInfo() {
        // await mFetch(this.url, { headers: this.headers });

        this.headers.set('Host', 'marathon.jd.com');
        this.headers.set('Referer', this.url);
        this.headers.set('content-type', 'application/x-www-form-urlencoded');

        const payload = {
            sku: this.skuid,
            num: this.num,
            isModifyAddress: false,
        };

        const res = await mFetch(
            'https://marathon.jd.com/seckillnew/orderService/pc/init.action',
            {
                method: 'POST',
                headers: this.headers,
                body: obj2qs(payload),
            }
        );

        const koInfo = await res.json();
        this.koInfo = koInfo;

        return koInfo;
    }

    async submitSecKillOrder() {
        const url = `https://marathon.jd.com/seckillnew/orderService/pc/submitOrder.action?skuId=${this.skuid}`;
        const { eid = '', fp = '', password } = this.options;
        const { addressList, buyNum, invoiceInfo, token } = this.koInfo;

        const payload = {
            skuId: this.skuid,
            num: buyNum,
            addressId: addressList[0].id,
            yuShou: true,
            isModifyAddress: false,
            name: addressList[0]['name'],
            provinceId: addressList[0]['provinceId'],
            cityId: addressList[0]['cityId'],
            countyId: addressList[0]['countyId'],
            townId: addressList[0]['townId'],
            addressDetail: addressList[0]['addressDetail'],
            mobile: addressList[0]['mobile'],
            mobileKey: addressList[0]['mobileKey'],
            email: addressList[0]['email'],
            postCode: addressList[0]['postCode'],
            invoiceTitle: invoiceInfo['invoiceTitle'],
            invoiceCompanyName: '',
            invoiceContent: invoiceInfo['invoiceContentType'],
            invoiceTaxpayerNO: '',
            invoiceEmail: invoiceInfo['invoiceEmail'],
            invoicePhone: invoiceInfo['invoicePhone'],
            invoicePhoneKey: invoiceInfo['invoicePhoneKey'],
            invoice: true,
            password: '',
            codTimeType: 3,
            paymentType: 4,
            areaCode: addressList[0]['areaCode'],
            overseas: 0,
            phone: '',
            eid,
            fp,
            token,
            pru: '',
            provinceName: addressList[0]['provinceName'],
            cityName: addressList[0]['cityName'],
            countyName: addressList[0]['countyName'],
            townName: addressList[0]['townName'],
        };

        const res = await mFetch(url, {
            method: 'POST',
            headers: this.headers,
            body: obj2qs(payload),
        });

        let ret = false;

        try {
            ret = await res.json();
        } catch (error) {}

        return ret;
    }
}
