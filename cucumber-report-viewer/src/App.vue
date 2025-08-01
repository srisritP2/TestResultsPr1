<template>
  <v-app :theme="currentTheme">
    <div id="app" :class="{ 'dark-theme': isDark }">
      <router-view />
    </div>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'App',
  
  computed: {
    ...mapGetters('theme', ['isDark', 'currentTheme'])
  },
  
  watch: {
    isDark: {
      handler(newVal) {
        // Ensure body class is updated
        if (newVal) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="scss">
@import './styles/vuetify.scss';

#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  transition: background-color 0.3s ease, color 0.3s ease;
}

// Let Vuetify handle the theme colors
.v-application {
  font-family: inherit !important;
}

// Theme-aware scrollbar
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--theme-surface);
}

::-webkit-scrollbar-thumb {
  background: var(--theme-text-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--theme-text-primary);
}

[data-theme="dark"] ::-webkit-scrollbar-track {
  background: var(--theme-surface-variant);
}

[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: var(--theme-text-secondary);
}

[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: var(--theme-text-primary);
}
</style>