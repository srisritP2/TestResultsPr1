<template>
  <div class="cucumber-report-root">
    <div class="cucumber-header polished-header mb-5">
      <div class="header-section">
        <div class="header-item">
          <div class="header-subitem">
            <img src="https://reports.cucumber.io/images/cucumber-logo.svg" alt="Cucumber Reports" class="cucumber-logo" />
            <svg viewBox="0 0 128 128" aria-hidden="true" class="header-tech-logo"><path fill="#0074BD" d="M47.617 98.12s-4.767 2.774 3.397 3.71c9.892 1.13 14.947.968 25.845-1.092 0 0 2.871 1.795 6.873 3.351-24.439 10.47-55.308-.607-36.115-5.969zm-2.988-13.665s-5.348 3.959 2.823 4.805c10.567 1.091 18.91 1.18 33.354-1.6 0 0 1.993 2.025 5.132 3.131-29.542 8.64-62.446.68-41.309-6.336z"></path><path fill="#EA2D2E" d="M69.802 61.271c6.025 6.935-1.58 13.17-1.58 13.17s15.289-7.891 8.269-17.777c-6.559-9.215-11.587-13.792 15.635-29.58 0 .001-42.731 10.67-22.324 34.187z"></path><path fill="#0074BD" d="M102.123 108.229s3.529 2.91-3.888 5.159c-14.102 4.272-58.706 5.56-71.094.171-4.451-1.938 3.899-4.625 6.526-5.192 2.739-.593 4.303-.485 4.303-.485-4.953-3.487-32.013 6.85-13.743 9.815 49.821 8.076 90.817-3.637 77.896-9.468zM49.912 70.294s-22.686 5.389-8.033 7.348c6.188.828 18.518.638 30.011-.326 9.39-.789 18.813-2.474 18.813-2.474s-3.308 1.419-5.704 3.053c-23.042 6.061-67.544 3.238-54.731-2.958 10.832-5.239 19.644-4.643 19.644-4.643zm40.697 22.747c23.421-12.167 12.591-23.86 5.032-22.285-1.848.385-2.677.72-2.677.72s.688-1.079 2-1.543c14.953-5.255 26.451 15.503-4.823 23.725 0-.002.359-.327.468-.617z"></path><path fill="#EA2D2E" d="M76.491 1.587S89.459 14.563 64.188 34.51c-20.266 16.006-4.621 25.13-.007 35.559-11.831-10.673-20.509-20.07-14.688-28.815C58.041 28.42 81.722 22.195 76.491 1.587z"></path><path fill="#0074BD" d="M52.214 126.021c22.476 1.437 57-.8 57.817-11.436 0 0-1.571 4.032-18.577 7.231-19.186 3.612-42.854 3.191-56.887.874 0 .001 2.875 2.381 17.647 3.331z"></path></svg>
            <svg viewBox="0 0 128 128" aria-hidden="true" class="header-tech-logo"><path fill="#00ADEF" d="M126 1.637l-67 9.834v49.831l67-.534zM1.647 66.709l.003 42.404 50.791 6.983-.04-49.057zM58.467 67.389l.094 49.465 67.376 9.509.016-58.863zM1.61 19.297l.047 42.383 50.791-.289-.023-49.016z"></path></svg>
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
            <svg viewBox="0 0 100 100" aria-hidden="true" class="health-chart"><g transform="rotate(-90 50 50)"><path :stroke-dasharray="(summary.passed / summary.total * 52).toFixed(0) + ' ' + (52 - (summary.passed / summary.total * 52)).toFixed(0)" stroke-dashoffset="50" stroke-width="50" d="M75 50a1 1 90 10-50 0a1 1 90 10 50 0" fill="none" stroke="#00a818"/><path :stroke-dasharray="(summary.failed / summary.total * 52).toFixed(0) + ' ' + (52 - (summary.failed / summary.total * 52)).toFixed(0)" stroke-dashoffset="52" stroke-width="50" d="M75 50a1 1 90 10-50 0a1 1 90 10 50 0" fill="none" stroke="#e53935"/></g></svg>
            <span>{{ ((summary.passed / summary.total) * 100).toFixed(1) }}% passed</span>
          </div>
        </div>
        <div class="header-item">
          <div class="header-subitem time-summary">
            <v-icon color="primary" size="18" class="mr-1">mdi-stopwatch</v-icon>
            <span><time :title="report?.dateString || ''" :datetime="report?.dateISO || ''">{{ report?.dateAgo || '1 day ago' }}</time><em class="conjunction"> in </em><span>{{ summary.duration }}</span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="cucumber-report-content">
      <div v-if="error" class="cucumber-alert error">{{ error }}</div>
      <div v-else-if="!report || !Array.isArray(report.features) || report.features.length === 0" class="cucumber-alert info">
        No report data available or invalid report format. Please upload a valid Cucumber JSON file.
      </div>
      <template v-else>
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
          <v-expansion-panel v-for="(feature, idx) in report.features" :key="feature.id || feature.name" :value="idx === selectedFeatureIndex">
            <v-expansion-panel-title @click="$emit('select-feature', idx)" class="cucumber-feature-row" :class="[featureStatus(feature), { selected: idx === selectedFeatureIndex }]">
              <v-icon v-if="featureStatus(feature) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
              <v-icon v-else-if="featureStatus(feature) === 'failed'" color="error" size="18">mdi-close-circle</v-icon>
              <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
              <span class="feature-file">{{ feature.uri || feature.name }}</span>
              <!-- <span class="feature-title" style="font-weight:700;">{{ feature.name }}</span> -->
              <span v-if="feature.tags && feature.tags.length" class="feature-tags">
                <span v-for="tag in feature.tags" :key="tag" class="feature-tag">{{ tag }}</span>
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="feature.description" class="feature-description">{{ feature.description }}</div>
              <div v-for="scenario in feature.scenarios" :key="scenario.id || scenario.name" class="cucumber-scenario-block">
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title class="scenario-header-row">
                      <v-icon v-if="scenarioStatus(scenario) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
                      <v-icon v-else-if="scenarioStatus(scenario) === 'failed'" color="error" size="18">mdi-close-circle</v-icon>
                      <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
                        <span v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
                        <span v-for="tag in scenario.tags" :key="tag" class="scenario-tag">{{ tag }}</span>
                      </span>
                      <span class="scenario-title">Scenario: {{ scenario.name }}</span>
                      <span class="scenario-duration">{{ formatDuration(scenario.duration) }}</span>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <ul class="cucumber-steps-list">
                        <li v-for="(step, idx) in scenario.steps" :key="step.keyword + step.name + idx" class="cucumber-step-row">
                          <v-icon v-if="stepStatus(step) === 'passed'" color="success" size="16">mdi-check-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'failed'" color="error" size="16">mdi-close-circle</v-icon>
                          <v-icon v-else-if="stepStatus(step) === 'skipped'" color="warning" size="16">mdi-alert-circle</v-icon>
                          <v-icon v-else color="grey" size="16">mdi-help-circle</v-icon>
                          <span class="step-keyword">{{ step.keyword }}</span>
                          <span class="step-text">{{ step.name }}</span>
                          <span v-if="step.duration" class="step-duration">({{ formatDuration(step.duration) }})</span>
                          <div v-if="step.errorMessage" class="step-error-block">
                            <pre class="step-error-message">
                              {{ shouldTruncate(step.errorMessage) && !step._showFullError ? truncateError(step.errorMessage) : step.errorMessage }}
                            </pre>
                            <a v-if="shouldTruncate(step.errorMessage)" @click.prevent="toggleErrorExpand(step)" class="show-more-link">
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
      if (!feature || !feature.scenarios) return '';
      if (feature.scenarios.some(s => this.scenarioStatus(s) === 'failed')) return 'failed';
      if (feature.scenarios.every(s => this.scenarioStatus(s) === 'passed')) return 'passed';
      return '';
    },
  },
  data() {
    return {
      error: ''
    }
  },
  computed: {
    normalizedFeatures() {
      if (!this.report || !Array.isArray(this.report.features)) return [];
      return this.report.features.map(f => {
        let scenarios = getScenarioList(f).map(e => ({
          ...e,
          steps: Array.isArray(e.steps) ? e.steps : [],
          tags: Array.isArray(e.tags) ? e.tags.map(t => t.name || t) : [],
          status: e.status || (e.steps && e.steps.some(s => (s.result && s.result.status === 'failed') || s.status === 'failed') ? 'failed' : 'passed') || 'unknown',
          duration: e.duration || (e.steps && e.steps.reduce((acc, s) => acc + (s.result && typeof s.result.duration === 'number' ? s.result.duration : 0), 0))
        }));
        return { ...f, scenarios };
      });
    },
    summary() {
      // Calculate passed, failed, skipped, total from all scenarios
      const allScenarios = this.normalizedFeatures.flatMap(f => f.scenarios || []);
      let passed = 0, failed = 0, skipped = 0, total = 0, duration = 0;
      allScenarios.forEach(s => {
        const status = this.scenarioStatus(s);
        if (status === 'passed') passed++;
        else if (status === 'failed') failed++;
        else skipped++;
        total++;
        // Prefer step durations if available, else scenario duration
        if (Array.isArray(s.steps) && s.steps.length > 0 && s.steps.some(st => typeof st.duration === 'number')) {
          duration += s.steps.reduce((acc, st) => acc + (typeof st.duration === 'number' ? (st.duration > 1000000 ? st.duration / 1e9 : st.duration) : 0), 0);
        } else if (typeof s.duration === 'number') {
          duration += (s.duration > 1000000 ? s.duration / 1e9 : s.duration);
        }
      });
      return {
        passed,
        failed,
        skipped,
        total,
        rawDuration: duration,
        duration: this.formatDuration(duration, true)
      };
    },
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
.stat.passed { color: #388e3c; }
.stat.failed { color: #e53935; }
.stat.skipped { color: #b26a00; }
.stat.duration { color: #1976d2; }
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
.cucumber-feature-row.passed { background: #e8f5e9; }
.cucumber-feature-row.failed { background: #ffebee; }
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
}
.cucumber-scenario-block {
  border-top: 1px solid #e5e7eb;
  padding: 1.1em 0 0.7em 0;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 1.2em;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
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
.scenario-title {
  font-weight: 700;
  color: #222;
  flex: 1 1 100%;
  min-width: 220px;
  word-break: break-word;
}
.scenario-tags {
  display: flex;
  gap: 0.3em;
  flex-wrap: wrap;
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
}
 </style>
