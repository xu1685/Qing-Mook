import Vue from 'vue'
import Router from 'vue-router'
import PlayerPage from '../components/playerPage/PlayerPage'
import MyPage from '../components/myPage/MyPage'
import Teacher from '../components/teacher/Teacher'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/player/:id',
      name: 'playerPage',
      component: PlayerPage
    },
    {
      path: '/player/',
      name: 'playerPage',
      component: PlayerPage
    },
    {
      path: '/',
      name: 'myPage',
      component: MyPage
    },
    {
      path: '/teacher/:id',
      name: 'teacher',
      component: Teacher
    }

  ]
})
