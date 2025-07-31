<template>
  <v-btn
    :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    variant="text"
    @click="handleToggle"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :loading="isToggling"
    :disabled="isToggling"
    class="theme-toggle-btn"
    size="default"
  >
    <v-icon 
      :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      :color="isDark ? '#FBBF24' : '#60A5FA'"
      size="20"
      :class="{ 'rotating': isToggling }"
    />
    
    <!-- Tooltip -->
    <v-tooltip activator="parent" location="bottom">
      {{ isDark ? 'Switch to light mode' : 'Switch to dark mode' }}
    </v-tooltip>
  </v-btn>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'ThemeToggle',
  
  data() {
    return {
      isToggling: false
    };
  },
  
  computed: {
    ...mapGetters('theme', ['isDark', 'userPreference'])
  },
  
  mounted() {
    // Add keyboard event listener for accessibility
    this.$el.addEventListener('keydown', this.handleKeydown);
  },
  
  beforeUnmount() {
    // Clean up event listener
    this.$el.removeEventListener('keydown', this.handleKeydown);
  },
  
  methods: {
    ...mapActions('theme', ['toggleTheme']),
    
    async handleToggle() {
      if (this.isToggling) return;
      
      this.isToggling = true;
      
      // Add a small delay for smooth visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));
      
      this.toggleTheme();
      
      // Announce theme change to screen readers
      const message = this.isDark ? 'Switched to light mode' : 'Switched to dark mode';
      this.announceToScreenReader(message);
      
      // Reset toggling state after transition
      setTimeout(() => {
        this.isToggling = false;
      }, 300);
    },
    
    handleKeydown(event) {
      // Handle Enter and Space key for accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleToggle();
      }
    },
    
    announceToScreenReader(message) {
      // Create a temporary element for screen reader announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      document.body.appendChild(announcement);
      announcement.textContent = message;
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }
};
</script>

<style scoped>
.theme-toggle-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px !important;
}

.theme-toggle-btn:hover {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  transform: scale(1.05);
}

.theme-toggle-btn:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Dark mode specific styles */
[data-theme="dark"] .theme-toggle-btn:hover {
  background-color: rgba(96, 165, 250, 0.1) !important;
}

/* Animation for icon transition */
.v-icon {
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover .v-icon {
  transform: rotate(20deg);
}

/* Loading and transition states */
.theme-toggle-btn:disabled {
  opacity: 0.7;
}

.rotating {
  animation: rotate 0.6s ease-in-out;
}

@keyframes rotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

/* Enhanced theme transition effects */
.theme-toggle-btn {
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
  pointer-events: none;
  z-index: 0;
}

.theme-toggle-btn.toggling::before {
  width: 100px;
  height: 100px;
}

.theme-toggle-btn .v-icon {
  position: relative;
  z-index: 1;
}

/* Smooth color transitions for icons */
.v-icon {
  transition: color 0.4s ease, transform 0.3s ease;
}

/* Enhanced focus states with animations */
.theme-toggle-btn:focus-visible {
  animation: focusPulse 2s infinite;
}

@keyframes focusPulse {
  0%, 100% { 
    outline-color: rgba(96, 165, 250, 0.8);
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
  }
  50% { 
    outline-color: rgba(96, 165, 250, 1);
    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2);
  }
}
</style>