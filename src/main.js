import 'mint-ui/lib/style.css'

import MintUI from 'mint-ui'
import Vue from 'vue'
import axios from 'axios'
import copy from 'copy-to-clipboard'
import App from './App'
import router from './router'
import { wxOAuth2RedirectUrl } from './utils/constants'

/* 检测当前页面所处的浏览器环境 */
const browser = require('./utils/browser')
const $browser = new browser.Browser(window.navigator.userAgent)

let token

/* 从 cookie 中获取 token */
const result = document.cookie.match(/qingtoken=(QJWT [\w\.\-]+)/) // eslint-disable-line

/* 销毁 cookie 中的 token */
document.cookie = `qingtoken=none; expires=${new Date(0)};`

/* 如果当前 cookie 中存在 token 值，说明用户是通过扫描二维码进入的，此时 cookie 中的 */
/* token 值是最新的，则将 token 值保存到 localStorage 中；如果 cookie 中没有 */
/* token，则表示用户不是通过扫描二维码进入的，此时从 localStorage 中取出之前的 token */
if (result) {
  token = result[1]
  window.localStorage.setItem('token', result[1])
} else {
  token = window.localStorage.getItem('token')
}

/* axios 配置 */
axios.defaults.baseURL = '/api/v1'
axios.defaults.headers.common.Authorization = token

/* 设置请求拦截器，拦截所有的 401 请求，并在需要授权的时候跳转到微信授权跳转地址 */
axios.interceptors.response.use(response => response, (error) => {
  const {
    config: {
      method,
      url,
    },
    response: {
      status: statusCode,
    } = {},
  } = error

  /* 用户目前尚未登录的情况 */
  if (statusCode === 401) {
    if (method.toUpperCase() === 'GET' && url.endsWith('/accounts')) {
      console.log('获取用户个人信息失败')
    } else if (window.location.pathname.startsWith('/player/')) {
      /* 当用户处于播放页面时，跳转之前需要把现在的地址记录下来，等到用户登录以后再跳转回原来的播放页面 */
      const originURL = window.encodeURIComponent(window.location.pathname)

      /* 微信授权跳转地址 */
      const redirectURL = wxOAuth2RedirectUrl.replace(/\{\{.*?\}\}/, originURL)

      if ($browser.browser === 'Wechat') {
        /* 如果当前浏览器是微信浏览器，那么就直接跳转到微信授权地址 */
        window.location.assign(redirectURL)
      } else {
        if (copy(redirectURL, {
          message: '请复制下面的链接地址到微信中打开'
        })) {
          alert('请在微信中打开，链接地址已经复制到剪贴板')
        }
      }
    }
  }

  return Promise.reject(error)
})

Vue.config.productionTip = process.env.NODE_ENV === 'development'

Vue.prototype.$http = axios

/* 记录当前页面所处浏览器环境 */
Vue.prototype.$browser = $browser

Vue.use(MintUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  router,
  template: '<App />',
})
