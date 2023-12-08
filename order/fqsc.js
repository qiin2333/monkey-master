/**
 * 分期商城下单逻辑
 *
 */

import { fetchOnce as mFetch, fetchAndRetry } from '../util/fetch.js';
import { genAreaId } from '../util/util.js';
import { logger } from '../util/log.js';
import { Hash, encode } from 'https://deno.land/x/checksum@1.2.0/mod.ts';

export default class SecKill {
    constructor(options = {}) {
        this.options = options;
        this.skuid = options.skuid;
        this.num = options.num || 1;
        this.pwd = new Hash('md5').digest(encode(options.password)).hex();
        this.headers = new Headers(options.headers);
        this.headers.set('Host', 'api.m.jd.com');
        this.headers.set('Origin', 'https://fq.jr.jd.com');
        this.headers.set(
            'User-Agent',
            'Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045426 Mobile Safari/537.36/application=JDJR-App&clientType=android&src=xiaomi&version=6.0.60&clientVersion=6.0.60&osVersion=10&osName=M2006J10C&isUpdate=0&HiClVersion=6.0.60&netWork=1&netWorkType=4&CpayJS=UnionPay/1.0 JDJR&sPoint=&*#@jdPaySDK*#@jdPayChannel=jdFinance&jdPayChannelVersion=6.0.60&jdPaySdkVersion=3.00.35.00&androidBrand=Redmi&androidManufacturer=Xiaomi&jdPayClientName=Android*#@jdPaySDK*#@'
        );
        this.headers.set('content-type', 'application/x-www-form-urlencoded');
        this.headers.set('X-Requested-With', 'com.jd.jrapp');
    }

    /**
     *
     * @param {Object} options skuid, headers...
     */
    async createOrder() {
        const url = `https://api.m.jd.com/api?functionId=j_currentOrder_floor`;
        const headers = this.headers;
        headers.set('Referer', 'https://fq.jr.jd.com/');

        const { addr, fp, eid, h5st } = this.options;

        const payload = {
            cartAdd: {
                wareId: String(this.skuid),
                wareNum: this.num,
            },
            addressGlobal: true,
            addressTotalNum: 20,
            giftType: 0,
            hasSelectedOTC: '0',
            isLastOrder: true,
            isOneHour: false,
            isRefreshOrder: false,
            isSupportAllInvoice: true,
            operationType: 0,
            settlementVersionCode: 708,
            skuSource: 0,
            sourceType: 2,
            supportAllEncode: false,
            isFloor: true,
            OrderStr: {},
            isInternational: false,
            pingou_activeId: '',
            pingou_bizvalue: '',
            pingou_bizkey: '',
            extAttrMap: {
                mkjdcn: '',
                url: '',
                environments: 1,
            },
            apolloId: '0fe444b5de424623b76c9288dfadf2d5',
            apolloSecret: 'a4060564b2c74daaa09f0480de1be1b1',
            sdkClient: 'plugin_m',
            sdkName: 'checkout',
            sdkVersion: '1.0.0',
            accessToken: '',
        };

        const urlencoded = new URLSearchParams();
        urlencoded.append('appid', 'JDReactXxfgyl');
        urlencoded.append('body', JSON.stringify(payload));
        urlencoded.append('t', String(Date.now()));
        urlencoded.append('client', 'jddx_m');
        urlencoded.append('clientVersion', '8.0.0');
        urlencoded.append('x-api-eid-token', eid);
        urlencoded.append('h5st', h5st);

        await mFetch(url, {
            method: 'POST',
            headers,
            body: urlencoded,
            redirect: 'follow',
        })
            .then((response) => response.json())
            .then((result) => console.info(result, '\n ------- 下单信息'))
            .catch((error) => logger.error(error));
    }

