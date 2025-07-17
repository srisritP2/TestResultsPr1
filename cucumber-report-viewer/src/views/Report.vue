<template>
  <div class="report-view">
    <header class="main-header">
      <div class="header-content">
        <span class="logo" style="display:flex;align-items:center;justify-content:center;background:#00a818;border-radius:50%;width:40px;height:40px;margin:0 auto;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.97 3.87 9.06 8.78 9.86.34.05.47-.15.47-.34 0-.17-.01-.73-.01-1.41-3.57.77-4.32-1.72-4.32-1.72-.31-.8-.76-1.01-.76-1.01-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.6.74 1.99.57.06-.44.24-.74.43-.91-2.85-.32-5.85-1.43-5.85-6.36 0-1.4.5-2.54 1.32-3.44-.13-.33-.57-1.66.13-3.46 0 0 1.08-.35 3.54 1.31A12.3 12.3 0 0 1 12 6.84c1.09.01 2.19.15 3.22.44 2.46-1.66 3.54-1.31 3.54-1.31.7 1.8.26 3.13.13 3.46.82.9 1.32 2.04 1.32 3.44 0 4.94-3 6.04-5.86 6.36.25.22.47.65.47 1.31 0 .95-.01 1.72-.01 1.95 0 .19.13.39.48.33C18.13 21.06 22 16.97 22 12c0-5.52-4.48-10-10-10z" fill="#fff"/>
          </svg>
        </span>
        <h1 class="main-title">Cucumber Test Results</h1>
      </div>
    </header>
    <main class="main-content">
      <div v-if="expired" class="card empty-card" style="color:#b71c1c;background:#ffebee;border:1px solid #ffcdd2;">
        <p>This report link has expired (older than 24 hours).</p>
      </div>
      <div v-else-if="reportData" class="dashboard-grid">
        <div v-if="sessionOnly" class="cucumber-alert warning" style="margin-bottom:1em;">
          This uploaded report is only available for this session. It will be lost if you refresh or close the page.
        </div>
        <ReportViewer 
          :report="reportData" 
          :selectedFeatureIndex="selectedFeatureIndex"
          @select-feature="onSelectFeature"
        />
      </div>
      <div v-else class="card empty-card">
        <p>No report data available. Please upload a Cucumber JSON file.</p>
      </div>
    </main>
  </div>
</template>

<script>

import ReportViewer from '@/components/ReportViewer.vue';
import { useStore } from 'vuex';
import { computed, ref, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

export default {
  components: {
    ReportViewer,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const reportId = route && route.params && route.params.id ? route.params.id : null;
    const state = reactive({ staticReport: null });
    const reportData = computed(() => {
      // Try to load from localStorage if route param id matches a static report
      if (reportId && localStorage.getItem('uploaded-report-' + reportId)) {
        try {
          const data = JSON.parse(localStorage.getItem('uploaded-report-' + reportId));
          if (Array.isArray(data)) return { features: data };
          if (data && Array.isArray(data.features)) return data;
        } catch {}
      }
      // If the report was uploaded this session, use Vuex store
      if (store.state.reportData && store.state.reportData._uploadedId === reportId) {
        if (Array.isArray(store.state.reportData)) return { features: store.state.reportData };
        if (store.state.reportData && Array.isArray(store.state.reportData.features)) return store.state.reportData;
      }
      // If fetched static report, use it
      if (state.staticReport) {
        if (Array.isArray(state.staticReport)) return { features: state.staticReport };
        if (state.staticReport && Array.isArray(state.staticReport.features)) return state.staticReport;
      }
      return null;
    });
    // Track selected feature index, default to 0
    const selectedFeatureIndex = ref(0);
    const onSelectFeature = idx => {
      selectedFeatureIndex.value = idx;
    };

    // Fetch static report JSON if needed
    onMounted(() => {
      if (!reportId) return;
      if (store.state.reportData && store.state.reportData._uploadedId === reportId) return;
      if (localStorage.getItem('uploaded-report-' + reportId)) return;
      // Try to fetch from public/TestResultsJsons/<id>.json
      fetch(process.env.BASE_URL + 'TestResultsJsons/' + reportId + '.json', { cache: 'reload' })
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          // Always normalize to {features: array}
          if (Array.isArray(json)) state.staticReport = { features: json };
          else if (json && Array.isArray(json.features)) state.staticReport = json;
          else state.staticReport = null;
        })
        .catch(() => { state.staticReport = null; });
    });

    // Soft expiry logic: check for t= timestamp in URL hash
    let expired = false;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const queryString = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const t = parseInt(params.get('t'), 10);
      if (t && !isNaN(t)) {
        const now = Date.now();
        expired = now - t > 24 * 60 * 60 * 1000;
      }
    }

    // Show a warning if the report is only available for this session
    const sessionOnly = computed(() => {
      return store.state.reportData && store.state.reportData._uploadedId === reportId;
    });

    return { reportData, selectedFeatureIndex, onSelectFeature, expired, sessionOnly };
  },
};
</script>

<!-- (fixed duplicate style tag) -->
<style scoped>
body, .report-view {
  font-family: 'Arial', 'Helvetica', 'Segoe UI', sans-serif;
  background: #f8fafc;
}
.main-header {
  background: #f2f2f2;
  padding: 2rem 0 1.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
}
.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.logo {
  margin-bottom: 0.7rem;
}
.main-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #222;
  text-align: center;
  letter-spacing: 0.01em;
}
.main-content {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 60vh;
}
.dashboard-grid {
  display: flex;
  flex-direction: row;
  gap: 2.5rem;
  max-width: 1200px;
  width: 100%;
}
.left-col {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.right-col {
  flex: 1 1 0%;
  min-width: 0;
}
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 2rem;
  padding: 2rem 1.5rem;
}
.empty-card {
  text-align: center;
  color: #888;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin: 2rem auto;
  max-width: 500px;
  padding: 2rem 1.5rem;
}
</style>