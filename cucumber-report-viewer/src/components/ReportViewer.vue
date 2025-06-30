<template>
  <div class="report-viewer">
    <div v-if="error" class="error-message">
      <strong>Error:</strong> {{ error }}
    </div>
    <div v-else-if="!report || !Array.isArray(report.features) || report.features.length === 0">
      <p>No report data available or invalid report format. Please upload a valid Cucumber JSON file.</p>
    </div>
    <div v-else>
      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-title">Test Summary</div>
        <div class="summary-row">
          <span class="summary-item passed">
            <svg class="summary-icon" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill="#e8f5e9" />
              <path d="M4 8l3 3 5-5" stroke="#388e3c" stroke-width="2" fill="none" />
            </svg>
            Passed: {{ summary.passed }}
          </span>
          <span class="summary-item failed">
            <svg class="summary-icon" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill="#ffebee" />
              <path d="M5 5l6 6M11 5l-6 6" stroke="#e53935" stroke-width="2" fill="none" />
            </svg>
            Failed: {{ summary.failed }}
          </span>
          <span class="summary-item skipped">
            <svg class="summary-icon" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill="#fffde7" />
              <path d="M4 8h8" stroke="#ffb300" stroke-width="2" fill="none" />
            </svg>
            Skipped: {{ summary.skipped }}
          </span>
          <span class="summary-item total">
            <svg class="summary-icon" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill="#e0e7ef" />
              <text x="8" y="12" text-anchor="middle" font-size="8" fill="#222">Σ</text>
            </svg>
            Total: {{ summary.total }}
          </span>
          <span class="summary-item duration">
            <svg class="summary-icon" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill="#e3f2fd" />
              <path d="M8 4v4l3 2" stroke="#1976d2" stroke-width="2" fill="none" />
            </svg>
            Duration: {{ summary.duration }}
          </span>
        </div>
      </div>
      <!-- Existing report header and features list -->
      <div class="report-header">
        <div class="header-title">
          <svg viewBox="0.06 0.56 32.5 37.13" aria-hidden="true" class="cucumber-logo"><g fill="none" fill-rule="evenodd"><path d="M-4-1h40v40H-4z"></path><path fill="#00a818" d="M16.438.563C7.386.563.063 7.886.063 16.938c0 7.968 5.712 14.589 13.25 16.062v4.688c9.8-1.478 18.477-9.257 19.124-19.47.39-6.146-2.674-12.421-7.843-15.468a13.62 13.62 0 0 0-1.875-.938l-.313-.125c-.287-.106-.577-.225-.875-.312a16.246 16.246 0 0 0-5.093-.813v.001z"></path><path fill="#fff" d="M19.813 6.625a1.787 1.787 0 0 0-1.563.625c-.3.4-.488.787-.688 1.188-.6 1.4-.4 2.9.5 4 1.4-.3 2.588-1.194 3.188-2.594.2-.4.313-.913.313-1.313.062-1.062-.817-1.81-1.75-1.906zm-7.282.094c-.913.087-1.781.812-1.781 1.812 0 .4.113.913.313 1.313.6 1.4 1.88 2.293 3.28 2.594.8-1.1 1.007-2.6.407-4-.2-.4-.387-.794-.688-1.094a1.757 1.757 0 0 0-1.53-.625h-.001zM7.625 11.53c-1.577.081-2.281 2.063-.969 3.094.4.3.788.519 1.188.719 1.4.6 3.019.394 4.218-.406-.3-1.3-1.318-2.494-2.718-3.094-.5-.2-.906-.313-1.406-.313-.113-.012-.208-.005-.313 0zm15.406 6.063a4.574 4.574 0 0 0-2.593.75c.3 1.3 1.318 2.493 2.718 3.093.5.2.907.313 1.407.313 1.8.1 2.68-2.125 1.28-3.125-.4-.3-.787-.488-1.187-.688a4.32 4.32 0 0 0-1.625-.343zm-13.656.093c-.55.011-1.1.12-1.625.344-.5.2-.888.419-1.188.719-1.3 1.1-.425 3.194 1.375 3.094.5 0 1.007-.113 1.407-.313 1.4-.6 2.394-1.793 2.594-3.093a4.475 4.475 0 0 0-2.563-.75v-.001zm5.063 3.063c-1.4.3-2.588 1.194-3.188 2.594-.2.4-.313.881-.313 1.281-.1 1.7 2.22 2.613 3.22 1.313.3-.4.487-.788.687-1.188.6-1.3.394-2.8-.406-4zm3.718.094c-.8 1.1-1.006 2.6-.406 4 .2.4.387.793.688 1.093 1.1 1.2 3.412.313 3.312-1.187 0-.4-.113-.913-.313-1.313-.6-1.4-1.88-2.293-3.28-2.593h-.001z"></path></g></svg>
          <span class="title">Cucumber Report Viewer</span>
        </div>
        <div class="env-summary">
          <span><strong>{{ report.framework || 'cucumber-jvm' }}</strong><span v-if="report.frameworkVersion">@{{ report.frameworkVersion }}</span></span>
          <span>with</span>
          <span><strong>{{ report.runtime || 'Java HotSpot(TM) 64-Bit Server VM' }}</strong><span v-if="report.runtimeVersion">@{{ report.runtimeVersion }}</span></span>
          <span>on</span>
          <span><strong>{{ report.os || 'Windows 11' }}</strong></span>
        </div>
      </div>
      <div class="features-list">
        <div v-for="(feature, fIdx) in normalizedFeatures" :key="feature.id || feature.name || fIdx" class="feature">
          <details>
            <summary @click.prevent="toggleDetails($event)">
              <span class="feature-title scenario-header">{{ feature.name || feature.file || 'Unnamed Feature' }}</span>
              <span class="feature-status" :class="featureStatus(feature)">{{ featureStatus(feature) }}</span>
              <svg class="chevron" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="#64748b" stroke-width="2" fill="none"/></svg>
            </summary>
            <div class="scenarios-list">
              <div v-for="(scenario, sIdx) in feature.scenarios" :key="scenario.id || scenario.name || sIdx" class="scenario">
                <details>
                  <summary @click.prevent="toggleDetails($event)">
                    <span class="scenario-title scenario-header">{{ scenario.keyword || 'Scenario:' }} {{ scenario.name || 'Unnamed Scenario' }}</span>
                    <span v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
                      <span v-for="tag in scenario.tags" :key="tag" class="tag">{{ tag }}</span>
                    </span>
                    <span class="scenario-status" :class="scenarioStatus(scenario)">{{ scenarioStatus(scenario) }}</span>
                    <span v-if="scenario.duration" class="scenario-duration">⏱ {{ formatDuration(scenario.duration) }}</span>
                    <svg class="chevron" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="#64748b" stroke-width="2" fill="none"/></svg>
                  </summary>
                  <ol class="steps-list">
                    <li v-for="(step, stIdx) in scenario.steps" :key="step.id || stIdx" class="step">
                      <span class="step-status" :class="stepStatus(step)"></span>
                      <span class="step-keyword" :class="stepKeywordClass(step.keyword)">{{ step.keyword }}</span>
                      <span v-if="(step.text || step.name) && (step.text || step.name).includes('&quot;')" class="step-text step-quoted"><span class="quoted-text">{{ step.text || step.name }}</span></span>
                      <span v-else class="step-text">{{ step.text || step.name }}</span>
                      <span v-if="stepStatus(step) === 'failed' && step.result && step.result.error_message" class="step-error">{{ step.result.error_message }}</span>
                    </li>
                  </ol>
                </details>
              </div>
            </div>
          </details>
        </div>
      </div>
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
    }
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
        duration += s.duration || 0;
      });
      return {
        passed,
        failed,
        skipped,
        total,
        duration: this.formatDuration(duration)
      };
    }
  },
  watch: {
    report: {
      immediate: true,
      handler(val) {
        this.error = '';
        if (!val) return;
        if (!val.features || !Array.isArray(val.features)) {
          this.error = 'Missing or invalid "features" array in report.';
        }
      }
    }
  },
  methods: {
    featureStatus(feature) {
      if (!feature || !feature.scenarios) return 'unknown';
      if (feature.scenarios.some(s => this.scenarioStatus(s) === 'failed')) return 'failed';
      if (feature.scenarios.every(s => this.scenarioStatus(s) === 'passed')) return 'passed';
      return 'unknown';
    },
    scenarioStatus(scenario) {
      if (!scenario) return 'unknown';
      if (scenario.status) return scenario.status;
      if (scenario.steps && scenario.steps.some(st => (st.result && st.result.status === 'failed') || st.status === 'failed')) return 'failed';
      if (scenario.steps && scenario.steps.every(st => (st.result && st.result.status === 'passed') || st.status === 'passed')) return 'passed';
      return 'unknown';
    },
    stepStatus(step) {
      const status = step && (step.status || (step.result && step.result.status));
      if (status === 'passed') return 'passed';
      if (status === 'failed') return 'failed';
      if (status === 'skipped') return 'skipped';
      return 'unknown';
    },
    formatDuration(duration) {
      if (!duration) return '';
      // duration in nanoseconds or milliseconds
      let ms = duration;
      if (duration > 1000000000) ms = Math.round(duration / 1000000); // nanoseconds to ms
      if (ms > 60000) return (ms / 1000).toFixed(1) + 's';
      if (ms > 1000) return (ms / 1000).toFixed(2) + 's';
      return ms + 'ms';
    },
    toggleDetails(event) {
      const detailsElement = event.target.closest('details');
      if (detailsElement) {
        detailsElement.open = !detailsElement.open;
      }
    },
    stepKeywordClass(keyword) {
      if (!keyword) return '';
      const lcKeyword = keyword.toLowerCase();
      if (lcKeyword.startsWith('given')) return 'step-keyword given';
      if (lcKeyword.startsWith('when')) return 'step-keyword when';
      if (lcKeyword.startsWith('then')) return 'step-keyword then';
      return 'step-keyword';
    }
  }
}
</script>

