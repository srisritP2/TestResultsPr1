# Vue.js 3 Implementation Details

## Overview

The Cucumber Test Results Viewer is built using Vue.js 3, leveraging modern Vue features including the Composition API, reactive system, and component-based architecture. This document explains the Vue.js implementation in detail.

## Vue.js Version & Features Used

### Vue 3.0+ Features
- **Composition API** - Modern reactive composition
- **Multiple Root Elements** - Fragments support
- **Teleport** - Portal-like functionality
- **Suspense** - Async component loading
- **Improved TypeScript Support** - Better type inference

## Project Structure

### Main Application Files

#### `src/main.js` - Application Bootstrap
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(vuetify)

app.mount('#app')
```

**Why this approach:**
- **createApp()** - Vue 3's new application instance API
- **Plugin System** - Modular plugin registration
- **Single Mount Point** - Clean application initialization

#### `src/App.vue` - Root Component
```vue
<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="scss">
@import './styles/vuetify.scss';
</style>
```

**Implementation Details:**
- **v-app** - Vuetify's root application wrapper
- **router-view** - Dynamic component rendering based on route
- **SCSS Integration** - Sass preprocessing for styles

## Component Architecture

### Component Types

#### 1. Page Components (`src/views/`)

**Report.vue** - Main report viewing page
```vue
<template>
  <div class="report-page">
    <ReportViewer 
      v-if="reportData" 
      :report-data="reportData"
      @report-deleted="handleReportDeleted"
    />
    <div v-else class="loading">
      <v-progress-circular indeterminate />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReportViewer from '@/components/ReportViewer.vue'
import ReportService from '@/services/ReportService'

export default {
  name: 'Report',
  components: {
    ReportViewer
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const reportData = ref(null)
    
    const loadReport = async () => {
      try {
        const filename = route.params.filename
        reportData.value = await ReportService.getReport(filename)
      } catch (error) {
        console.error('Failed to load report:', error)
        router.push('/')
      }
    }
    
    const handleReportDeleted = () => {
      router.push('/')
    }
    
    onMounted(loadReport)
    
    return {
      reportData,
      handleReportDeleted
    }
  }
}
</script>
```

**Key Vue 3 Features Used:**
- **Composition API** - `setup()` function for logic composition
- **Reactive References** - `ref()` for reactive data
- **Lifecycle Hooks** - `onMounted()` for component lifecycle
- **Vue Router Composables** - `useRoute()` and `useRouter()`

#### 2. Feature Components (`src/components/`)

**ReportViewer.vue** - Main report display component
```vue
<template>
  <v-container fluid class="report-viewer">
    <!-- Header Section -->
    <v-row class="header-section">
      <v-col cols="12">
        <div class="report-header">
          <h1 class="report-title">{{ reportTitle }}</h1>
          <div class="report-actions">
            <ThemeToggle />
            <v-btn 
              icon 
              @click="deleteReport"
              color="error"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Controls Section -->
    <v-row class="controls-section">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="searchQuery"
          label="Search scenarios, features, or steps..."
          prepend-inner-icon="mdi-magnify"
          clearable
          outlined
          dense
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Filter by status"
          outlined
          dense
        />
      </v-col>
    </v-row>

    <!-- Report Content -->
    <v-row class="content-section">
      <v-col cols="12">
        <div v-for="feature in filteredFeatures" :key="feature.id">
          <FeatureCard 
            :feature="feature"
            :search-query="searchQuery"
            @scenario-selected="handleScenarioSelected"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import ThemeToggle from './ThemeToggle.vue'
import FeatureCard from './FeatureCard.vue'
import DeletionService from '@/services/DeletionService'

