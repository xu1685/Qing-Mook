// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'mint-ui/lib/style.css'

import Vue from 'vue'
import MintUI from 'mint-ui'
import axios from 'axios'
import App from './App.vue'
import router from './router'

// axios配置
axios.defaults.baseURL = '/api/v1'
axios.defaults.headers.common['Authorization'] = 'QJWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidWEiOiJwYyIsImNvbXBsZXRlIjp0cnVlLCJzdGF0ZSI6Im5vcmVkaXJlY3QiLCJpYXQiOjE1Mjc2NDMyMTUsImV4cCI6MTUyNzcyOTYxNX0.XfXiyqF8JjvZZH2VQlNL8UxJW1N3PPTk92rr5cwJCp8' // eslint-disable-line

Vue.config.productionTip = false

Vue.prototype.$http = axios

Vue.use(MintUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  router,
  template: '<App />',
})
