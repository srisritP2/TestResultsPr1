<template>
  <div class="cucumber-report-root">
    <div class="cucumber-header polished-header mb-5">
      <div class="header-section">
        <div class="header-item">
          <div class="header-subitem">
            <svg viewBox="0 0 32 32" aria-hidden="true" class="cucumber-logo">
              <path fill="#23d160" d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 25c-6.065 0-11-4.935-11-11S9.935 5 16 5s11 4.935 11 11-4.935 11-11 11z"/>
              <path fill="#23d160" d="M12 10h8v2h-8zm0 4h8v2h-8zm0 4h6v2h-6z"/>
            </svg>
            <svg viewBox="0 0 128 128" aria-hidden="true" class="header-tech-logo">
              <path fill="#0074BD"
                d="M47.617 98.12s-4.767 2.774 3.397 3.71c9.892 1.13 14.947.968 25.845-1.092 0 0 2.871 1.795 6.873 3.351-24.439 10.47-55.308-.607-36.115-5.969zm-2.988-13.665s-5.348 3.959 2.823 4.805c10.567 1.091 18.91 1.18 33.354-1.6 0 0 1.993 2.025 5.132 3.131-29.542 8.64-62.446.68-41.309-6.336z">
              </path>
              <path fill="#EA2D2E"
                d="M69.802 61.271c6.025 6.935-1.58 13.17-1.58 13.17s15.289-7.891 8.269-17.777c-6.559-9.215-11.587-13.792 15.635-29.58 0 .001-42.731 10.67-22.324 34.187z">
              </path>
              <path fill="#0074BD"
                d="M102.123 108.229s3.529 2.91-3.888 5.159c-14.102 4.272-58.706 5.56-71.094.171-4.451-1.938 3.899-4.625 6.526-5.192 2.739-.593 4.303-.485 4.303-.485-4.953-3.487-32.013 6.85-13.743 9.815 49.821 8.076 90.817-3.637 77.896-9.468zM49.912 70.294s-22.686 5.389-8.033 7.348c6.188.828 18.518.638 30.011-.326 9.39-.789 18.813-2.474 18.813-2.474s-3.308 1.419-5.704 3.053c-23.042 6.061-67.544 3.238-54.731-2.958 10.832-5.239 19.644-4.643 19.644-4.643zm40.697 22.747c23.421-12.167 12.591-23.86 5.032-22.285-1.848.385-2.677.72-2.677.72s.688-1.079 2-1.543c14.953-5.255 26.451 15.503-4.823 23.725 0-.002.359-.327.468-.617z">
              </path>
              <path fill="#EA2D2E"
                d="M76.491 1.587S89.459 14.563 64.188 34.51c-20.266 16.006-4.621 25.13-.007 35.559-11.831-10.673-20.509-20.07-14.688-28.815C58.041 28.42 81.722 22.195 76.491 1.587z">
              </path>
              <path fill="#0074BD"
                d="M52.214 126.021c22.476 1.437 57-.8 57.817-11.436 0 0-1.571 4.032-18.577 7.231-19.186 3.612-42.854 3.191-56.887.874 0 .001 2.875 2.381 17.647 3.331z">
              </path>
            </svg>
            <svg viewBox="0 0 128 128" aria-hidden="true" class="header-tech-logo">
              <path fill="#00ADEF"
                d="M126 1.637l-67 9.834v49.831l67-.534zM1.647 66.709l.003 42.404 50.791 6.983-.04-49.057zM58.467 67.389l.094 49.465 67.376 9.509.016-58.863zM1.61 19.297l.047 42.383 50.791-.289-.023-49.016z">
              </path>
            </svg>
          </div>
          <span class="cucumber-header-title">Cucumber Reports</span>
        </div>
        <div class="header-item">
          <div class="header-subitem execution-summary">
            <span data-testid="setup.phrase">
              <code><strong>{{ report?.tool || 'cucumber-jvm' }}</strong><span v-if="report?.toolVersion">@{{ report.toolVersion }}</span></code>
              <em class="conjunction"> with </em>
              <code><strong>{{ report?.runtime || 'Java HotSpot(TM) 64-Bit Server VM' }}</strong><span v-if="report?.runtimeVersion">@{{ report.runtimeVersion }}</span></code>
              <em class="conjunction"> on </em>
              <code><strong>{{ report?.os || 'Windows 11' }}</strong></code>
            </span>
          </div>
        </div>
        <div class="header-item">
          <div class="header-subitem health-summary">
            <svg viewBox="0 0 42 42" aria-hidden="true" class="health-chart">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" stroke-width="3"></circle>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#00a818" stroke-width="3"
                :stroke-dasharray="passedPercentage + ' ' + (100 - passedPercentage)"
                stroke-dashoffset="25" transform="rotate(-90 21 21)"></circle>
              <circle v-if="summary.failed > 0" cx="21" cy="21" r="15.915" fill="transparent" stroke="#e53935" stroke-width="3"
                :stroke-dasharray="failedPercentage + ' ' + (100 - failedPercentage)"
                :stroke-dashoffset="25 - passedPercentage" transform="rotate(-90 21 21)"></circle>
            </svg>
            <span>{{ passedPercentage }}% passed</span>
          </div>
        </div>
        <div class="header-item">
          <div class="header-subitem time-summary">
            <v-icon color="primary" size="18" class="mr-1">mdi-stopwatch</v-icon>
            <span>
              <time :title="formattedDate" :datetime="reportTimestamp ? reportTimestamp.toISOString() : ''">
                {{ timeAgo }}
              </time>
              <em class="conjunction"> in </em>
              <span>{{ summary.duration }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="cucumber-report-content">
      <div v-if="error" class="cucumber-alert error">{{ error }}</div>
      <div v-else-if="!report || !Array.isArray(report.features) || report.features.length === 0"
        class="cucumber-alert info">
        No report data available or invalid report format. Please upload a valid Cucumber JSON file.
      </div>
      <template v-else>
        <!-- Search Bar -->
        <div class="cucumber-search-bar">
          <v-text-field v-model="searchQuery" placeholder="Search features, scenarios, and steps..."
            prepend-inner-icon="mdi-magnify" clearable variant="outlined" density="compact" class="search-input"
            @input="onSearchInput"></v-text-field>
          <div v-if="searchQuery && searchResults.total > 0" class="search-results-summary">
            Found {{ searchResults.total }} results ({{ searchResults.features }} features, {{ searchResults.scenarios
            }} scenarios, {{ searchResults.steps }} steps)
          </div>
          <div v-else-if="searchQuery && searchResults.total === 0" class="search-no-results">
            No results found for "{{ searchQuery }}"
          </div>
        </div>

        <!-- Advanced Filters -->
        <div class="cucumber-filters-bar">
          <div class="filters-row">
            <!-- Status Filter -->
            <div class="filter-group">
              <label class="filter-label">Status:</label>
              <v-select v-model="filters.status" :items="statusFilterOptions" item-title="text" item-value="value"
                multiple chips closable-chips variant="outlined" density="compact" class="filter-select"
                placeholder="All statuses" @update:modelValue="applyFilters"></v-select>
            </div>

            <!-- Tags Filter -->
            <div class="filter-group">
              <label class="filter-label">Tags:</label>
              <v-select v-model="filters.tags" :items="availableTags" multiple chips closable-chips variant="outlined"
                density="compact" class="filter-select" placeholder="All tags"
                @update:modelValue="applyFilters"></v-select>
            </div>

            <!-- Duration Filter -->
            <div class="filter-group">
              <label class="filter-label">Duration:</label>
              <v-select v-model="filters.duration" :items="durationFilterOptions" item-title="text" item-value="value"
                variant="outlined" density="compact" class="filter-select" placeholder="All durations"
                @update:modelValue="applyFilters"></v-select>
            </div>

            <!-- Feature Filter -->
            <div class="filter-group">
              <label class="filter-label">Features:</label>
              <v-select v-model="filters.features" :items="availableFeatures" item-title="text" item-value="value"
                multiple chips closable-chips variant="outlined" density="compact" class="filter-select"
                placeholder="All features" @update:modelValue="applyFilters"></v-select>
            </div>

            <!-- Clear Filters Button -->
            <div class="filter-group">
              <v-btn @click="clearAllFilters" variant="outlined" color="secondary" size="small"
                class="clear-filters-btn">
                <v-icon size="16" class="mr-1">mdi-filter-remove</v-icon>
                Clear Filters
              </v-btn>
            </div>
          </div>

          <!-- Active Filters Summary -->
          <div v-if="hasActiveFilters" class="active-filters-summary">
            <span class="filters-summary-text">
              Active filters: {{ getActiveFiltersText() }}
              <span class="filtered-results-count">({{ filteredFeaturesCount }} features shown)</span>
            </span>
          </div>
        </div>

        <!-- Top summary bar -->
        <div class="cucumber-summary-bar">
          <div class="summary-env">
            <v-icon color="primary" size="18" class="mr-1">mdi-laptop</v-icon>
            <span class="env-label">Environment:</span>
            <span class="env-value">{{ report.environment || 'N/A' }}</span>
          </div>
          <div class="summary-stats">
            <span class="stat passed">
              <v-icon color="success" size="18">mdi-check-circle</v-icon>
              {{ summary.passed }} Passed
            </span>
            <span class="stat failed">
              <v-icon color="error" size="18">mdi-close-circle</v-icon>
              {{ summary.failed }} Failed
            </span>
            <span class="stat skipped">
              <v-icon color="warning" size="18">mdi-alert-circle</v-icon>
              {{ summary.skipped }} Skipped
            </span>
            <span class="stat duration">
              <v-icon color="primary" size="18">mdi-timer</v-icon>
              {{ summary.duration }}
            </span>
          </div>
        </div>

        <!-- Features list with expandable scenarios -->
        <v-expansion-panels multiple class="cucumber-features-list">
          <v-expansion-panel v-for="(feature, idx) in filteredFeatures" :key="feature.id || feature.name">
            <v-expansion-panel-title class="cucumber-feature-row" :class="[featureStatus(feature)]">
              <v-icon v-if="featureStatus(feature) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
              <v-icon v-else-if="featureStatus(feature) === 'failed'" color="error" size="18">mdi-close-circle</v-icon>
              <v-icon v-else-if="featureStatus(feature) === 'skipped'" color="warning"
                size="18">mdi-alert-circle</v-icon>
              <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
              <span class="feature-file">{{ feature.uri || feature.name }}</span>
              <!-- <span class="feature-title" style="font-weight:700;">{{ feature.name }}</span> -->
              <span v-if="feature.tags && feature.tags.length" class="feature-tags">
                <span v-for="tag in feature.tags" :key="tag" class="feature-tag">{{ cleanTagText(tag) }}</span>
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="feature.description" class="feature-description">{{ feature.description }}</div>
              <div v-for="scenario in feature.elements.filter(el => el.type !== 'background')"
                :key="scenario.id || scenario.name" class="cucumber-scenario-block">
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title class="scenario-header-row">
                      <div class="scenario-header-content">
                        <div class="scenario-title-row">
                          <span class="scenario-title">{{ scenario.keyword || 'Scenario' }}: {{ scenario.name ||
                            scenario.id || (scenario.type ? scenario.type : 'Unnamed Scenario') }}</span>
                          <v-icon v-if="scenarioStatus(scenario) === 'passed'" color="success"
                            size="18">mdi-check-circle</v-icon>
                          <v-icon v-else-if="scenarioStatus(scenario) === 'failed'" color="error"
                            size="18">mdi-close-circle</v-icon>
                          <v-icon v-else-if="scenarioStatus(scenario) === 'skipped'" color="warning"
                            size="18">mdi-alert-circle</v-icon>
                          <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
                          <span class="scenario-duration">{{ formatDuration(scenario.duration) }}</span>
                        </div>
                        <div v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
                          <span v-for="tag in scenario.tags" :key="tag" class="scenario-tag">{{ cleanTagText(tag)
                          }}</span>
                        </div>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <ul class="cucumber-steps-list">
                        <li v-for="(step, idx) in scenario.steps" :key="step.keyword + step.name + idx"
                          class="cucumber-step-row">
                          <v-icon v-if="stepStatus(step) === 'passed'" color="success"
                            size="16">mdi-check-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'failed'" color="error"
                            size="16">mdi-close-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'skipped'" color="warning"
                            size="16">mdi-alert-circle</v-icon>
                          <v-icon v-else color="grey" size="16">mdi-help-circle</v-icon>
                          <span class="step-keyword">{{ step.keyword }}</span>
                          <span class="step-text">{{ step.name }}</span>
                          <span v-if="step.duration" class="step-duration">({{ formatDuration(step.duration) }})</span>
                          <div v-if="step.errorMessage" class="step-error-block">
                            <pre class="step-error-message">
                              {{ shouldTruncate(step.errorMessage) && !step._showFullError ? truncateError(step.errorMessage) : step.errorMessage }}
                            </pre>
                            <a v-if="shouldTruncate(step.errorMessage)" @click.prevent="toggleErrorExpand(step)"
                              class="show-more-link">
                              {{ step._showFullError ? 'Show less' : 'Show more' }}
                            </a>
                          </div>
                        </li>
                      </ul>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </div>
  </div>
</template>

<script>
function getScenarioList(feature) {
  // Try all common Cucumber JSON keys for scenarios
  if (Array.isArray(feature.scenarios)) return feature.scenarios;
  if (Array.isArray(feature.elements)) return feature.elements;
  if (Array.isArray(feature.children)) return feature.children;
  return [];
}

export default {
  name: 'ReportViewer',
  props: {
    report: {
      type: Object,
      required: false
    },
    // section prop removed, no longer needed
    selectedFeatureIndex: {
      type: Number,
      default: 0,
    },
  },
  methods: {
    scenarioStatus(scenario) {
      // Try to determine scenario status from common Cucumber JSON structures
      if (scenario.status) return scenario.status;
      if (scenario.steps && scenario.steps.some(s => (s.result && s.result.status === 'failed') || s.status === 'failed')) return 'failed';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'skipped') || s.status === 'skipped')) return 'skipped';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'passed') || s.status === 'passed')) return 'passed';
      return 'unknown';
    },
    scenarioStatusStyle(scenario) {
      const status = this.scenarioStatus(scenario);
      if (status === 'passed') {
        return {
          background: '#e8f5e9',
          color: '#388e3c',
          fontWeight: 'bold',
        };
      } else if (status === 'failed') {
        return {
          background: '#ffebee',
          color: '#e53935',
          fontWeight: 'bold',
        };
      }
      return {
        background: '#f2f2f2',
        color: '#222',
      };
    },
    toggleErrorExpand(step) {
      this.$set(step, '_showFullError', !step._showFullError);
    },
    stepStatus(step) {
      if (step.result && step.result.status) return step.result.status;
      if (step.status) return step.status;
      return 'unknown';
    },
    stepKeywordClass(keyword) {
      return 'step-keyword';
    },
    formatDuration(duration, alwaysSeconds = false) {
      if (typeof duration !== 'number' || isNaN(duration)) return '-';
      // If duration is in nanoseconds, convert to seconds
      if (duration > 1000000) duration = duration / 1e9;
      // Show as X minutes Y seconds if >= 60s
      if (duration >= 60) {
        const mins = Math.floor(duration / 60);
        const secs = Math.round(duration % 60);
        return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
      }
      if (duration < 1 && !alwaysSeconds) return (duration * 1000).toFixed(0) + ' ms';
      return duration.toFixed(2) + ' s';
    },
    shouldTruncate(msg) {
      return msg && msg.split('\n').length > 5;
    },
    truncateError(msg) {
      if (!msg) return '';
      const lines = msg.split('\n');
      if (lines.length <= 5) return msg;
      return lines.slice(0, 5).join('\n') + '\n...';
    },
    summaryBarWidth(type) {
      const total = this.summary.total || 1;
      const val = this.summary[type] || 0;
      return (val / total * 100).toFixed(1) + '%';
    },
    featureStatus(feature) {
      if (!feature || !feature.elements) return '';

      // Filter out background elements to only consider actual scenarios
      const scenarios = feature.elements.filter(el => el.type !== 'background');
      if (scenarios.length === 0) return '';

      // Check if any scenario failed
      if (scenarios.some(s => this.scenarioStatus(s) === 'failed')) return 'failed';

      // Check if all scenarios passed
      if (scenarios.every(s => this.scenarioStatus(s) === 'passed')) return 'passed';

      // Check if all scenarios are skipped
      if (scenarios.every(s => this.scenarioStatus(s) === 'skipped')) return 'skipped';

      // Mixed status or unknown
      return '';
    },
    onSearchInput() {
      // Clear existing timer
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }

      // Debounce search for performance
      this.searchDebounceTimer = setTimeout(() => {
        this.performSearch();
      }, 300);
    },
    performSearch() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        this.searchResults = { total: 0, features: 0, scenarios: 0, steps: 0 };
        return;
      }

      const query = this.searchQuery.toLowerCase().trim();
      let totalResults = 0;
      let featureMatches = 0;
      let scenarioMatches = 0;
      let stepMatches = 0;

      if (!this.report || !this.report.features) {
        this.searchResults = { total: 0, features: 0, scenarios: 0, steps: 0 };
        return;
      }

      // Search through features, scenarios, and steps
      this.report.features.forEach(feature => {
        // Search in feature name and description
        const featureText = `${feature.name || ''} ${feature.description || ''} ${feature.uri || ''}`.toLowerCase();
        if (featureText.includes(query)) {
          featureMatches++;
          totalResults++;
        }

        // Search in feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => {
            const tagText = this.cleanTagText(tag).toLowerCase();
            if (tagText.includes(query)) {
              featureMatches++;
              totalResults++;
            }
          });
        }

        // Search in scenarios
        if (feature.elements) {
          feature.elements.forEach(scenario => {
            // Search in scenario name
            const scenarioText = `${scenario.name || ''}`.toLowerCase();
            if (scenarioText.includes(query)) {
              scenarioMatches++;
              totalResults++;
            }

            // Search in scenario tags
            if (scenario.tags) {
              scenario.tags.forEach(tag => {
                const tagText = this.cleanTagText(tag).toLowerCase();
                if (tagText.includes(query)) {
                  scenarioMatches++;
                  totalResults++;
                }
              });
            }

            // Search in steps
            if (scenario.steps) {
              scenario.steps.forEach(step => {
                const stepText = `${step.keyword || ''} ${step.name || ''}`.toLowerCase();
                if (stepText.includes(query)) {
                  stepMatches++;
                  totalResults++;
                }

                // Search in error messages
                if (step.errorMessage && step.errorMessage.toLowerCase().includes(query)) {
                  stepMatches++;
                  totalResults++;
                }
              });
            }
          });
        }
      });

      this.searchResults = {
        total: totalResults,
        features: featureMatches,
        scenarios: scenarioMatches,
        steps: stepMatches
      };
    },
    cleanTagText(tag) {
      // Handle different tag formats from Cucumber JSON
      let tagText = '';

      if (typeof tag === 'string') {
        tagText = tag;
      } else if (tag && typeof tag === 'object') {
        // Handle tag objects - common properties in Cucumber JSON
        tagText = tag.name || tag.value || tag.tag || tag.text || '';
      } else {
        // Handle other non-string values
        tagText = tag ? String(tag) : '';
      }

      // Remove curly braces from tag text
      return tagText.replace(/[{}]/g, '');
    },
    applyFilters() {
      // Filters are applied through computed properties
      // This method is called when filter values change
    },
    clearAllFilters() {
      this.filters = {
        status: [],
        tags: [],
        duration: null,
        features: []
      };
    },
    getActiveFiltersText() {
      const activeFilters = [];

      if (this.filters.status.length > 0) {
        activeFilters.push(`Status: ${this.filters.status.join(', ')}`);
      }

      if (this.filters.tags.length > 0) {
        activeFilters.push(`Tags: ${this.filters.tags.join(', ')}`);
      }

      if (this.filters.duration) {
        const durationOption = this.durationFilterOptions.find(opt => opt.value === this.filters.duration);
        activeFilters.push(`Duration: ${durationOption?.text || this.filters.duration}`);
      }

      if (this.filters.features.length > 0) {
        activeFilters.push(`Features: ${this.filters.features.length} selected`);
      }

      return activeFilters.join(' | ');
    },
    getFeatureDuration(feature) {
      if (!feature || !feature.elements) return 0;

      let totalDuration = 0;
      feature.elements.forEach(scenario => {
        if (scenario.steps) {
          scenario.steps.forEach(step => {
            if (step.result && typeof step.result.duration === 'number') {
              totalDuration += step.result.duration;
            } else if (typeof step.duration === 'number') {
              totalDuration += step.duration;
            }
          });
        }
      });

      // Convert from nanoseconds to seconds if needed
      if (totalDuration > 1000000) {
        totalDuration = totalDuration / 1e9;
      }

      return totalDuration;
    }
  },
  data() {
    return {
      error: '',
      searchQuery: '',
      searchResults: {
        total: 0,
        features: 0,
        scenarios: 0,
        steps: 0
      },
      searchDebounceTimer: null,
      filters: {
        status: [],
        tags: [],
        duration: null,
        features: []
      }
    }
  },
  computed: {
    summary() {
      let passed = 0, failed = 0, skipped = 0, total = 0, duration = 0;
      if (!this.report || !Array.isArray(this.report.features)) return { passed, failed, skipped, total, duration: 0 };
      this.report.features.forEach(feature => {
        const scenarios = Array.isArray(feature.elements) ? feature.elements.filter(el => el.type !== 'background') : [];
        scenarios.forEach(scenario => {
          const status = this.scenarioStatus(scenario);
          if (status === 'passed') passed++;
          else if (status === 'failed') failed++;
          else skipped++;
          total++;
          if (Array.isArray(scenario.steps)) {
            duration += scenario.steps.reduce((acc, st) => acc + (typeof st.result?.duration === 'number' ? st.result.duration : 0), 0);
          }
          
          // Add before hook durations (setup)
          if (Array.isArray(scenario.before)) {
            duration += scenario.before.reduce((acc, hook) => acc + (typeof hook.result?.duration === 'number' ? hook.result.duration : 0), 0);
          }
          
          // Add after hook durations (teardown)
          if (Array.isArray(scenario.after)) {
            duration += scenario.after.reduce((acc, hook) => acc + (typeof hook.result?.duration === 'number' ? hook.result.duration : 0), 0);
          }
        });
      });
      return {
        passed,
        failed,
        skipped,
        total,
        duration: this.formatDuration(duration, true)
      };
    },
    statusFilterOptions() {
      return [
        { text: 'Passed', value: 'passed' },
        { text: 'Failed', value: 'failed' },
        { text: 'Skipped', value: 'skipped' }
      ];
    },
    durationFilterOptions() {
      return [
        { text: 'Fast tests (< 1s)', value: 'fast' },
        { text: 'Medium tests (1-10s)', value: 'medium' },
        { text: 'Slow tests (> 10s)', value: 'slow' }
      ];
    },
    availableTags() {
      if (!this.report || !this.report.features) return [];

      const tagSet = new Set();
      this.report.features.forEach(feature => {
        // Collect feature tags
        if (feature.tags) {
          feature.tags.forEach(tag => {
            const cleanTag = this.cleanTagText(tag);
            if (cleanTag) tagSet.add(cleanTag);
          });
        }

        // Collect scenario tags
        if (feature.elements) {
          feature.elements.forEach(scenario => {
            if (scenario.tags) {
              scenario.tags.forEach(tag => {
                const cleanTag = this.cleanTagText(tag);
                if (cleanTag) tagSet.add(cleanTag);
              });
            }
          });
        }
      });

      return Array.from(tagSet).sort();
    },
    availableFeatures() {
      if (!this.report || !this.report.features) return [];

      return this.report.features.map(feature => ({
        text: feature.name || feature.uri || 'Unnamed Feature',
        value: feature.id || feature.name || feature.uri
      }));
    },
    hasActiveFilters() {
      return this.filters.status.length > 0 ||
        this.filters.tags.length > 0 ||
        this.filters.duration !== null ||
        this.filters.features.length > 0;
    },
    filteredFeatures() {
      if (!this.report || !this.report.features) return [];
      if (!this.hasActiveFilters) return this.report.features;

      return this.report.features.filter(feature => {
        // Status filter
        if (this.filters.status.length > 0) {
          const featureStatusValue = this.featureStatus(feature);

          // If filtering for skipped, check if feature has any scenarios with skipped steps
          if (this.filters.status.includes('skipped')) {
            const hasSkippedSteps = feature.elements && feature.elements.some(scenario =>
              scenario.steps && scenario.steps.some(step =>
                (step.result && step.result.status === 'skipped') || step.status === 'skipped'
              )
            );
            if (hasSkippedSteps) {
              // Feature has scenarios with skipped steps, include it
            } else if (!this.filters.status.includes(featureStatusValue)) {
              return false;
            }
          } else if (!this.filters.status.includes(featureStatusValue)) {
            return false;
          }
        }

        // Tags filter
        if (this.filters.tags.length > 0) {
          const featureTags = [];

          // Collect feature tags
          if (feature.tags) {
            feature.tags.forEach(tag => {
              const cleanTag = this.cleanTagText(tag);
              if (cleanTag) featureTags.push(cleanTag);
            });
          }

          // Collect scenario tags
          if (feature.elements) {
            feature.elements.forEach(scenario => {
              if (scenario.tags) {
                scenario.tags.forEach(tag => {
                  const cleanTag = this.cleanTagText(tag);
                  if (cleanTag) featureTags.push(cleanTag);
                });
              }
            });
          }

          // Check if any selected tags match
          const hasMatchingTag = this.filters.tags.some(selectedTag =>
            featureTags.includes(selectedTag)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }

        // Duration filter
        if (this.filters.duration) {
          const featureDuration = this.getFeatureDuration(feature);

          if (this.filters.duration === 'fast' && featureDuration >= 1) {
            return false;
          } else if (this.filters.duration === 'medium' && (featureDuration < 1 || featureDuration > 10)) {
            return false;
          } else if (this.filters.duration === 'slow' && featureDuration <= 10) {
            return false;
          }
        }

        // Features filter
        if (this.filters.features.length > 0) {
          const featureId = feature.id || feature.name || feature.uri;
          if (!this.filters.features.includes(featureId)) {
            return false;
          }
        }

        return true;
      });
    },
    filteredFeaturesCount() {
      return this.filteredFeatures.length;
    },
    reportTimestamp() {
      if (!this.report || !this.report.features) return null;
      
      // Find the earliest start_timestamp from all scenarios
      let earliestTimestamp = null;
      
      this.report.features.forEach(feature => {
        if (feature.elements) {
          feature.elements.forEach(scenario => {
            if (scenario.start_timestamp) {
              const timestamp = new Date(scenario.start_timestamp);
              if (!earliestTimestamp || timestamp < earliestTimestamp) {
                earliestTimestamp = timestamp;
              }
            }
          });
        }
      });
      
      return earliestTimestamp;
    },
    timeAgo() {
      if (!this.reportTimestamp) return '1 day ago';
      
      const now = new Date();
      const diffMs = now - this.reportTimestamp;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return 'just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return this.reportTimestamp.toLocaleDateString();
      }
    },
    formattedDate() {
      if (!this.reportTimestamp) return '';
      return this.reportTimestamp.toLocaleString();
    },
    passedPercentage() {
      if (this.summary.total === 0) return 0;
      return (this.summary.passed / this.summary.total * 100).toFixed(1);
    },
    failedPercentage() {
      if (this.summary.total === 0) return 0;
      return (this.summary.failed / this.summary.total * 100).toFixed(1);
    }
  }
}
</script>

