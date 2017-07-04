import Vue from 'vue'
import Router from 'vue-router'
import MusicVis from '@/components/MusicVis'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'MusicVis',
      component: MusicVis
    }
  ]
})
