/**
 *
 */
export function str2Json(str) {
    return JSON.parse(str.replace(/^.*?\(/, '').replace(/\)$/m, ''));
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
        [33, 36, 40].includes(skuStockInfo['StockState'])
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