    async submitOrder() {
        const url = `https://api.m.jd.com/api?functionId=j_submitOrder_floor`;
        const headers = this.headers;
        headers.set(
            'Referer',
            `https://q.jd.com/m/xj/index.html?skuId=${this.skuid}&xxfSceneId=A340047790792949760`
        );

        const { addr, fp, eid, h5st } = this.options;

        const payload = {
            AppKeplerParams: {},
            OrderStr: {
                securityPayPassword: this.pwd,
                identityCard: '',
            },
            transferJson: {
                isNIOUser: false,
                productCount: 1,
                addressTotalNum: 20,
                addressId: addr.id,
                selectedCouponNum: 1,
                skuSource: 0,
                hasSelectedOTC: '0',
                selectedShipTypeForLego: '0',
                solidCard: false,
                price: 999,
                isPresale: false,
                invoiceType: 1,
                immediatelyBuy: true,
                version: '7.4.4',
                supportJZD: '0',
                sopBigSkuIds: ['25612010530'],
                venderIdSetSize: 1,
                sourceType: 2,
                // sopJdShipmentMap: [
                //     {
                //         promiseSendPay: {
                //             1: 2,
                //             30: 2,
                //             35: 4,
                //             161: 0,
                //             237: 4,
                //             278: 0,
                //         },
                //         promiseDate: '2021-1-13',
                //         shipmentId: 68,
                //         venderId: '708466',
                //         promiseTimeRange: '09:00-21:00',
                //         batchId: 1,
                //     },
                // ],
                isSupportAllInvoice: true,
                isSupportWmGiftCard: '0',
                venderType: 0,
                isPinGou: false,
                otcMergeSwitch: '',
                freight: 0,
                platform: 'apple',
                paymentType: 4,
                userLevel: -99999999,
                locOrderType: 0,
                selectedBZD: '0',
                isInternational: false,
                selectedJZD: '0',
                isContainGift: 0,
                xbCreditScore: 102.7,
                address: genAreaId(addr, ','),
                business: '1',
                tuanState: '',
                supportShipType: '0,10',
                plusFlag: '201',
                isHasSopVender: true,
                venderAmount: 1,
                useBestCoupon: true,
                isNewUser: false,
                adressRetTag: 2,
                isSupportJdBeanBanner: false,
                isSelectWmCard: '0',
                isIousBuy: false,
                isInternationalAndPresale: false,
                category: '670:677:680',
                isRealName: true,
            },
            UsualExtParams: {
                xxfSceneId: 'A340047790792949760',
                defChannel: 'baitiao',
                planId: 3,
                bankNo: 'bt',
                xxfSkuGroupId: '',
            },
            extAttrMap: {
                mkjdcn: '',
                url: '',
                environments: 1,
            },
            unpl: 'V2_ZzNtbUsEQxN0CkMEfE0LBWIAEgkRUUoWIVtAXChMCFdgBxBaclRCFnUUR1RnGV8UZwUZWEBcQhJFCHZUehhdAmYBF19LZ3Mldgh2XUsZWwRhBxBcRVFHFnINQF1/HFsDYwoQbXJXQh1FC0JTexpdBWYHEFxygeuZoqTWgN+uiKvYMxJbSlFFFXwMQlVLGGwHZgISWUtVQhF3OA06elRcAmYFFl9DUEURdg9DUnIdWQJhBxtfclZzFg==',
            orderUnion: '',
            supportAllEncode: false,
            sourceType: 2,
            isPinGou: false,
            conditionSendPay: {},
            isPresale: false,
            apolloId: '0fe444b5de424623b76c9288dfadf2d5',
            apolloSecret: 'a4060564b2c74daaa09f0480de1be1b1',
            sdkClient: 'plugin_m',
            sdkName: 'checkout',
            sdkVersion: '1.0.0',
            accessToken: '',
        };

        const urlencoded = new URLSearchParams();
        urlencoded.append('appid', 'JDReactXxfgyl');
        urlencoded.append('body', JSON.stringify(payload));
        urlencoded.append('t', String(Date.now()));
        urlencoded.append('client', 'jddx_m');
        urlencoded.append('clientVersion', '8.0.0');
        urlencoded.append('x-api-eid-token', eid);
        urlencoded.append('h5st', h5st);

        const res = await mFetch(url, {
            method: 'POST',
            headers,
            body: urlencoded,
            redirect: 'follow',
        });

        let ret = {};

        try {
            ret = await res.json();
        } catch (error) {}

        logger.warning(ret);

        return ret.submitOrder?.Flag;
    }
}

/*
{
    "submitOrder": {
        "UseScore": 0,
        "Message": "下单成功！",
        "SubmitSkuNum": 3,
        "OrderId": 123456,
        "submitWithWmCard": "0",
        "Flag": true,
        "UseBalance": 0,
        "cartInfo": [
            {
                "num": 2,
                "skuId": 123456
            },
            {
                "num": 1,
                "skuId": 123456
            }
        ],
        "OrderType": 0,
        "Price": 1896.76,
        "IdCompanyBranch": 10,
        "FactPrice": 1896.76,
        "MessageType": 0,
        "IdPaymentType": 4
    },
    "coMsg": "重要提示：京东平台及销售商不会以订单异常、系统升级为由要求您点击任何网址链接进行退款操作。\n",
    "code": 0,
    "floors": [],
    "onlinePay": true
}
*/
