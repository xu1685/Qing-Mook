import Vue from 'vue'
import Router from 'vue-router'
import Player from '../components/Player'
import Course from '../components/Course'
import Teacher from '../components/Teacher'

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
      component: Player,
    },
  ],
})