<style scoped>
/* Polished Cucumber Reports Header */
.polished-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.2rem 2rem 0.7rem 2rem;
  margin-bottom: 1.5rem;
}

.header-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2.5rem;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.header-subitem {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.header-tech-logo {
  width: 28px;
  height: 28px;
  margin-left: 0.2em;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

.execution-summary code {
  background: #f3f6fa;
  border-radius: 4px;
  padding: 0.1em 0.5em;
  font-size: 1.01em;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
}

.execution-summary em.conjunction {
  color: #888;
  font-style: normal;
  margin: 0 0.2em;
}

.health-summary {
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: 500;
  color: #00a818;
}

.health-chart {
  width: 32px;
  height: 32px;
  margin-right: 0.2em;
}

.time-summary {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #1976d2;
  font-weight: 500;
}

.time-summary time {
  color: #222;
  font-weight: 500;
}

.mb-5 {
  margin-bottom: 2.5rem !important;
}

/* Cucumber Reports Classic Style */
.cucumber-report-root {
  min-height: 100vh;
  background: #fff;
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  color: #23272f;
}

.cucumber-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1.2rem 2rem 0.7rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  margin-bottom: 1.5rem;
}

.cucumber-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

.cucumber-header-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #388e3c;
  letter-spacing: 0.01em;
  margin-left: 0.5em;
}

