// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import MintUI from 'mint-ui'
import axios from 'axios'
import 'mint-ui/lib/style.css'


//axios配置
<<<<<<< HEAD
axios.defaults.baseURL = '/api/v1';
axios.defaults.headers.common['Authorization'] = 'QJWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInVhIjoicGMiLCJjb21wbGV0ZSI6dHJ1ZSwiaWF0IjoxNTI2NTIxODUxLCJleHAiOjE1MjY2MDgyNTF9.jRrHrtMVUDd0ou5gBRJNZIBBd0GZOxW2JUzgjniMJnU';

=======
axios.defaults.baseURL = '/api/v1'
axios.defaults.headers.common['authorization'] = 'QJWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInVhIjoicGMiLCJjb21wbGV0ZSI6dHJ1ZSwiaWF0IjoxNTI2NTIxODUxLCJleHAiOjE1MjY2MDgyNTF9.jRrHrtMVUDd0ou5gBRJNZIBBd0GZOxW2JUzgjniMJnU'
>>>>>>> 9ece10f1a330759a8d256644b9ca45f884aee93a
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


