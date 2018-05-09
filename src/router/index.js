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
      path: '/course/:id',
      name: 'course',
      component: Course
    },
    {
      path: '/teacher/',
      name: 'teacher',
      component: Teacher
    },
    {
      path: '/',
      name: 'teacher',
      component: Teacher
    }

  ]
})
