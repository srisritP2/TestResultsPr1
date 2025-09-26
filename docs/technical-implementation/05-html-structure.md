# HTML Structure and Templates

## Overview

This document explains the HTML structure, template organization, and markup patterns used in the Cucumber Test Results Viewer. It covers the main HTML file, Vue template structures, semantic markup, and accessibility considerations.

## Main HTML Structure

### `public/index.html` - Application Entry Point

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cucumber Report Viewer</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Interactive Cucumber test results viewer with advanced filtering, search, and reporting capabilities">
    <meta name="keywords" content="cucumber, testing, bdd, test results, automation, reports">
    <meta name="author" content="Cucumber Report Viewer">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Cucumber Report Viewer">
    <meta property="og:description" content="View and analyze Cucumber test reports with an interactive web interface">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://srisritp2.github.io/TestResults/">
    <meta property="og:image" content="https://srisritp2.github.io/TestResults/img/icons/apple-touch-icon.png">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Cucumber Report Viewer">
    <meta name="twitter:description" content="Interactive Cucumber test results viewer">
    <meta name="twitter:image" content="https://srisritp2.github.io/TestResults/img/icons/apple-touch-icon.png">
    
    <!-- Favicon and Icons -->
    <link rel="icon" type="image/x-icon" href="/TestResults/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="/TestResults/img/icons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/TestResults/img/icons/favicon-32x32.png">
    <link rel="apple-touch-icon" href="/TestResults/img/icons/apple-touch-icon.png">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/TestResults/manifest.json">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#3B82F6">
    <meta name="msapplication-TileColor" content="#3B82F6">
    
    <!-- External Resources -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Theme initialization script to prevent flash of unstyled content -->
    <script>
      (function() {
        // Detect system preference
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Load user preference from localStorage
        const savedPreference = localStorage.getItem('theme-preference') || 'system';
        
        // Determine if should be dark
        let shouldBeDark = false;
        if (savedPreference === 'dark') {
          shouldBeDark = true;
        } else if (savedPreference === 'light') {
          shouldBeDark = false;
        } else { // system
          shouldBeDark = systemPrefersDark;
        }
        
        // Apply theme to document immediately
        if (shouldBeDark) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
        
        // Add theme class to body for immediate styling
        document.documentElement.className = shouldBeDark ? 'theme-dark' : 'theme-light';
      })();
    </script>
    
    <!-- Critical CSS for loading states -->
    <style>
      /* Prevent flash of unstyled content */
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #ffffff;
        color: #1e293b;
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      
      [data-theme="dark"] body {
        background-color: #0f172a;
        color: #f1f5f9;
      }
      
      #app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      
      /* Loading spinner for better UX */
      .loading-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 3px solid rgba(59, 130, 246, 0.3);
        border-top: 3px solid #3B82F6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 9999;
      }
      
      [data-theme="dark"] .loading-spinner {
        border: 3px solid rgba(96, 165, 250, 0.3);
        border-top: 3px solid #60A5FA;
      }
      
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      /* Hide loading spinner when app loads */
      .v-application .loading-spinner {
        display: none;
      }
      
      /* Accessibility improvements */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      /* Focus styles */
      *:focus {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }
      
      [data-theme="dark"] *:focus {
        outline-color: #60A5FA;
      }
    </style>
