/**
 *
 */
export function str2Json(str) {
    return JSON.parse(str.replace(/^.*?\(/, '').replace(/\);?$/m, ''));
}

/**
 *
 * @param  {String} cookies     headers['set-cookie'] value
 * @return {String}
 */
export function cookieParse(cookies = '') {
    return cookies
        .split(',')
        .map((str) => str.split(';')[0].trim())
        .join('; ');
}

export function getCookie(cookieStr, key) {
    const reg = new RegExp(`${key}=(.*?)(;|$)`, 'm');
    const match = cookieStr.match(reg);
    if (!match) {
        console.error('cookie解析出错，删除users目录对应cookie文件后重试');
        return '';
    }
    return cookieStr.match(reg)[1];
}

export function encodePwd(pwd) {
    return String(pwd)
        .split('')
        .map((char) => 'u3' + char)
        .join('');
}

/**
 *
 * object params to querystring
 * @param {Object} obj
 * @returns
 */
export function obj2qs(obj) {
    return new URLSearchParams(
        Object.keys(obj).map((k) => [k, obj[k]])
    ).toString();
}

export function numAvg(arr) {
    let len = arr.length;
    let sum = arr.reduce((a, c) => a + c);

    if (len > 5) {
        sum = sum - Math.max(...arr) - Math.min(...arr);
        len -= 2;
    }

    return sum / len;
}

export function arrayMedian(arr) {
    const len = arr.length;
    arr.sort();

    if (len % 2 === 0) {
        return (arr[len / 2 - 1] + arr[len / 2]) / 2;
    }

    return arr[Math.floor(len / 2)];
}

export function genAreaId(addr, separator = '_') {
    const { provinceId, cityId, countyId, townId } = addr;
    return `${provinceId}${separator}${cityId}${separator}${countyId}${separator}${townId}`;
}

/**
 * 商品库存状态：33 -- 现货  0,34 -- 无货  36 -- 采购中  40 -- 可配货
 * @param {Object} skuStockInfo
 * @returns
 */
export function isInStock(skuStockInfo = {}) {
    return (
        skuStockInfo &&
        skuStockInfo['skuState'] === 1 &&
        [33, 36, 39, 40].includes(skuStockInfo['StockState'])
    );
}

/**
 *
 * 打平商品信息结构
 * @export
 * @param {Object} list
 */
export function itemFilter(list) {
    let ret = [];
    for (let { item } of list) {
        if (item.items && item.items.length) {
            ret = ret.concat(itemFilter(item.items));
        } else {
            ret.push(item);
        }
    }

    return ret;
}

/**
 *
 * @param {*} options
 */
export function getCommonH5ReqData(options) {
    const payload = {
        appid: 'JDReactXxfgyl',
        client: 'jddx_m',
        clientVersion: '8.0.0',
        t: String(Date.now()),
        body: {
            skuId: '',
            sdkName: 'productDetail',
            sdkClient: 'h5',
            sdkVersion: '1.1.0',
            ...options,
        },
    };
}

/**
 *
 * @param {*} options
 * @returns
 */
export function makeCommonPostFormData(options) {
    const urlencoded = new URLSearchParams();
    urlencoded.append('appid', 'JDReactXxfgyl');
    urlencoded.append('functionId', 'wareBusiness.style');
    urlencoded.append('client', 'jddx_m');
    urlencoded.append('clientVersion', '8.0.0');
    return urlencoded;
}
