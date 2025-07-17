import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Report from '../views/Report.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/report/:id',
    name: 'Report',
    component: Report,
    props: true
  },
  {
    path: '/report',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;