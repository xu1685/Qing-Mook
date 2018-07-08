import Vue from 'vue'
import Router from 'vue-router'
import Course from '../containers/Course'
import Player from '../containers/Player'
import Teacher from '../containers/Teacher'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [{
    path: '/teacher/:id',
    name: 'teacher',
    component: Teacher,
  }, {
    path: '/course/:id',
    name: 'course',
    component: Course,
  }, {
    path: '/player/:id',
    name: 'player',
    component: Player,
  }],
})