</head>
<body>
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
        Skip to main content
    </a>
    
    <!-- Main Vue application mount point -->
    <div id="app">
      <!-- Loading spinner shown until Vue app loads -->
      <div class="loading-spinner" aria-label="Loading application"></div>
      
      <!-- Fallback content for users with JavaScript disabled -->
      <noscript>
        <div style="text-align: center; padding: 2rem; font-family: Arial, sans-serif;">
          <h1>JavaScript Required</h1>
          <p>This application requires JavaScript to function properly.</p>
          <p>Please enable JavaScript in your browser and refresh the page.</p>
        </div>
      </noscript>
    </div>
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/TestResults/service-worker.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    </script>
</body>
</html>
```

## Vue Template Structures

### App.vue - Root Application Template

```vue
<template>
  <v-app id="app">
    <!-- Skip to main content for accessibility -->
    <div class="sr-only">
      <a href="#main-content" @click="focusMainContent">Skip to main content</a>
    </div>
    
    <!-- Application Header -->
    <v-app-bar
      app
      color="primary"
      dark
      elevation="2"
      height="64"
      role="banner"
    >
      <v-app-bar-nav-icon
        v-if="$vuetify.display.mobile"
        @click="drawer = !drawer"
        aria-label="Toggle navigation menu"
      />
      
      <v-app-bar-title class="d-flex align-center">
        <v-icon left size="28" aria-hidden="true">mdi-cucumber</v-icon>
        <span class="text-h6 font-weight-medium">Cucumber Reports</span>
      </v-app-bar-title>
      
      <v-spacer />
      
      <!-- Header Actions -->
      <div class="d-flex align-center ga-2">
        <!-- Theme Toggle -->
        <ThemeToggle />
        
        <!-- Upload Button -->
        <v-btn
          icon
          @click="showUploadDialog = true"
          aria-label="Upload new report"
        >
          <v-icon>mdi-upload</v-icon>
        </v-btn>
        
        <!-- Settings Menu -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              aria-label="Open settings menu"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          
          <v-list>
            <v-list-item @click="showAboutDialog = true">
              <v-list-item-title>About</v-list-item-title>
            </v-list-item>
            <v-list-item @click="showHelpDialog = true">
              <v-list-item-title>Help</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
    
    <!-- Navigation Drawer (Mobile) -->
    <v-navigation-drawer
      v-if="$vuetify.display.mobile"
      v-model="drawer"
      app
      temporary
      role="navigation"
      aria-label="Main navigation"
    >
      <v-list>
        <v-list-item to="/" exact>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>
        <v-list-item to="/reports">
          <v-list-item-title>All Reports</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <!-- Main Content Area -->
    <v-main role="main">
      <div id="main-content" tabindex="-1">
        <!-- Breadcrumb Navigation -->
        <v-container v-if="showBreadcrumbs" fluid class="py-2">
          <v-breadcrumbs
            :items="breadcrumbItems"
            divider="/"
            class="pa-0"
          >
            <template v-slot:item="{ item }">
              <v-breadcrumbs-item
                :to="item.to"
                :disabled="item.disabled"
                class="text-body-2"
              >
                {{ item.title }}
              </v-breadcrumbs-item>
            </template>
          </v-breadcrumbs>
        </v-container>
        
        <!-- Page Content -->
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>
    
    <!-- Application Footer -->
    <v-footer
      app
      color="grey-lighten-4"
      class="text-center pa-4"
      role="contentinfo"
    >
      <div class="d-flex justify-space-between align-center w-100">
        <div class="text-body-2 text-grey-darken-1">
          &copy; {{ currentYear }} Cucumber Test Results Viewer
        </div>
        
        <div class="d-flex align-center ga-4">
          <a
            href="https://github.com/srisritP2/TestResults"
            target="_blank"
            rel="noopener noreferrer"
            class="text-decoration-none text-grey-darken-1"
            aria-label="View source code on GitHub"
          >
            <v-icon size="20">mdi-github</v-icon>
          </a>
          
          <span class="text-body-2 text-grey-darken-1">
            v{{ appVersion }}
          </span>
        </div>
      </div>
    </v-footer>
    
    <!-- Upload Dialog -->
    <ReportUploadDialog
      v-model="showUploadDialog"
      @uploaded="handleReportUploaded"
    />
    
    <!-- About Dialog -->
    <AboutDialog v-model="showAboutDialog" />
    
    <!-- Help Dialog -->
    <HelpDialog v-model="showHelpDialog" />
    
    <!-- Global Snackbar for Notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom right"
    >
      {{ snackbar.message }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
          aria-label="Close notification"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
```

### Report Viewer Template Structure

```vue
<template>
  <article class="report-viewer" role="main">
    <!-- Report Header -->
    <header class="report-header">
      <div class="header-container">
        <div class="report-title-section">
          <h1 class="report-title">{{ reportTitle }}</h1>
          <p v-if="reportDescription" class="report-description">
            {{ reportDescription }}
          </p>
        </div>
        
        <div class="report-actions">
          <v-btn-group variant="outlined" divided>
            <v-btn
              @click="exportReport"
              prepend-icon="mdi-download"
              aria-label="Export report"
            >
              Export
            </v-btn>
            
            <v-btn
              @click="printReport"
              prepend-icon="mdi-printer"
              aria-label="Print report"
            >
              Print
            </v-btn>
            
            <v-btn
              @click="shareReport"
              prepend-icon="mdi-share"
              aria-label="Share report"
            >
              Share
            </v-btn>
          </v-btn-group>
          
          <v-btn
            color="error"
            variant="outlined"
            @click="confirmDelete"
            prepend-icon="mdi-delete"
            aria-label="Delete this report"
          >
            Delete
          </v-btn>
        </div>
      </div>
      
      <!-- Report Statistics -->
      <div class="report-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ statistics.totalScenarios }}</div>
            <div class="stat-label">Total Scenarios</div>
          </div>
          
          <div class="stat-item stat-passed">
            <div class="stat-value">{{ statistics.passed }}</div>
            <div class="stat-label">Passed</div>
          </div>
          
          <div class="stat-item stat-failed">
            <div class="stat-value">{{ statistics.failed }}</div>
            <div class="stat-label">Failed</div>
          </div>
          
          <div class="stat-item stat-skipped">
            <div class="stat-value">{{ statistics.skipped }}</div>
            <div class="stat-label">Skipped</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">{{ statistics.passRate }}%</div>
            <div class="stat-label">Pass Rate</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">{{ formatDuration(statistics.totalDuration) }}</div>
            <div class="stat-label">Total Duration</div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Controls Section -->
    <section class="controls-section" aria-label="Report filters and search">
      <div class="controls-container">
        <!-- Search Input -->
        <div class="search-container">
          <v-text-field
            v-model="searchQuery"
            label="Search scenarios, features, or steps..."
            prepend-inner-icon="mdi-magnify"
            clearable
            outlined
            dense
            hide-details
            @input="onSearchInput"
            aria-label="Search through report content"
          />
        </div>
        
        <!-- Status Filter -->
        <div class="filter-container">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="Filter by status"
            outlined
            dense
            hide-details
            aria-label="Filter scenarios by status"
          />
        </div>
        
        <!-- Tag Filter -->
        <div class="filter-container">
          <v-autocomplete
            v-model="selectedTags"
            :items="availableTags"
            label="Filter by tags"
            multiple
            chips
            outlined
            dense
            hide-details
            aria-label="Filter scenarios by tags"
          />
        </div>
        
        <!-- View Options -->
        <div class="view-options">
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            variant="outlined"
            divided
            aria-label="Change view mode"
          >
            <v-btn value="expanded" aria-label="Expanded view">
              <v-icon>mdi-view-list</v-icon>
            </v-btn>
            <v-btn value="compact" aria-label="Compact view">
              <v-icon>mdi-view-headline</v-icon>
            </v-btn>
            <v-btn value="summary" aria-label="Summary view">
              <v-icon>mdi-view-dashboard</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>
    </section>
    
    <!-- Report Content -->
    <main class="content-section">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
          aria-label="Loading report content"
        />
        <p class="loading-text">Loading report data...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-container" role="alert">
        <v-alert
          type="error"
          variant="outlined"
          prominent
        >
          <v-alert-title>Error Loading Report</v-alert-title>
          <div>{{ error.message }}</div>
          
          <template v-slot:actions>
            <v-btn
              variant="outlined"
              @click="retryLoad"
            >
              Retry
            </v-btn>
          </template>
        </v-alert>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!filteredFeatures.length" class="empty-state">
        <div class="empty-icon">
          <v-icon size="64" color="grey-lighten-1">mdi-file-search-outline</v-icon>
        </div>
        <h2 class="empty-title">No scenarios found</h2>
        <p class="empty-description">
          Try adjusting your search terms or filters to see more results.
        </p>
        <v-btn
          variant="outlined"
          @click="clearFilters"
          prepend-icon="mdi-filter-remove"
        >
          Clear Filters
        </v-btn>
      </div>
      
      <!-- Features List -->
      <div v-else class="features-list">
        <FeatureCard
          v-for="feature in filteredFeatures"
          :key="feature.id"
          :feature="feature"
          :search-query="searchQuery"
          :view-mode="viewMode"
          @scenario-selected="handleScenarioSelected"
          @feature-expanded="handleFeatureExpanded"
        />
      </div>
    </main>
    
    <!-- Floating Action Button for Mobile -->
    <v-fab
      v-if="$vuetify.display.mobile"
      location="bottom end"
      size="large"
      color="primary"
      icon="mdi-filter"
      @click="showMobileFilters = true"
      aria-label="Open mobile filters"
    />
    
    <!-- Mobile Filters Dialog -->
    <v-dialog
      v-model="showMobileFilters"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <MobileFiltersDialog
        v-model:search="searchQuery"
        v-model:status="statusFilter"
        v-model:tags="selectedTags"
        :available-tags="availableTags"
        @close="showMobileFilters = false"
      />
    </v-dialog>
  </article>
</template>
```

### Feature Card Template Structure

```vue
<template>
  <article class="feature-card" :class="featureClasses">
    <!-- Feature Header -->
    <header class="feature-header" @click="toggleExpanded">
      <div class="feature-title">
        <v-icon
          :icon="featureIcon"
          :color="featureIconColor"
          size="24"
          aria-hidden="true"
        />
        
        <h3 class="feature-name">{{ feature.name }}</h3>
        
        <div class="feature-stats">
          <v-chip
            v-for="stat in featureStats"
            :key="stat.type"
            :color="stat.color"
            size="small"
            variant="tonal"
            :aria-label="`${stat.count} ${stat.type} scenarios`"
          >
            {{ stat.count }}
          </v-chip>
        </div>
        
        <v-spacer />
        
        <v-btn
          :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          variant="text"
          size="small"
          :aria-label="expanded ? 'Collapse feature' : 'Expand feature'"
          :aria-expanded="expanded"
        />
      </div>
      
      <p v-if="feature.description" class="feature-description">
        {{ feature.description }}
      </p>
    </header>
    
    <!-- Scenarios List -->
    <div
      v-show="expanded"
      class="scenarios-container"
      role="region"
      :aria-label="`Scenarios for ${feature.name}`"
    >
      <transition-group name="scenario" tag="div" class="scenarios-list">
        <ScenarioItem
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          :scenario="scenario"
          :search-query="searchQuery"
          :view-mode="viewMode"
          @selected="$emit('scenario-selected', scenario)"
          @expanded="handleScenarioExpanded"
        />
      </transition-group>
      
      <!-- Show More Button -->
      <div v-if="hasMoreScenarios" class="show-more-container">
        <v-btn
          variant="outlined"
          @click="showMoreScenarios"
          prepend-icon="mdi-chevron-down"
        >
          Show {{ remainingScenarios }} more scenarios
        </v-btn>
      </div>
    </div>
  </article>
</template>
```

## Semantic HTML Patterns

### Accessibility-First Markup

```html
<!-- Proper heading hierarchy -->
<h1>Main Report Title</h1>
  <h2>Feature Name</h2>
    <h3>Scenario Name</h3>
      <h4>Step Details</h4>

<!-- ARIA landmarks -->
<main role="main" aria-label="Report content">
<nav role="navigation" aria-label="Report navigation">
<aside role="complementary" aria-label="Report statistics">
<section role="region" aria-labelledby="feature-heading">

<!-- Form labels and descriptions -->
<label for="search-input">Search scenarios</label>
<input
  id="search-input"
  type="text"
  aria-describedby="search-help"
  aria-label="Search through report content"
>
<div id="search-help" class="sr-only">
  Search by scenario name, feature name, or step text
</div>

<!-- Button accessibility -->
<button
  type="button"
  aria-label="Delete report"
  aria-describedby="delete-description"
>
  <span aria-hidden="true">🗑️</span>
  Delete
</button>
<div id="delete-description" class="sr-only">
  This will permanently remove the report from the system
</div>

<!-- Table accessibility -->
<table role="table" aria-label="Test results summary">
  <caption>Summary of test execution results</caption>
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col">Scenarios</th>
      <th scope="col">Status</th>
      <th scope="col">Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">User Authentication</th>
      <td>5</td>
      <td>
        <span class="status-badge status-passed" aria-label="All scenarios passed">
          Passed
        </span>
      </td>
      <td>2.3s</td>
    </tr>
  </tbody>
</table>
```

### Progressive Enhancement

```html
<!-- Base functionality without JavaScript -->
<div class="report-viewer">
  <noscript>
    <div class="no-js-fallback">
      <h1>Test Report</h1>
      <p>This report requires JavaScript for full functionality.</p>
      <a href="/static-report.html">View static version</a>
    </div>
  </noscript>
  
  <!-- Enhanced with JavaScript -->
  <div class="js-enhanced" style="display: none;">
    <!-- Interactive components -->
  </div>
</div>

<script>
  // Show enhanced version when JS is available
  document.querySelector('.js-enhanced').style.display = 'block';
</script>
```

### Meta Tags and SEO

```html
<!-- Essential meta tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Interactive Cucumber test results viewer">
<meta name="keywords" content="cucumber, testing, bdd, automation">

<!-- Open Graph for social sharing -->
<meta property="og:title" content="Cucumber Report Viewer">
<meta property="og:description" content="View and analyze test results">
<meta property="og:type" content="website">
<meta property="og:url" content="https://srisritp2.github.io/TestResults/">
<meta property="og:image" content="/img/social-preview.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Cucumber Report Viewer">
<meta name="twitter:description" content="Interactive test results viewer">

<!-- Structured data for search engines -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Cucumber Report Viewer",
  "description": "Interactive viewer for Cucumber test results",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

This comprehensive HTML structure documentation ensures semantic, accessible, and SEO-friendly markup throughout the application.