.cucumber-report-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
}

.cucumber-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  margin-bottom: 1.2rem;
  font-size: 1.05rem;
}

.summary-env {
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: #444;
}

.env-label {
  font-weight: 500;
  color: #222;
}

.env-value {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
  font-size: 1.01em;
}

.summary-stats {
  display: flex;
  gap: 1.2em;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.3em;
  font-weight: 500;
  font-size: 1.01em;
}

.stat.passed {
  color: #388e3c;
}

.stat.failed {
  color: #e53935;
}

.stat.skipped {
  color: #b26a00;
}

.stat.duration {
  color: #1976d2;
}

.cucumber-alert {
  border-radius: 6px;
  padding: 1em 1.2em;
  margin-bottom: 1.2em;
  font-size: 1.05em;
}

.cucumber-alert.error {
  background: #ffebee;
  color: #b71c1c;
  border: 1px solid #ffcdd2;
}

.cucumber-alert.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #90caf9;
}

.cucumber-features-list {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.2rem;
  padding: 0.5rem 0.7rem;
}

.cucumber-feature-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.6em 0.5em;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.01em;
  transition: background 0.15s;
}

.cucumber-feature-row.selected {
  background: #e3f2fd;
}

.cucumber-feature-row.passed {
  background: #e8f5e9;
}

