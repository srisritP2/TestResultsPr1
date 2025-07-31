<template>
  <div v-if="isVisible">
    <div v-if="feature.description" class="feature-description">{{ feature.description }}</div>
    <div v-for="scenario in scenarios" :key="scenario.id || scenario.name" class="cucumber-scenario-block">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-title class="scenario-header-row">
            <div class="scenario-header-content">
              <div class="scenario-title-row">
                <span class="scenario-title">{{ scenario.keyword || 'Scenario' }}: {{ scenario.name || scenario.id || (scenario.type ? scenario.type : 'Unnamed Scenario') }}</span>
                <v-icon v-if="scenarioStatus(scenario) === 'passed'" color="success" size="18">mdi-check-circle</v-icon>
                <v-icon v-else-if="scenarioStatus(scenario) === 'failed'" color="error" size="18">mdi-close-circle</v-icon>
                <v-icon v-else-if="scenarioStatus(scenario) === 'skipped'" color="warning" size="18">mdi-alert-circle</v-icon>
                <v-icon v-else color="grey" size="18">mdi-help-circle</v-icon>
                <span class="scenario-duration">{{ formatDuration(scenario.duration) }}</span>
              </div>
              <div v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
                <span v-for="tag in scenario.tags" :key="tag" class="scenario-tag">{{ cleanTagText(tag) }}</span>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <LazySteps v-if="expanded" :steps="scenario.steps" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
  <div v-else class="lazy-placeholder">
    <v-skeleton-loader type="list-item-three-line" />
  </div>
</template>

<script>
export default {
  name: 'LazyScenarios',
  props: {
    feature: Object
  },
  data() {
    return {
      isVisible: false,
      expanded: false
    };
  },
  computed: {
    scenarios() {
      return this.feature.elements?.filter(el => el.type !== 'background') || [];
    }
  },
  methods: {
    scenarioStatus(scenario) {
      if (scenario.status) return scenario.status;
      if (scenario.steps && scenario.steps.some(s => (s.result && s.result.status === 'failed') || s.status === 'failed')) return 'failed';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'skipped') || s.status === 'skipped')) return 'skipped';
      if (scenario.steps && scenario.steps.every(s => (s.result && s.result.status === 'passed') || s.status === 'passed')) return 'passed';
      return 'unknown';
    },
    formatDuration(duration) {
      if (typeof duration !== 'number' || isNaN(duration)) return '-';
      if (duration > 1000000) duration = duration / 1e9;
      if (duration >= 60) {
        const mins = Math.floor(duration / 60);
        const secs = Math.round(duration % 60);
        return `${mins}m ${secs}s`;
      }
      if (duration < 1) return (duration * 1000).toFixed(0) + 'ms';
      return duration.toFixed(2) + 's';
    },
    cleanTagText(tag) {
      return typeof tag === 'string' ? tag.replace(/[{}]/g, '') : (tag.name || '').replace(/[{}]/g, '');
    }
  },
  mounted() {
    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible = true;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(this.$el);
  }
};
</script>

<style scoped>
.lazy-placeholder {
  padding: 1rem;
}
</style>