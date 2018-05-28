// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import MintUI from 'mint-ui'
import axios from 'axios'
import 'mint-ui/lib/style.css'


//axios配置
axios.defaults.baseURL = '/api/v1';
axios.defaults.headers.common['Authorization'] = 'QJWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidWEiOiJwYyIsImNvbXBsZXRlIjp0cnVlLCJzdGF0ZSI6Ii9wbGF5ZXIvNWIwMzczZjI4NTc1NGEyN2FlMGMyZmY1IiwiaWF0IjoxNTI3NTA5Njg2LCJleHAiOjE1Mjc1OTYwODZ9.32srbACbpxN-B0RxaeFJhJRBUPc2q7N-a5UinuLMXQc';

Vue.config.productionTip = false
Vue.prototype.$http = axios

Vue.use(MintUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})


