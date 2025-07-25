import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import TimeMail from '@/views/TimeMail.vue'
import MoodJigsaw from '@/views/MoodJigsaw.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/timemail',
      name: 'TimeMail',
      component: TimeMail
    },
    {
      path: '/mood',
      name: 'MoodJigsaw',
      component: MoodJigsaw
    }
  ]
})

export default router