export default {
  name: 'ReportViewer',
  components: {
    ThemeToggle,
    FeatureCard
  },
  props: {
    reportData: {
      type: Object,
      required: true
    }
  },
  emits: ['report-deleted'],
  setup(props, { emit }) {
    const store = useStore()
    
    // Reactive data
    const searchQuery = ref('')
    const statusFilter = ref('all')
    
    // Computed properties
    const reportTitle = computed(() => {
      return props.reportData?.name || 'Cucumber Test Report'
    })
    
    const statusOptions = computed(() => [
      { text: 'All Scenarios', value: 'all' },
      { text: 'Passed', value: 'passed' },
      { text: 'Failed', value: 'failed' },
      { text: 'Skipped', value: 'skipped' }
    ])
    
    const filteredFeatures = computed(() => {
      if (!props.reportData?.features) return []
      
      return props.reportData.features.filter(feature => {
        // Search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          const matchesFeature = feature.name.toLowerCase().includes(query)
          const matchesScenario = feature.elements?.some(scenario =>
            scenario.name.toLowerCase().includes(query) ||
            scenario.steps?.some(step => 
              step.name.toLowerCase().includes(query)
            )
          )
          if (!matchesFeature && !matchesScenario) return false
        }
        
        // Status filter
        if (statusFilter.value !== 'all') {
          const hasMatchingScenarios = feature.elements?.some(scenario => {
            const scenarioStatus = getScenarioStatus(scenario)
            return scenarioStatus === statusFilter.value
          })
          if (!hasMatchingScenarios) return false
        }
        
        return true
      })
    })
    
    // Methods
    const getScenarioStatus = (scenario) => {
      if (!scenario.steps || scenario.steps.length === 0) return 'skipped'
      
      const hasFailedStep = scenario.steps.some(step => 
        step.result?.status === 'failed'
      )
      if (hasFailedStep) return 'failed'
      
      const hasSkippedStep = scenario.steps.some(step => 
        step.result?.status === 'skipped'
      )
      if (hasSkippedStep) return 'skipped'
      
      return 'passed'
    }
    
    const handleScenarioSelected = (scenario) => {
      // Handle scenario selection logic
      console.log('Scenario selected:', scenario)
    }
    
    const deleteReport = async () => {
      try {
        await DeletionService.deleteReport(props.reportData.filename)
        emit('report-deleted')
      } catch (error) {
        console.error('Failed to delete report:', error)
      }
    }
    
    // Watchers
    watch(searchQuery, (newQuery) => {
      console.log('Search query changed:', newQuery)
    })
    
    return {
      searchQuery,
      statusFilter,
      reportTitle,
      statusOptions,
      filteredFeatures,
      handleScenarioSelected,
      deleteReport
    }
  }
}
</script>