.cucumber-feature-row.failed {
  background: #ffebee;
}

.feature-file {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: #1976d2;
  font-size: 0.98em;
}

.cucumber-feature-details {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.2rem 1.5rem 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
}

.feature-title-block {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 0.3em;
}

.feature-title {
  font-size: 1.13rem;
  font-weight: 700;
  color: #222;
}

.feature-tags {
  display: flex;
  gap: 0.3em;
  text-align: left;
  flex-wrap: wrap;
  ;
}

.feature-tag {
  font-size: 0.97em;
  color: #b26a00;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-weight: 600;
  background: #fffbe7;
  border-radius: 4px;
  padding: 0 0.4em;
  letter-spacing: 0.01em;
}

.feature-description {
  color: #444;
  font-size: 1.01em;
  margin-bottom: 0.7em;
  text-align: left;
}

.cucumber-scenario-block {
  border-top: 1px solid #e5e7eb;
  padding: 1.1em 0 0.7em 0;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 1.2em;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.scenario-header-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.7em 1em;
  font-size: 1.01em;
  font-weight: 600;
  margin-bottom: 0.2em;
  word-break: break-word;
}

.scenario-header-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: left;
}

.scenario-title-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.3em;
}

.scenario-title {
  font-weight: 700;
  color: #222;
  flex: 1;
  word-break: break-word;
  text-align: left;
}

