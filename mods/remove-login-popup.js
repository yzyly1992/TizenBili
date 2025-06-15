// ==UserScript==
// @name         Bilibili - 防止在首页下拉刷新时被要求登录
// @namespace    https://bilibili.com/
// @version      0.1
// @description  防止在首页下拉刷新时被要求登录
// @license      GPL-3.0
// @author       DD1969
// @match        https://www.bilibili.com/
// @icon         https://www.bilibili.com/favicon.ico
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
 
(async function() {
  'use strict';
 
  // no need to continue this script if user has logged in
  if (document.cookie.includes('DedeUserID')) return;
 
  // remove 'buvid3' from cookie everytime when trying to fetch recommand video data
  const originFetch = unsafeWindow.fetch;
  unsafeWindow.fetch = function () {
    if (typeof arguments[0] === 'string' && arguments[0].includes('top/feed/rcmd')) {
      document.cookie = `buvid3=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=.bilibili.com;path=/`;
    }
    return originFetch.apply(this, arguments);
  }
 
})();