<style lang="scss" scoped>
.report-viewer {
  max-width: 1600px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .report-title {
    font-size: 2rem;
    font-weight: 500;
    color: var(--theme-text-primary);
  }
  
  .report-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.controls-section {
  margin-bottom: 24px;
}

.content-section {
  .feature-card + .feature-card {
    margin-top: 16px;
  }
}
</style>
```

**Advanced Vue 3 Features Demonstrated:**
- **Composition API** - Complete setup() function usage
- **Reactive References** - `ref()` for mutable state
- **Computed Properties** - `computed()` for derived state
- **Watchers** - `watch()` for reactive side effects
- **Props & Emits** - Modern prop validation and event emission
- **Scoped Slots** - Component composition patterns

### Composition API Patterns

#### 1. Composable Functions (Custom Hooks)

**useTheme.js** - Theme management composable
```javascript
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'

export function useTheme() {
  const store = useStore()
  
  const currentTheme = computed(() => store.state.theme.currentTheme)
  const isDark = computed(() => currentTheme.value === 'dark')
  
  const toggleTheme = () => {
    store.dispatch('theme/toggleTheme')
  }
  
  const setTheme = (theme) => {
    store.dispatch('theme/setTheme', theme)
  }
  
  return {
    currentTheme,
    isDark,
    toggleTheme,
    setTheme
  }
}
```

**useReportData.js** - Report data management composable
```javascript
import { ref, computed } from 'vue'
import ReportService from '@/services/ReportService'

export function useReportData() {
  const reports = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const loadReports = async () => {
    loading.value = true
    error.value = null
    
    try {
      reports.value = await ReportService.getAllReports()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  const reportCount = computed(() => reports.value.length)
  
  const getReportByFilename = (filename) => {
    return reports.value.find(report => report.filename === filename)
  }
  
  return {
    reports,
    loading,
    error,
    reportCount,
    loadReports,
    getReportByFilename
  }
}
```

#### 2. Component Communication Patterns

**Parent-Child Communication**
```vue
<!-- Parent Component -->
<template>
  <ReportUploader 
    @file-uploaded="handleFileUploaded"
    @upload-error="handleUploadError"
    :max-file-size="maxFileSize"
  />
</template>

<script>
export default {
  setup() {
    const maxFileSize = ref(50 * 1024 * 1024) // 50MB
    
    const handleFileUploaded = (fileData) => {
      console.log('File uploaded:', fileData)
      // Handle successful upload
    }
    
    const handleUploadError = (error) => {
      console.error('Upload error:', error)
      // Handle upload error
    }
    
    return {
      maxFileSize,
      handleFileUploaded,
      handleUploadError
    }
  }
}
</script>
```

**Child Component (ReportUploader)**
```vue
<template>
  <div class="report-uploader">
    <v-file-input
      v-model="selectedFile"
      label="Select Cucumber JSON Report"
      accept=".json"
      @change="handleFileChange"
    />
    <v-btn 
      @click="uploadFile"
      :disabled="!selectedFile || uploading"
      :loading="uploading"
    >
      Upload Report
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB default
    }
  },
  emits: ['file-uploaded', 'upload-error'],
  setup(props, { emit }) {
    const selectedFile = ref(null)
    const uploading = ref(false)
    
    const handleFileChange = (file) => {
      if (file && file.size > props.maxFileSize) {
        emit('upload-error', new Error('File size exceeds maximum limit'))
        selectedFile.value = null
        return
      }
    }
    
    const uploadFile = async () => {
      if (!selectedFile.value) return
      
      uploading.value = true
      
      try {
        const result = await uploadReportFile(selectedFile.value)
        emit('file-uploaded', result)
        selectedFile.value = null
      } catch (error) {
        emit('upload-error', error)
      } finally {
        uploading.value = false
      }
    }
    
    return {
      selectedFile,
      uploading,
      handleFileChange,
      uploadFile
    }
  }
}
</script>
```

## Reactive System Implementation

### Reactivity Patterns

#### 1. Reactive Data Management
```javascript
import { ref, reactive, computed, watch } from 'vue'

export default {
  setup() {
    // Primitive reactive values
    const count = ref(0)
    const message = ref('Hello Vue 3')
    
    // Complex reactive objects
    const user = reactive({
      name: 'John Doe',
      email: 'john@example.com',
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    })
    
    // Computed properties
    const displayMessage = computed(() => {
      return `${message.value} - Count: ${count.value}`
    })
    
    const userDisplayName = computed(() => {
      return user.name.toUpperCase()
    })
    
    // Watchers
    watch(count, (newCount, oldCount) => {
      console.log(`Count changed from ${oldCount} to ${newCount}`)
    })
    
    watch(
      () => user.preferences.theme,
      (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme)
      },
      { immediate: true }
    )
    
    return {
      count,
      message,
      user,
      displayMessage,
      userDisplayName
    }
  }
}
```

#### 2. Advanced Reactivity Patterns
```javascript
import { ref, computed, watchEffect, toRefs } from 'vue'

export function useAdvancedReactivity() {
  const state = reactive({
    reports: [],
    filters: {
      status: 'all',
      search: '',
      dateRange: null
    },
    pagination: {
      page: 1,
      itemsPerPage: 10
    }
  })
  
  // Computed with complex logic
  const filteredReports = computed(() => {
    let filtered = state.reports
    
    // Status filter
    if (state.filters.status !== 'all') {
      filtered = filtered.filter(report => 
        report.status === state.filters.status
      )
    }
    
    // Search filter
    if (state.filters.search) {
      const query = state.filters.search.toLowerCase()
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query)
      )
    }
    
    // Date range filter
    if (state.filters.dateRange) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt)
        return reportDate >= state.filters.dateRange.start &&
               reportDate <= state.filters.dateRange.end
      })
    }
    
    return filtered
  })
  
  // Paginated results
  const paginatedReports = computed(() => {
    const start = (state.pagination.page - 1) * state.pagination.itemsPerPage
    const end = start + state.pagination.itemsPerPage
    return filteredReports.value.slice(start, end)
  })
  
  // Watch effect for side effects
  watchEffect(() => {
    // Reset pagination when filters change
    if (state.filters.status || state.filters.search || state.filters.dateRange) {
      state.pagination.page = 1
    }
  })
  
  return {
    ...toRefs(state),
    filteredReports,
    paginatedReports
  }
}
```

## Vue Router Integration

### Router Configuration
```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Report from '@/views/Report.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Cucumber Reports'
    }
  },
  {
    path: '/report/:filename',
    name: 'Report',
    component: Report,
    props: true,
    meta: {
      title: 'Report Details'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Cucumber Reports'
  next()
})

