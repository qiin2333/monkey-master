/**
 *
 */
export function str2Json(str) {
  return JSON.parse(str.replace(/^.*{/, '{').replace(/}.*$/, '}'));
}

/**
 *
 * @param  {String} cookies     headers['set-cookie'] value
 * @return {String}
 */
export function cookieParse(cookies) {
  return cookies
    .split(',')
    .map((str) => str.split(';')[0].trim())
    .join('; ');
}

export function getCookie(cookieStr, key) {
  const reg = new RegExp(`${key}=(.*?)(;|$)`, 'm');
  console.log(cookieStr.match(reg))
  return cookieStr.match(reg)[1];
}
