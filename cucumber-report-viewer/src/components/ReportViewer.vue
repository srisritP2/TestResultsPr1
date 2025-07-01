<template>
  <v-container class="py-6" fluid>
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    <v-alert v-else-if="!report || !Array.isArray(report.features) || report.features.length === 0" type="info" class="mb-4">
      No report data available or invalid report format. Please upload a valid Cucumber JSON file.
    </v-alert>
    <template v-else>
      <!-- Summary Card -->
      <v-card class="mb-6" elevation="2">
        <v-card-title class="text-h6 font-weight-bold">Test Summary</v-card-title>
        <v-card-text>
          <v-row align="center" justify="space-between">
            <v-col cols="auto">
              <v-chip color="success" class="ma-1" label>
                <v-icon left>mdi-check-circle</v-icon>
                Passed: {{ summary.passed }}
              </v-chip>
            </v-col>
            <v-col cols="auto">
              <v-chip color="error" class="ma-1" label>
                <v-icon left>mdi-close-circle</v-icon>
                Failed: {{ summary.failed }}
              </v-chip>
            </v-col>
            <v-col cols="auto">
              <v-chip color="warning" class="ma-1" label>
                <v-icon left>mdi-alert-circle</v-icon>
                Skipped: {{ summary.skipped }}
              </v-chip>
            </v-col>
            <v-col cols="auto">
              <v-chip color="info" class="ma-1" label>
                <v-icon left>mdi-format-list-numbered</v-icon>
                Total: {{ summary.total }}
              </v-chip>
            </v-col>
            <v-col cols="auto">
              <v-chip color="primary" class="ma-1" label>
                <v-icon left>mdi-timer</v-icon>
                Duration: {{ summary.duration }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <!-- Report Header & Meta Info (Cucumber style) -->
      <v-card class="mb-4" elevation="1">
        <v-card-title class="d-flex align-center">
          <v-avatar size="32" class="mr-2" color="#00a818">
            <v-icon size="28" color="white">mdi-leaf</v-icon>
          </v-avatar>
          <span class="font-weight-bold text-h6">Cucumber Report Viewer</span>
        </v-card-title>
        <v-card-text class="d-flex align-center flex-wrap" style="gap: 1rem;">
          <v-chip color="#00a818" text-color="white" class="ma-0 pa-2" size="small">
            <v-icon left size="18">mdi-leaf</v-icon>
            <span>{{ report.meta?.framework || 'cucumber-jvm' }}</span>
            <span v-if="report.meta?.frameworkVersion">@{{ report.meta.frameworkVersion }}</span>
          </v-chip>
          <span class="mx-1">with</span>
          <v-chip color="#0074BD" text-color="white" class="ma-0 pa-2" size="small">
            <v-icon left size="18">mdi-language-java</v-icon>
            <span>{{ report.meta?.runtime || 'Java HotSpot(TM) 64-Bit Server VM' }}</span>
            <span v-if="report.meta?.runtimeVersion">@{{ report.meta.runtimeVersion }}</span>
          </v-chip>
          <span class="mx-1">on</span>
          <v-chip color="#00ADEF" text-color="white" class="ma-0 pa-2" size="small">
            <v-icon left size="18">mdi-microsoft-windows</v-icon>
            <span>{{ report.meta?.os || 'Windows 11' }}</span>
          </v-chip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" v-on="on" @click="copyMetaInfo" :aria-label="'Copy environment info'">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>
            </template>
            <span>Copy environment info</span>
          </v-tooltip>
        </v-card-text>
      </v-card>
      <!-- Features List (to be further modularized) -->
      <div class="features-list">
        <div v-for="feature in report.features" :key="feature.id || feature.name" class="feature">
          <v-expansion-panels multiple>
            <v-expansion-panel>
              <v-expansion-panel-title>
                <span class="feature-title">{{ feature.name }}</span>
                <span v-if="feature.tags && feature.tags.length" class="ml-2">
                  <v-chip v-for="tag in feature.tags" :key="tag" class="tag" size="x-small">{{ tag }}</v-chip>
                </span>
                <span class="feature-status" :class="featureStatus(feature)">{{ featureStatus(feature) }}</span>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="mb-2" v-if="feature.description">
                  <v-alert type="info" dense>{{ feature.description }}</v-alert>
                </div>
                <div class="scenarios-list">
                  <div v-for="scenario in feature.scenarios" :key="scenario.id || scenario.name" class="scenario">
                    <v-expansion-panels>
                      <v-expansion-panel>
                        <v-expansion-panel-title>
                          <span class="scenario-title">{{ scenario.name }}</span>
                          <span v-if="scenario.tags && scenario.tags.length" class="scenario-tags ml-2">
                            <v-chip v-for="tag in scenario.tags" :key="tag" class="tag" size="x-small">{{ tag }}</v-chip>
                          </span>
                          <span class="scenario-status" :class="scenarioStatus(scenario)">{{ scenarioStatus(scenario) }}</span>
                          <span class="scenario-duration">{{ formatDuration(scenario.duration) }}</span>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="scenario.description" class="mb-2">
                            <v-alert type="info" dense>{{ scenario.description }}</v-alert>
                          </div>
                          <ul class="steps-list">
                            <li v-for="(step, idx) in scenario.steps" :key="step.keyword + step.name + idx" class="step">
                              <span class="step-status" :class="stepStatus(step)"></span>
                              <span :class="stepKeywordClass(step.keyword)">{{ step.keyword }}</span>
                              <span class="step-text">{{ step.name }}</span>
                              <span v-if="step.errorMessage" class="step-error">
                                <v-alert type="error" dense text>
                                  <pre style="white-space:pre-wrap;word-break:break-word;">{{ step.errorMessage }}</pre>
                                </v-alert>
                              </span>
                              <span v-if="step.duration" class="ml-2 grey--text text--darken-1" style="font-size:0.9em;">({{ formatDuration(step.duration) }})</span>
                              <span v-if="step.embeddings && step.embeddings.length" class="ml-2">
                                <v-tooltip v-for="(embed, eidx) in step.embeddings" :key="eidx" top>
                                  <template #activator="{ on, attrs }">
                                    <v-icon v-bind="attrs" v-on="on" color="primary" small>mdi-paperclip</v-icon>
                                  </template>
                                  <span v-if="embed.mime_type && embed.mime_type.startsWith('image/')">
                                    <img :src="'data:' + embed.mime_type + ';base64,' + embed.data" style="max-width:200px;max-height:120px;" />
                                  </span>
                                  <span v-else>{{ embed.data }}</span>
                                </v-tooltip>
                              </span>
                            </li>
                          </ul>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </template>
</v-container>
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