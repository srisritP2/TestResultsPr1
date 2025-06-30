<!-- <template>
  <div class="summary-card">
    <div class="summary-title">Test Summary</div>
    <div class="summary-row">
      <span class="summary-item passed">
        <svg class="summary-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#e8f5e9" />
          <path
            d="M4 8l3 3 5-5"
            stroke="#388e3c"
            stroke-width="2"
            fill="none"
          />
        </svg>
        Passed: {{ passed }}
      </span>
      <span class="summary-item failed">
        <svg class="summary-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#ffebee" />
          <path
            d="M5 5l6 6M11 5l-6 6"
            stroke="#e53935"
            stroke-width="2"
            fill="none"
          />
        </svg>
        Failed: {{ failed }}
      </span>
      <span class="summary-item skipped">
        <svg class="summary-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#fffde7" />
          <path d="M4 8h8" stroke="#ffb300" stroke-width="2" fill="none" />
        </svg>
        Skipped: {{ skipped }}
      </span>
      <span class="summary-item total">
        <svg class="summary-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#e0e7ef" />
          <text
            x="8"
            y="12"
            text-anchor="middle"
            font-size="8"
            fill="#222"
          >
            Σ
          </text>
        </svg>
        Total: {{ totalScenarios }}
      </span>
      <span class="summary-item duration">
        <svg class="summary-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8" fill="#e3f2fd" />
          <path
            d="M8 4v4l3 2"
            stroke="#1976d2"
            stroke-width="2"
            fill="none"
          />
        </svg>
        Duration: {{ formattedDuration }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    reportData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    scenarios() {
      if (!this.reportData || !this.reportData.features) return [];
      // Support scenarios, elements, or children for maximum compatibility
      return this.reportData.features.flatMap(f =>
        f.scenarios || f.elements || f.children || []
      );
    },
    totalScenarios() {
      return this.scenarios.length;
    },
    passed() {
      return this.scenarios.filter((scenario) => scenario.status === "passed")
        .length;
    },
    failed() {
      return this.scenarios.filter((scenario) => scenario.status === "failed")
        .length;
    },
    skipped() {
      return this.scenarios.filter((scenario) => scenario.status === "skipped")
        .length;
    },
    totalDuration() {
      return this.scenarios.reduce(
        (total, scenario) => total + (scenario.duration || 0),
        0
      );
    },
    formattedDuration() {
      const ms = this.totalDuration;
      if (ms > 60000) return (ms / 1000).toFixed(1) + 's';
      if (ms > 1000) return (ms / 1000).toFixed(2) + 's';
      return ms + 'ms';
    },
  },
};
</script>

<style scoped>
.summary-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
</style> -->