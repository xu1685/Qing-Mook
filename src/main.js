import 'mint-ui/lib/style.css'

import MintUI from 'mint-ui'
import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'

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
axios.defaults.headers.common['Authorization'] = token

axios.interceptors.response.use((response) => response, (error) => {
  const {
    response: {
      status: statusCode,
    } = {},
  } = error

  /* 用户目前尚未登录的情况 */
  if (statusCode === 401) {
    if (window.location.pathname.startsWith('/player/')) {
      /* 当用户处于播放页面时，跳转之前需要把现在的地址记录下来 */
      const originURL = window.encodeURIComponent(window.location.pathname)
      /* 带着现在的地址跳转到登录页面，等到用户登录以后再跳转回原来的播放页面 */
      window.location.replace(`/login?originurl=${originURL}`)
    } else if (window.location.pathname !== '/login') {
      /* 当用户不在登录页面时，不再显示错误信息，直接跳转到登录页面 */
      window.location.replace('/login')
    }
  }

  return Promise.reject(error)
})

Vue.config.productionTip = process.env.NODE_ENV === 'development'

Vue.prototype.$http = axios

Vue.use(MintUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  router,
  template: '<App />',
})
