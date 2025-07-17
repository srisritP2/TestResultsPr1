<template>
  <div class="test-details">
    <div v-if="scenario">
      <div class="scenario-header">
        <h3>{{ scenario.name }}</h3>
        <span class="scenario-status" :class="scenario.status">{{ scenario.status }}</span>
        <span class="scenario-duration">{{ scenario.duration || 0 }} ms</span>
      </div>
      <div v-if="scenario.tags && scenario.tags.length" class="scenario-tags">
        <span v-for="tag in scenario.tags" :key="tag" class="scenario-tag">{{ cleanTagText(tag) }}</span>
      </div>
      <ul class="steps-list">
        <li v-for="step in scenario.steps" :key="step.keyword + step.name" :class="step.status">
          <span class="step-icon">
            <svg v-if="step.status==='passed'" width="14" height="14" fill="#43a047" viewBox="0 0 24 24"><path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.414-1.414 3.871 3.871 9.871-9.871z"/></svg>
            <svg v-else-if="step.status==='failed'" width="14" height="14" fill="#e53935" viewBox="0 0 24 24"><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95 1.414-1.414z"/></svg>
            <svg v-else width="14" height="14" fill="#ffb300" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
          </span>
          <span class="step-keyword">{{ step.keyword }}</span>
          <span class="step-name">{{ step.name }}</span>
          <span class="step-status" :class="step.status">{{ step.status }}</span>
          <span v-if="step.duration" class="step-duration">({{ step.duration }} ms)</span>
          <div v-if="step.errorMessage" class="step-error">
            <strong>Error:</strong> {{ step.errorMessage }}
          </div>
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No scenario details available.</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    scenario: {
      type: Object,
      required: true
    }
  },
  methods: {
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
    }
  }
}
</script>

<style scoped>
.test-details {
  padding: 1rem 0 0 0;
  text-align: left;
}
.scenario-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.scenario-status {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 2px 10px;
  border-radius: 12px;
  background: #e3f2fd;
}
.scenario-status.passed {
  color: #388e3c;
  background: #e8f5e9;
}
.scenario-status.failed {
  color: #e53935;
  background: #ffebee;
}
.scenario-status.skipped {
  color: #ffb300;
  background: #fffde7;
}
.scenario-duration {
  color: #888;
  font-size: 0.95rem;
}
.scenario-tags {
  display: flex;
  gap: 0.3em;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  text-align: left;
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
.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.steps-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.steps-list li:last-child {
  border-bottom: none;
}
.step-icon {
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-keyword {
  color: #607d8b;
  font-weight: 500;
}
.step-name {
  flex: 1;
  text-align: left;
}
.step-status.passed {
  color: #388e3c;
}
.step-status.failed {
  color: #e53935;
}
.step-status.skipped {
  color: #ffb300;
}
.step-duration {
  color: #888;
  font-size: 0.9em;
}
.step-error {
  color: #e53935;
  font-size: 0.95em;
  margin-left: 2.5rem;
  text-align: left;
}
</style>