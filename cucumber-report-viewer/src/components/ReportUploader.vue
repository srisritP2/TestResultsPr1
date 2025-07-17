<template>
  <v-card class="mx-auto my-8 pa-6" max-width="420">
    <v-card-title class="text-h6 font-weight-bold">Upload Cucumber JSON Report</v-card-title>
    <v-card-text>
      <v-file-input
        v-model="selectedFile"
        accept=".json"
        label="Select or drag a Cucumber JSON file"
        prepend-icon="mdi-file-upload"
        show-size
        @change="onFileChange"
        outlined
        dense
        :rules="[fileTypeRule]"
      />
      <v-alert v-if="errorMessage" type="error" dense class="mt-2">{{ errorMessage }}</v-alert>
      <div v-if="selectedFile && !errorMessage" class="mt-2">
        <v-chip color="primary" class="ma-1">{{ selectedFile.name }}</v-chip>
        <span class="grey--text text--darken-1">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="success" :disabled="!selectedFile || !!errorMessage" @click="uploadReport">Upload</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
// Simple Cucumber JSON validation utility
function isCucumberJson(json) {
  return Array.isArray(json) && json.length > 0 && json[0].hasOwnProperty('elements');
}

export default {
  data() {
    return {
      selectedFile: null,
      errorMessage: ''
    };
  },
  methods: {
    fileTypeRule(file) {
      if (!file) return true;
      if (file.name && file.name.endsWith('.json')) return true;
      return 'Only .json files are allowed';
    },
    onFileChange(file) {
      this.errorMessage = '';
      if (!file) return;
      if (file.name && !file.name.endsWith('.json')) {
        this.errorMessage = 'Please select a valid .json file.';
        this.selectedFile = null;
        return;
      }
      // Optionally, check file size here
    },
    uploadReport() {
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            let reportData = jsonData;
            if (Array.isArray(jsonData)) {
              reportData = { features: jsonData };
            }
            if (!reportData.features || !Array.isArray(reportData.features) || reportData.features.length === 0) {
              this.errorMessage = 'File does not appear to be a valid Cucumber JSON report (missing features array).';
              return;
            }
            const hasElements = reportData.features.some(f => Array.isArray(f.elements) || Array.isArray(f.scenarios));
            if (!hasElements) {
              this.errorMessage = 'File does not appear to be a valid Cucumber JSON report (features missing scenarios/elements).';
              return;
            }
            // Save file to uploads folder and update index.json (for demo, just emit)
            // In real app, would POST to backend API
            // Generate a unique id for the report
            const id = 'report-' + Date.now();
            const name = this.selectedFile.name.replace(/\.json$/i, '');
            const date = new Date().toISOString();
            // Save to localStorage for demo (simulate upload)
            // Do NOT save the full report JSON to localStorage (to avoid quota issues)
            // Instead, store it in Vuex for this session only
            this.$store.commit('setReportData', reportData);
            // Update index.json in localStorage for demo
            let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
            index.unshift({ id, name, date });
            localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
            // After upload, emit the id as well for redirect
            this.$emit('report-uploaded', { ...reportData, _uploadedId: id });
            // Show a warning if the report is only available for this session
            this.$emit('session-warning', 'Uploaded report is only available for this session. It will be lost if you refresh or close the page.');
            this.selectedFile = null;
          } catch (err) {
            this.errorMessage = 'Invalid JSON file: ' + (err && err.message ? err.message : 'Unknown error.');
          }
        };
        reader.readAsText(this.selectedFile);
      }
    }
  }
};
</script>

<style scoped>
</style>