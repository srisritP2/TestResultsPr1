// Vuetify plugin for Vue 3
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import { aliases, mdi } from 'vuetify/iconsets/mdi';

// Light theme configuration
const lightTheme = {
  dark: false,
  colors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',
    success: '#10B981',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    'surface-bright': '#FFFFFF',
    'surface-light': '#EEEEEE',
    'surface-variant': '#F1F5F9',
    'on-background': '#1E293B',
    'on-surface': '#334155',
    'on-surface-variant': '#64748B',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
    'on-success': '#FFFFFF',
    'on-warning': '#000000',
    'on-error': '#FFFFFF',
    'on-info': '#FFFFFF'
  }
};

// Dark theme configuration with navy blue and grey palette
const darkTheme = {
  dark: true,
  colors: {
    primary: '#60A5FA',
    secondary: '#94A3B8',
    accent: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#22D3EE',
    success: '#34D399',
    background: '#1A202C',
    surface: '#2D3748',
    'surface-bright': '#4A5568',
    'surface-light': '#374151',
    'surface-variant': '#4A5568',
    'on-background': '#E2E8F0',
    'on-surface': '#CBD5E0',
    'on-surface-variant': '#A0AEC0',
    'on-primary': '#1A202C',
    'on-secondary': '#1A202C',
    'on-success': '#1A202C',
    'on-warning': '#1A202C',
    'on-error': '#1A202C',
    'on-info': '#1A202C'
  }
};

// Determine initial theme before creating Vuetify instance
function getInitialTheme() {
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedPreference = localStorage.getItem('theme-preference') || 'system';
  
  let shouldBeDark = false;
  if (savedPreference === 'dark') {
    shouldBeDark = true;
  } else if (savedPreference === 'light') {
    shouldBeDark = false;
  } else { // system
    shouldBeDark = systemPrefersDark;
  }
  
  return shouldBeDark ? 'dark' : 'light';
}

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: getInitialTheme(),
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 4,
      darken: 4,
    },
  },
});

export default vuetify;