.scenario-tags {
  display: flex;
  gap: 0.3em;
  text-align: left;
  flex-wrap: wrap;
  margin-left: 0;
}

.scenario-tag {
  font-size: 0.97em;
  color: #b26a00;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-weight: 600;
  background: #fffbe7;
  border-radius: 4px;
  padding: 0 0.4em;
  letter-spacing: 0.01em;
}

.scenario-duration {
  margin-left: auto;
  color: #64748b;
  font-size: 0.97em;
  white-space: nowrap;
}

.cucumber-steps-list {
  list-style: none;
  margin: 0.5em 0 0 0;
  padding: 0;
}

.cucumber-step-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6em;
  font-size: 0.99em;
  padding: 0.2em 0;
  flex-wrap: wrap;
  word-break: break-word;
}

.step-keyword {
  font-weight: 600;
  color: #1976d2;
  min-width: 48px;
}

.step-text {
  color: #23272f;
  flex: 1 1 200px;
  word-break: break-word;
  text-align: left;
}

.step-duration {
  color: #888;
  font-size: 0.95em;
  margin-left: 0.5em;
}

.step-error-block {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  margin-top: 0.3em;
  margin-left: 0;
  padding: 0.7em 1em;
  width: 100%;
  overflow-x: auto;
  word-break: break-word;
}

