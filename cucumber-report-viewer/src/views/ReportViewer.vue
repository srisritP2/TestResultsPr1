<template>
  <v-container>
    <v-row>
      <v-col>
        <h1>Cucumber Report Viewer</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-select
          label="Select a Report"
          :items="reportIndex"
          item-title="name"
          item-value="id"
          v-model="selectedReportId"
          @update:modelValue="loadReport"
          variant="outlined"
          dense
        ></v-select>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-if="!loading && currentReport.length > 0">
      <v-col cols="12">
        <ReportSummary :report-data="currentReport"></ReportSummary>
      </v-col>
      <v-col cols="12">
        <FeatureList :report-data="currentReport"></FeatureList>
      </v-col>
    </v-row>

    <v-row v-if="error">
        <v-col>
            <v-alert type="error">{{ error }}</v-alert>
        </v-col>
    </v-row>

  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ReportSummary from '@/components/ReportSummary.vue';
import FeatureList from '@/components/FeatureList.vue';

const reportIndex = ref([]);
const selectedReportId = ref(null);
const currentReport = ref([]);
const loading = ref(false);
const error = ref(null);

onMounted(async () => {
  try {
    reportIndex.value = await (await fetch('/TestResultsJsons/index.json')).json();
    if (reportIndex.value.length > 0) {
      selectedReportId.value = reportIndex.value[0].id;
      await loadReport(selectedReportId.value);
    }
  } catch (e) {
    error.value = 'Failed to load report index.';
    console.error(e);
  }
});

const loadReport = async (reportId) => {
  if (!reportId) return;
  loading.value = true;
  error.value = null;
  currentReport.value = [];
  try {
    currentReport.value = await (await fetch(`/TestResultsJsons/${reportId}.json`)).json();
  } catch (e) {
    error.value = `Failed to load report: ${reportId}.json`;
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>