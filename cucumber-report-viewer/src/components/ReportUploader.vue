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
      
      <!-- Storage Status Alert -->
      <v-alert 
        v-if="showStorageInfo && storageStatus" 
        :type="storageStatus.type" 
        dense 
        class="mt-2"
        dismissible
        @click:close="dismissStorageInfo"
      >
        <div class="d-flex align-center">
          <v-icon 
            :color="storageStatus.type === 'success' ? 'success' : storageStatus.type === 'warning' ? 'warning' : 'info'" 
            class="mr-2"
          >
            {{ storageStatus.strategy === 'persistent' ? 'mdi-check-circle' : 
               storageStatus.strategy === 'compressed' ? 'mdi-alert-circle' : 'mdi-information' }}
          </v-icon>
          <div>
            <div class="font-weight-medium">
              {{ storageStatus.strategy === 'persistent' ? 'Saved Successfully!' : 
                 storageStatus.strategy === 'compressed' ? 'Saved with Compression' : 'Session Only' }}
            </div>
            <div class="text-caption">{{ storageStatus.message }}</div>
          </div>
        </div>
      </v-alert>
      
      <div v-if="selectedFile && !errorMessage" class="mt-2">
        <v-chip color="primary" class="ma-1">{{ selectedFile.name }}</v-chip>
        <span class="grey--text text--darken-1">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="success" :disabled="!selectedFile || !!errorMessage" @click="uploadReport">Upload</v-btn>
    </v-card-actions>
    
    <!-- Storage Management Section -->
    <v-card-text v-if="hasStoredReports" class="pt-0">
      <v-divider class="mb-3"></v-divider>
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-subtitle-2 font-weight-medium">Previously Uploaded Reports</span>
        <v-btn size="small" variant="text" color="primary" @click="showStorageManager = !showStorageManager">
          {{ showStorageManager ? 'Hide' : 'Manage' }}
          <v-icon size="16" class="ml-1">{{ showStorageManager ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </div>
      
      <v-expand-transition>
        <div v-show="showStorageManager">
          <div class="storage-info mb-3">
            <v-chip size="small" color="info" variant="outlined">
              {{ storedReports.length }} report{{ storedReports.length !== 1 ? 's' : '' }} stored
            </v-chip>
            <v-chip size="small" color="secondary" variant="outlined" class="ml-2">
              {{ formatStorageSize(getTotalStorageSize()) }} used
            </v-chip>
          </div>
          
          <div class="stored-reports-list">
            <div 
              v-for="report in storedReports" 
              :key="report.id" 
              class="stored-report-item d-flex align-center justify-space-between pa-2 mb-1"
              :class="{ 'session-only': report.storageStrategy === 'session' }"
            >
              <div class="flex-grow-1 clickable-area" @click="viewStoredReport(report.id)">
                <div class="text-body-2 font-weight-medium">{{ report.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(report.date) }} • {{ formatStorageSize(report.size) }}
                  <v-chip 
                    size="x-small" 
                    :color="getStorageChipColor(report.storageStrategy)"
                    variant="flat"
                    class="ml-1"
                  >
                    {{ getStorageLabel(report.storageStrategy) }}
                  </v-chip>
                </div>
              </div>
              <div class="report-actions">
                <v-btn 
                  size="small" 
                  variant="text" 
                  color="primary" 
                  @click="viewStoredReport(report.id)"
                  icon="mdi-eye"
                  class="mr-1"
                ></v-btn>
                <v-btn 
                  size="small" 
                  variant="text" 
                  color="error" 
                  @click="deleteStoredReport(report.id)"
                  icon="mdi-delete"
                ></v-btn>
              </div>
            </div>
          </div>
          
          <v-btn 
            v-if="storedReports.length > 0"
            size="small" 
            variant="outlined" 
            color="error" 
            @click="clearAllStoredReports"
            class="mt-2"
          >
            <v-icon size="16" class="mr-1">mdi-delete-sweep</v-icon>
            Clear All
          </v-btn>
        </div>
      </v-expand-transition>
    </v-card-text>
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
      errorMessage: '',
      storageStatus: null,
      showStorageInfo: false,
      showStorageManager: false
    };
  },
  computed: {
    storedReports() {
      try {
        return JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      } catch (e) {
        return [];
      }
    },
    hasStoredReports() {
      return this.storedReports.length > 0;
    }
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
            // Enhanced storage strategy with multiple options
            this.$store.commit('setReportData', reportData);
            
            // Try to save to localStorage with compression and fallback strategies
            const reportSize = JSON.stringify(reportData).length;
            const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage
            
            let storageStrategy = 'session'; // default to session-only
            let storageMessage = 'This uploaded report is only available for this session. It will be lost if you refresh or close the page.';
            
            if (reportSize < maxSize) {
              try {
                // Try to save full report to localStorage
                localStorage.setItem('uploaded-report-' + id, JSON.stringify(reportData));
                storageStrategy = 'persistent';
                storageMessage = 'Report saved successfully! It will persist across browser sessions.';
              } catch (e) {
                // localStorage quota exceeded, try compressed storage
                try {
                  // Simple compression: remove whitespace and store essential data only
                  const compressedData = {
                    features: reportData.features.map(f => ({
                      name: f.name,
                      uri: f.uri,
                      id: f.id,
                      tags: f.tags,
                      elements: f.elements ? f.elements.map(e => ({
                        name: e.name,
                        id: e.id,
                        type: e.type,
                        keyword: e.keyword,
                        tags: e.tags,
                        steps: e.steps ? e.steps.map(s => ({
                          name: s.name,
                          keyword: s.keyword,
                          result: s.result,
                          duration: s.duration
                        })) : []
                      })) : []
                    }))
                  };
                  localStorage.setItem('uploaded-report-' + id, JSON.stringify(compressedData));
                  storageStrategy = 'compressed';
                  storageMessage = 'Report saved with compression. Some detailed information may be reduced to fit storage limits.';
                } catch (e2) {
                  // Even compressed storage failed, fall back to session-only
                  console.warn('Could not save report to localStorage:', e2);
                  storageStrategy = 'session';
                }
              }
            } else {
              storageMessage = 'Report is too large for persistent storage (>5MB). Available for this session only.';
            }
            
            // Update index with storage strategy info
            let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
            index.unshift({ 
              id, 
              name, 
              date, 
              size: reportSize,
              storageStrategy,
              persistent: storageStrategy !== 'session'
            });
            localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
            
            // Show storage status to user
            this.$emit('report-uploaded', { 
              ...reportData, 
              _uploadedId: id, 
              _storageStrategy: storageStrategy,
              _storageMessage: storageMessage
            });
            
            // Display storage status message
            this.showStorageStatus(storageStrategy, storageMessage);
            this.selectedFile = null;
          } catch (err) {
            this.errorMessage = 'Invalid JSON file: ' + (err && err.message ? err.message : 'Unknown error.');
          }
        };
        reader.readAsText(this.selectedFile);
      }
    },
    showStorageStatus(strategy, message) {
      this.storageStatus = {
        strategy,
        message,
        type: this.getStorageAlertType(strategy)
      };
      this.showStorageInfo = true;
      
      // Auto-hide success messages after 5 seconds
      if (strategy === 'persistent') {
        setTimeout(() => {
          this.showStorageInfo = false;
        }, 5000);
      }
    },
    getStorageAlertType(strategy) {
      switch (strategy) {
        case 'persistent': return 'success';
        case 'compressed': return 'warning';
        case 'session': return 'info';
        default: return 'info';
      }
    },
    dismissStorageInfo() {
      this.showStorageInfo = false;
    },
    // Storage Management Methods
    getTotalStorageSize() {
      return this.storedReports.reduce((total, report) => total + (report.size || 0), 0);
    },
    formatStorageSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return 'Unknown date';
      }
    },
    getStorageChipColor(strategy) {
      switch (strategy) {
        case 'persistent': return 'success';
        case 'compressed': return 'warning';
        case 'session': return 'info';
        default: return 'grey';
      }
    },
    getStorageLabel(strategy) {
      switch (strategy) {
        case 'persistent': return 'Saved';
        case 'compressed': return 'Compressed';
        case 'session': return 'Session';
        default: return 'Unknown';
      }
    },
    deleteStoredReport(reportId) {
      try {
        // Remove from localStorage
        localStorage.removeItem('uploaded-report-' + reportId);
        
        // Update index
        let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
        index = index.filter(report => report.id !== reportId);
        localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
        
        // Force reactivity update
        this.$forceUpdate();
        
        // Show success message
        this.showStorageStatus('success', `Report "${reportId}" deleted successfully.`);
      } catch (e) {
        console.error('Error deleting report:', e);
        this.errorMessage = 'Failed to delete report. Please try again.';
      }
    },
    clearAllStoredReports() {
      if (confirm('Are you sure you want to delete all stored reports? This action cannot be undone.')) {
        try {
          // Remove all stored reports
          this.storedReports.forEach(report => {
            localStorage.removeItem('uploaded-report-' + report.id);
          });
          
          // Clear index
          localStorage.removeItem('uploaded-reports-index');
          
          // Force reactivity update
          this.$forceUpdate();
          
          // Show success message
          this.showStorageStatus('success', 'All stored reports have been deleted.');
          this.showStorageManager = false;
        } catch (e) {
          console.error('Error clearing reports:', e);
          this.errorMessage = 'Failed to clear reports. Please try again.';
        }
      }
    },
    viewStoredReport(reportId) {
      try {
        // Load the report data from localStorage
        const reportData = localStorage.getItem('uploaded-report-' + reportId);
        
        if (reportData) {
          // Parse and set the report data in the store
          const parsedData = JSON.parse(reportData);
          this.$store.commit('setReportData', { ...parsedData, _uploadedId: reportId });
          
          // Navigate to the report view
          this.$router.push({ 
            name: 'Report', 
            params: { id: reportId }, 
            query: { t: Date.now() } 
          });
        } else {
          // Report not found in localStorage, show error
          this.showStorageStatus('error', `Report "${reportId}" not found. It may have been deleted or expired.`);
          
          // Remove from index since it's not available
          let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
          index = index.filter(report => report.id !== reportId);
          localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
          this.$forceUpdate();
        }
      } catch (e) {
        console.error('Error loading stored report:', e);
        this.errorMessage = 'Failed to load report. Please try again.';
      }
    }
  }
};
</script>

<style scoped>
.stored-report-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.stored-report-item:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.stored-report-item.session-only {
  border-left: 4px solid #2196f3;
  background: linear-gradient(90deg, #e3f2fd 0%, #fafafa 20%);
}

.storage-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.stored-reports-list {
  max-height: 300px;
  overflow-y: auto;
}

.stored-reports-list::-webkit-scrollbar {
  width: 6px;
}

.stored-reports-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.stored-reports-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.stored-reports-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Enhanced alert styling */
.v-alert {
  border-radius: 8px !important;
}

.v-alert .v-icon {
  margin-right: 8px !important;
}

/* File input styling */
.v-file-input {
  margin-bottom: 8px;
}

/* Card styling improvements */
.v-card {
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.v-card-title {
  padding-bottom: 8px !important;
}

/* Button styling */
.v-btn {
  border-radius: 6px !important;
}

/* Chip styling */
.v-chip {
  border-radius: 6px !important;
}

/* Clickable area styling */
.clickable-area {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-area:hover {
  color: #1976d2;
}

.report-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>