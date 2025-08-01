<template>
  <v-dialog
    v-model="dialog"
    max-width="500"
    persistent
    @keydown.esc="cancel"
  >
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon 
          :color="iconColor" 
          class="mr-3"
          size="28"
        >
          {{ icon }}
        </v-icon>
        {{ title }}
      </v-card-title>

      <v-card-text class="pb-2">
        <div class="text-body-1 mb-4">
          {{ message }}
        </div>
        
        <!-- Environment indicator -->
        <v-alert
          v-if="showEnvironmentInfo"
          :color="environmentColor"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2" size="20">{{ environmentIcon }}</v-icon>
            <span class="text-body-2">{{ environmentMessage }}</span>
          </div>
        </v-alert>

        <!-- Additional details -->
        <div v-if="details" class="text-body-2 text-medium-emphasis">
          {{ details }}
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer></v-spacer>
        
        <v-btn
          variant="text"
          @click="cancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>
        
        <v-btn
          :color="confirmColor"
          variant="elevated"
          @click="confirm"
          :loading="loading"
          :disabled="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmationDialog',
  
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: null
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmColor: {
      type: String,
      default: 'primary'
    },
    icon: {
      type: String,
      default: 'mdi-help-circle'
    },
    type: {
      type: String,
      default: 'default', // 'delete', 'warning', 'info', 'success'
      validator: (value) => ['default', 'delete', 'warning', 'info', 'success'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    showEnvironmentInfo: {
      type: Boolean,
      default: false
    },
    environment: {
      type: String,
      default: 'localhost' // 'localhost' or 'production'
    }
  },

  emits: ['update:modelValue', 'confirm', 'cancel'],

  computed: {
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },

    iconColor() {
      switch (this.type) {
        case 'delete': return 'error';
        case 'warning': return 'warning';
        case 'info': return 'info';
        case 'success': return 'success';
        default: return 'primary';
      }
    },

    computedIcon() {
      if (this.icon !== 'mdi-help-circle') {
        return this.icon;
      }
      
      switch (this.type) {
        case 'delete': return 'mdi-delete-alert';
        case 'warning': return 'mdi-alert';
        case 'info': return 'mdi-information';
        case 'success': return 'mdi-check-circle';
        default: return 'mdi-help-circle';
      }
    },

    environmentColor() {
      return this.environment === 'localhost' ? 'info' : 'warning';
    },

    environmentIcon() {
      return this.environment === 'localhost' ? 'mdi-laptop' : 'mdi-cloud';
    },

    environmentMessage() {
      if (this.environment === 'localhost') {
        return 'Running in local development - files will be permanently deleted';
      } else {
        return 'Running on GitHub Pages - files will be hidden until next deployment';
      }
    }
  },

  methods: {
    confirm() {
      this.$emit('confirm');
    },

    cancel() {
      this.$emit('cancel');
      this.dialog = false;
    }
  },

  mounted() {
    // Focus management for accessibility
    if (this.dialog) {
      this.$nextTick(() => {
        const confirmBtn = this.$el.querySelector('.v-btn:last-child');
        if (confirmBtn) {
          confirmBtn.focus();
        }
      });
    }
  }
}
</script>

<style scoped>
.v-card-title {
  word-break: break-word;
}

.v-card-text {
  line-height: 1.6;
}

/* Ensure proper spacing for environment alert */
.v-alert {
  font-size: 0.875rem;
}

/* Animation for dialog appearance */
.v-dialog {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Focus styles for accessibility */
.v-btn:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>