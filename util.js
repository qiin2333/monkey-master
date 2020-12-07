/**
 *
 */
export function str2Json(str) {
  return JSON.parse(str.replace(/^.*{/, '{').replace(/}.*$/, '}'));
}

export function getCookie(cookieStr, key) {
  const reg = new RegExp(`${key}=(.*?);`, 'm');
  return cookieStr.match(reg)[1];
}
