import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';

const app = createApp(App);
app.use(router);
app.use(store);
app.use(vuetify);

// Initialize theme system
store.dispatch('theme/initializeTheme');

// Watch for theme changes and update Vuetify
store.watch(
  (state) => state.theme.isDark,
  (isDark) => {
    vuetify.theme.global.name.value = isDark ? 'dark' : 'light';
  }
);

app.mount('#app');