.step-error-message {
  color: #b71c1c;
  font-size: 0.97em;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  white-space: pre-wrap;
  margin: 0;
  word-break: break-word;
  text-align: left;
}

.cucumber-summary-bar {
  display: flex;
  gap: 1.5em;
  font-size: 1.08em;
  margin-bottom: 1.2em;
  align-items: center;
}

.summary-passed {
  color: #388e3c;
  font-weight: bold;
}

.summary-failed {
  color: #e53935;
  font-weight: bold;
}

.summary-skipped {
  color: #888;
}

.summary-total {
  color: #1976d2;
}

.summary-duration {
  color: #444;
}

.cucumber-scenario-block {
  margin-bottom: 1em;
}

.cucumber-steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cucumber-step-row {
  display: flex;
  gap: 1em;
  align-items: center;
  margin-bottom: 0.3em;
}



.step-name {
  color: #222;
}

.step-status {
  margin-left: auto;
}

.scenario-status-label {
  margin-left: 1em;
  font-size: 0.95em;
}

.cucumber-alert.info {
  color: #1976d2;
  background: #e3f2fd;
  padding: 0.5em 1em;
  border-radius: 6px;
  margin-top: 1em;
}

/* Search Bar Styles */
.cucumber-search-bar {
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 0.5rem;
}

