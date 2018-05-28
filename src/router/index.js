import Vue from 'vue'
import Router from 'vue-router'
import PlayerPage from '../components/playerPage/PlayerPage'
import Course from '../components/course/Course'
import Teacher from '../components/teacher/Teacher'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/teacher/',
    },
    {
      path: '/teacher/',
      name: 'teacher',
      component: Teacher,
    },
    {
      path: '/course/:id',
      name: 'course',
      component: Course,
    },
    {
      path: '/player/:id',
      name: 'playerPage',
      component: PlayerPage,
    },
  ]
})