<style scoped>
.report-viewer {
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  background: #f8fafc;
  padding: 0 0 2rem 0;
}
.report-header {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin: 2rem auto 2.5rem auto;
  max-width: 900px;
  padding: 1.5rem 2rem 1.2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
.cucumber-logo {
  width: 38px;
  height: 38px;
}
.env-summary {
  display: flex;
  gap: 0.7rem;
  font-size: 1.1rem;
  color: #334155;
  flex-wrap: wrap;
}
.summary-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin: 0 auto 2rem auto;
  max-width: 900px;
  padding: 1.5rem 2rem;
}
.summary-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}
.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.summary-item {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background: #f1f5f9;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.summary-icon {
  width: 16px;
  height: 16px;
}
.summary-item.passed {
  background: #e8f5e9;
  color: #388e3c;
}
.summary-item.failed {
  background: #ffebee;
  color: #e53935;
}
.summary-item.skipped {
  background: #fffde7;
  color: #ffb300;
}
.summary-item.total {
  background: #e0e7ef;
  color: #222;
}
.features-list {
  max-width: 900px;
  margin: 2rem auto 0 auto;
}
.feature {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  overflow: hidden;
}
.feature > details > summary {
  font-size: 1.15rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 1.2rem 1.5rem;
  background: #f6fff9;
  border-bottom: 1px solid #e0e7ef;
  outline: none;
  transition: background 0.2s;
}
.feature > details[open] > summary {
  background: #e6f9ee;
}
.feature > details[open] > summary .chevron,
.scenario > details[open] > summary .chevron {
  transform: rotate(90deg);
}
.chevron {
  width: 12px;
  height: 12px;
  transition: transform 0.2s;
}
.feature-title {
  flex: 1;
}
.feature-status {
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
  border-radius: 12px;
  padding: 2px 12px;
  background: #e3f2fd;
  color: #64748b;
}
.feature-status.passed {
  color: #388e3c;
  background: #e8f5e9;
}
.feature-status.failed {
  color: #e53935;
  background: #ffebee;
}
.scenarios-list {
  padding: 0.5rem 1.5rem 1.5rem 2.5rem;
}
.scenario {
  margin-bottom: 1.2rem;
}
.scenario > details > summary {
  font-size: 1.05rem;
  font-weight: 600;
  color: #222;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.7rem 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  outline: none;
  transition: background 0.2s;
}
.scenario > details[open] > summary {
  background: #e6f9ee;
}
.scenario-title {
  flex: 1;
}
.scenario-tags {
  display: inline-flex;
  gap: 0.3rem;
  margin-left: 0.7rem;
}
.tag {
  background: #e6f9ee;
  color: #00a818;
  border-radius: 0.3rem;
  padding: 0.1rem 0.5rem;
  font-size: 0.95em;
  font-weight: 500;
}
.scenario-status {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: capitalize;
  border-radius: 12px;
  padding: 2px 10px;
  background: #e3f2fd;
  color: #64748b;
}
.scenario-status.passed {
  color: #388e3c;
  background: #e8f5e9;
}
.scenario-status.failed {
  color: #e53935;
  background: #ffebee;
}
.scenario-duration {
  margin-left: 1rem;
  color: #64748b;
  font-size: 0.95em;
}
.steps-list {
  list-style: none;
  padding: 0.5rem 0 0 0;
  margin: 0;
}
.step {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.3rem;
  font-size: 1rem;
}
.step-status {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.3rem;
  background: #e0e7ef;
}
.step-status.passed {
  background: #00a818;
}
.step-status.failed {
  background: #e53935;
}
.step-status.skipped {
  background: #ffb300;
}
.step-keyword {
  color: #00a818;
  font-weight: 500;
  margin-right: 0.2rem;
}
.step-text {
  color: #222;
  text-align: left;
  font-size: 1em;
}
.step-error {
  color: #e53935;
  margin-left: 1rem;
  font-size: 0.95em;
  font-style: italic;
}
.error-message {
  background: #ffebee;
  color: #b71c1c;
  border: 1px solid #e53935;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  margin: 2rem auto;
  max-width: 700px;
  font-size: 1.1rem;
}
.scenario-header {
  font-size: 1.25em;
  text-align: left;
  font-weight: 500;
  color: #1e293b;
}
.step-quoted {
  background: #e3f2fd;
  padding: 0.2rem 0.4rem;
  border-radius: 0.3rem;
  color: #0d47a1;
}
.chevron {
  width: 12px;
  height: 12px;
  transition: transform 0.2s;
}
.chevron.open {
  transform: rotate(90deg);
}
</style>