.search-results-summary {
  color: #388e3c;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-results-summary::before {
  content: "✓";
  color: #388e3c;
  font-weight: bold;
}

.search-no-results {
  color: #e53935;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-no-results::before {
  content: "⚠";
  color: #e53935;
  font-weight: bold;
}


/* Search Bar Styles */
.cucumber-search-bar {
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 0.5rem;
}

.search-results-summary {
  color: #388e3c;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-results-summary::before {
  content: "✓";
  color: #388e3c;
  font-weight: bold;
}

.search-no-results {
  color: #e53935;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-no-results::before {
  content: "⚠";
  color: #e53935;
  font-weight: bold;
}

/* <!-- Advanced Filters Styles --> */
.cucumber-filters-bar {
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
  flex: 1;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-select {
  min-width: 150px;
}

.clear-filters-btn {
  margin-top: 1.5rem;
  height: 40px;
}

.active-filters-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.filters-summary-text {
  color: #6b7280;
  font-size: 0.9rem;
}

.filtered-results-count {
  color: #1976d2;
  font-weight: 600;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-filters-btn {
    margin-top: 1rem;
    width: 100%;
  }
}

/* Search 
Bar Styles */
.cucumber-search-bar {
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 0.5rem;
}

.search-results-summary {
  color: #388e3c;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-results-summary::before {
  content: "✓";
  color: #388e3c;
  font-weight: bold;
}

.search-no-results {
  color: #e53935;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-no-results::before {
  content: "⚠";
  color: #e53935;
  font-weight: bold;
}

/* Advanced Filters Styles */
.cucumber-filters-bar {
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
  flex: 1;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-select {
  min-width: 150px;
}

.clear-filters-btn {
  margin-top: 1.5rem;
  height: 40px;
}

.active-filters-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.filters-summary-text {
  color: #6b7280;
  font-size: 0.9rem;
}

.filtered-results-count {
  color: #1976d2;
  font-weight: 600;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-filters-btn {
    margin-top: 1rem;
    width: 100%;
  }
}
</style>