export default router
```

### Router Usage in Components
```javascript
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const navigateToReport = (filename) => {
      router.push({
        name: 'Report',
        params: { filename }
      })
    }
    
    const goBack = () => {
      router.go(-1)
    }
    
    const currentFilename = computed(() => {
      return route.params.filename
    })
    
    return {
      navigateToReport,
      goBack,
      currentFilename
    }
  }
}
```

## Performance Optimizations

### 1. Component Lazy Loading
```javascript
// Lazy load components
const ReportViewer = defineAsyncComponent(() =>
  import('@/components/ReportViewer.vue')
)

const ReportsCollection = defineAsyncComponent({
  loader: () => import('@/components/ReportsCollection.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

### 2. Computed Property Optimization
```javascript
export default {
  setup() {
    const expensiveComputed = computed(() => {
      // Expensive calculation only runs when dependencies change
      return heavyCalculation(props.data)
    })
    
    // Cached computed with custom comparison
    const optimizedComputed = computed(() => {
      return processLargeDataset(state.largeArray)
    })
    
    return {
      expensiveComputed,
      optimizedComputed
    }
  }
}
```

### 3. Memory Management
```javascript
import { onUnmounted } from 'vue'

export default {
  setup() {
    const intervalId = setInterval(() => {
      // Some periodic task
    }, 1000)
    
    const eventListener = (event) => {
      // Handle event
    }
    
    // Cleanup on component unmount
    onUnmounted(() => {
      clearInterval(intervalId)
      window.removeEventListener('resize', eventListener)
    })
    
    // Add event listener
    window.addEventListener('resize', eventListener)
  }
}
```

## Error Handling

### Component Error Boundaries
```javascript
import { onErrorCaptured } from 'vue'

export default {
  setup() {
    const error = ref(null)
    
    onErrorCaptured((err, instance, info) => {
      error.value = err
      console.error('Component error:', err, info)
      
      // Return false to prevent error propagation
      return false
    })
    
    return {
      error
    }
  }
}
```

### Async Error Handling
```javascript
export default {
  setup() {
    const loading = ref(false)
    const error = ref(null)
    const data = ref(null)
    
    const fetchData = async () => {
      loading.value = true
      error.value = null
      
      try {
        data.value = await apiCall()
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    return {
      loading,
      error,
      data,
      fetchData
    }
  }
}
```

## Testing Vue Components

### Component Testing Setup
```javascript
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import ReportViewer from '@/components/ReportViewer.vue'

describe('ReportViewer', () => {
  let wrapper
  let store
  
  beforeEach(() => {
    store = createStore({
      modules: {
        theme: {
          namespaced: true,
          state: { currentTheme: 'light' },
          actions: { toggleTheme: jest.fn() }
        }
      }
    })
    
    wrapper = mount(ReportViewer, {
      props: {
        reportData: mockReportData
      },
      global: {
        plugins: [store]
      }
    })
  })
  
  it('renders report title correctly', () => {
    expect(wrapper.find('.report-title').text()).toBe('Test Report')
  })
  
  it('filters scenarios based on search query', async () => {
    await wrapper.find('input[type="text"]').setValue('login')
    expect(wrapper.findAll('.scenario-card')).toHaveLength(2)
  })
})
```

This comprehensive Vue.js implementation provides a solid foundation for building modern, reactive web applications with excellent performance and maintainability.