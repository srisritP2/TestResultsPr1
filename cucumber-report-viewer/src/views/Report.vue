<template>
  <div class="report-view">
    <header class="header">
      <div class="header-content">
        <span class="logo" style="display:flex;align-items:center;justify-content:center;background:#00a818;border-radius:50%;width:32px;height:32px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.97 3.87 9.06 8.78 9.86.34.05.47-.15.47-.34 0-.17-.01-.73-.01-1.41-3.57.77-4.32-1.72-4.32-1.72-.31-.8-.76-1.01-.76-1.01-.62-.42.05-.41.05-.41.68.05 1.04.7 1.04.7.61 1.04 1.6.74 1.99.57.06-.44.24-.74.43-.91-2.85-.32-5.85-1.43-5.85-6.36 0-1.4.5-2.54 1.32-3.44-.13-.33-.57-1.66.13-3.46 0 0 1.08-.35 3.54 1.31A12.3 12.3 0 0 1 12 6.84c1.09.01 2.19.15 3.22.44 2.46-1.66 3.54-1.31 3.54-1.31.7 1.8.26 3.13.13 3.46.82.9 1.32 2.04 1.32 3.44 0 4.94-3 6.04-5.86 6.36.25.22.47.65.47 1.31 0 .95-.01 1.72-.01 1.95 0 .19.13.39.48.33C18.13 21.06 22 16.97 22 12c0-5.52-4.48-10-10-10z" fill="#fff"/>
          </svg>
        </span>
        <span class="brand">Cucumber <span class="brand-light">Reports</span></span>
      </div>
    </header>
    <main class="main-content">
      <div v-if="reportData">
        <ReportViewer :report="reportData" />
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
import { computed } from 'vue';

export default {
  components: {
    ReportViewer,
  },
  setup() {
    const store = useStore();
    const reportData = computed(() => store.state.reportData);
    return { reportData };
  },
};
</script>

<style scoped>
.header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0.5rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.header-content {
  display: flex;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}
.logo {
  height: 32px;
  margin-right: 12px;
}
.brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}
.brand-light {
  font-weight: 400;
  color: #90caf9;
}
.main-content {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 2rem;
  padding: 2rem 1.5rem;
}
.empty-card {
  text-align: center;
  color: #888;
}
</style>