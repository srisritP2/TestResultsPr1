<template>
  <div class="report-view">
    <header class="header">
      <div class="header-content">
        <img src="https://raw.githubusercontent.com/cucumber/cucumber/master/images/cucumber-logo.svg" alt="Cucumber Reports" class="logo" />
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