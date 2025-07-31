# Design Document

## Overview

This design document outlines the implementation of a comprehensive dark mode theme system for the cucumber report viewer application. The system will provide users with a toggle between light and dark themes, featuring a navy blue and grey color palette for the dark mode. The implementation leverages Vuetify 3's built-in theming capabilities and Vue 3's Composition API for state management.

## Architecture

### Theme System Architecture

The theme system will be built using Vuetify 3's theme configuration with custom color palettes. The architecture consists of:

1. **Theme Configuration Layer**: Vuetify theme definitions with light and dark variants
2. **State Management Layer**: Vue store for theme persistence and reactivity
3. **Component Integration Layer**: Theme-aware components with conditional styling
4. **Storage Layer**: LocalStorage for theme preference persistence

### Component Hierarchy

```
App.vue (Theme Provider)
├── ThemeToggle.vue (New Component)
├── ReportViewer.vue (Theme-aware)
├── ReportsCollection.vue (Theme-aware)
└── ReportUploader.vue (Theme-aware)
```

## Components and Interfaces

### 1. Theme Configuration (Vuetify Plugin)

**File**: `src/plugins/vuetify.js`

The Vuetify plugin will be enhanced with custom theme definitions:

```javascript
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
    'surface-variant': '#F1F5F9',
    'on-background': '#1E293B',
    'on-surface': '#334155'
  }
}

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
    'surface-variant': '#4A5568',
    'on-background': '#E2E8F0',
    'on-surface': '#CBD5E0'
  }
}
```

### 2. Theme Store Module

**File**: `src/store/modules/theme.js`

A Vuex module to manage theme state:

```javascript
const themeModule = {
  namespaced: true,
  state: {
    isDark: false,
    systemPreference: false
  },
  mutations: {
    SET_THEME(state, isDark) {
      state.isDark = isDark
    },
    SET_SYSTEM_PREFERENCE(state, preference) {
      state.systemPreference = preference
    }
  },
  actions: {
    initializeTheme({ commit, dispatch }) {
      // Detect system preference and load saved preference
    },
    toggleTheme({ commit, state }) {
      // Toggle theme and persist to localStorage
    }
  }
}
```

### 3. Theme Toggle Component

**File**: `src/components/ThemeToggle.vue`

A reusable component for theme switching:

```vue
<template>
  <v-btn
    :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    variant="text"
    @click="toggleTheme"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
  </v-btn>
</template>
```

### 4. Enhanced Component Styling

Each existing component will be updated to use Vuetify's theme-aware classes and CSS custom properties:

- Replace hardcoded colors with theme variables
- Use Vuetify's color classes (`bg-surface`, `text-on-surface`)
- Add theme-specific conditional styling where needed

## Data Models

### Theme Configuration Model

```typescript
interface ThemeConfig {
  name: string
  dark: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    error: string
    warning: string
    info: string
    success: string
    background: string
    surface: string
    'surface-variant': string
    'on-background': string
    'on-surface': string
  }
}
```

### Theme State Model

```typescript
interface ThemeState {
  isDark: boolean
  systemPreference: boolean
  userPreference: 'light' | 'dark' | 'system'
}
```

## Error Handling

### Theme Loading Errors

1. **LocalStorage Access Errors**: Fallback to system preference
2. **System Preference Detection Errors**: Default to light theme
3. **Theme Application Errors**: Graceful degradation with console warnings

### Component Rendering Errors

1. **Missing Theme Variables**: Fallback to default Vuetify colors
2. **CSS Custom Property Errors**: Use hardcoded fallback colors
3. **Theme Toggle Errors**: Disable toggle with error state indication

## Testing Strategy

### Unit Tests

1. **Theme Store Tests**:
   - Theme initialization logic
   - Theme toggle functionality
   - LocalStorage persistence
   - System preference detection

2. **Component Tests**:
   - ThemeToggle component behavior
   - Theme-aware styling application
   - Accessibility compliance

### Integration Tests

1. **Theme Switching Flow**:
   - End-to-end theme toggle functionality
   - Theme persistence across page reloads
   - Component theme consistency

2. **Accessibility Tests**:
   - Contrast ratio validation
   - Screen reader compatibility
   - Keyboard navigation support

### Visual Regression Tests

1. **Component Screenshots**:
   - Light theme component renders
   - Dark theme component renders
   - Theme transition states

## Implementation Details

### Color Palette Specifications

**Dark Theme Navy Blue & Grey Palette**:
- Primary Background: `#1A202C` (Navy Blue)
- Secondary Background: `#2D3748` (Dark Grey)
- Card/Surface Background: `#4A5568` (Medium Grey)
- Primary Text: `#E2E8F0` (Light Grey)
- Secondary Text: `#CBD5E0` (Medium Light Grey)
- Accent Colors: Adjusted for dark background contrast

### CSS Custom Properties

The implementation will use CSS custom properties for dynamic theming:

```css
:root {
  --theme-background: #FFFFFF;
  --theme-surface: #F8FAFC;
  --theme-text-primary: #1E293B;
  --theme-text-secondary: #64748B;
}

[data-theme="dark"] {
  --theme-background: #1A202C;
  --theme-surface: #2D3748;
  --theme-text-primary: #E2E8F0;
  --theme-text-secondary: #CBD5E0;
}
```

### Accessibility Considerations

1. **Contrast Ratios**: All color combinations meet WCAG 2.1 AA standards
2. **Focus Indicators**: Enhanced visibility in dark mode
3. **Screen Reader Support**: Proper ARIA labels for theme toggle
4. **Reduced Motion**: Respect user's motion preferences for transitions

### Performance Optimizations

1. **CSS-in-JS Minimization**: Use CSS custom properties over dynamic styles
2. **Theme Caching**: Cache theme preferences to avoid repeated calculations
3. **Lazy Loading**: Load theme-specific assets only when needed
4. **Transition Optimization**: Use CSS transitions over JavaScript animations

### Browser Compatibility

- **Modern Browsers**: Full support with CSS custom properties
- **Legacy Browsers**: Graceful degradation with static fallback colors
- **Mobile Browsers**: Touch-friendly theme toggle with proper sizing

## Migration Strategy

### Phase 1: Core Theme Infrastructure
- Set up Vuetify theme configuration
- Implement theme store module
- Create theme toggle component

### Phase 2: Component Integration
- Update ReportViewer component styling
- Update ReportsCollection component styling
- Update ReportUploader component styling

### Phase 3: Enhancement and Polish
- Add smooth transitions
- Implement accessibility improvements
- Add advanced theme features (auto-switching based on time)

### Backward Compatibility

- Existing light theme remains default
- No breaking changes to component APIs
- Graceful fallback for unsupported features