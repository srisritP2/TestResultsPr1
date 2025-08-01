// Theme management module for Vuex store
export default {
  namespaced: true,
  state: {
    isDark: false,
    systemPreference: false,
    userPreference: 'system' // 'light', 'dark', or 'system'
  },
  
  mutations: {
    SET_THEME(state, isDark) {
      state.isDark = isDark;
    },
    
    SET_SYSTEM_PREFERENCE(state, preference) {
      state.systemPreference = preference;
    },
    
    SET_USER_PREFERENCE(state, preference) {
      state.userPreference = preference;
    }
  },
  
  actions: {
    // Initialize theme on app startup (listeners only, state already set in main.js)
    initializeTheme({ state, commit, dispatch }) {
      // Listen for system preference changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          commit('SET_SYSTEM_PREFERENCE', e.matches);
          if (state.userPreference === 'system') {
            dispatch('applyTheme');
          }
        });
      }
    },
    
    // Apply theme based on current preferences
    applyTheme({ state, commit }) {
      let shouldBeDark = false;
      
      if (state.userPreference === 'dark') {
        shouldBeDark = true;
      } else if (state.userPreference === 'light') {
        shouldBeDark = false;
      } else { // system
        shouldBeDark = state.systemPreference;
      }
      
      commit('SET_THEME', shouldBeDark);
      
      // Apply theme to document
      if (shouldBeDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    },
    
    // Toggle between light and dark themes
    toggleTheme({ state, commit, dispatch }) {
      const newPreference = state.isDark ? 'light' : 'dark';
      commit('SET_USER_PREFERENCE', newPreference);
      
      // Save to localStorage
      localStorage.setItem('theme-preference', newPreference);
      
      // Apply the new theme
      dispatch('applyTheme');
    },
    
    // Set specific theme preference
    setThemePreference({ commit, dispatch }, preference) {
      commit('SET_USER_PREFERENCE', preference);
      localStorage.setItem('theme-preference', preference);
      dispatch('applyTheme');
    }
  },
  
  getters: {
    isDark: (state) => state.isDark,
    userPreference: (state) => state.userPreference,
    systemPreference: (state) => state.systemPreference,
    
    // Get current theme name for Vuetify
    currentTheme: (state) => state.isDark ? 'dark' : 'light'
  }
};