<template>
  <div class="reports-collection-bar-fluid">
    <v-card class="reports-collection-card-fluid">
      <v-card-title class="reports-collection-title">
        <v-icon color="primary" size="20" class="mr-2">mdi-folder-multiple</v-icon>
        Reports Collection
      </v-card-title>
      <v-card-text>
        <div v-if="reportsCollectionError" class="cucumber-alert error">{{ reportsCollectionError }}</div>
        <div v-else-if="reportsCollection.length === 0" class="cucumber-alert info">No reports found in collection.</div>
        <v-list v-else class="reports-collection-list">
          <v-list-item v-for="report in reportsCollection" :key="report.id || report.file" class="reports-collection-list-item">
            <div class="report-row-content">
              <span style="display:flex;align-items:center;gap:0.5em;">
                <router-link :to="{ name: 'Report', params: { id: report.id || report.file }, query: { t: Date.now() } }" class="report-link">
                  <v-icon color="primary" size="16" class="mr-1">mdi-file-document</v-icon>
                  {{ report.name || report.title || report.file || report.id }}
                </router-link>
              </span>
              <v-btn icon color="error" class="delete-btn" @click.stop="deleteReport(report)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
            <div v-if="report.date || report.summary" class="report-row-subtitle">
              <span v-if="report.date" class="report-date">{{ report.date }}</span>
              <span v-if="report.summary" class="report-summary">{{ report.summary }}</span>
            </div>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'ReportsCollection',
  data() {
    return {
      reportsCollection: [],
      reportsCollectionError: '',
    };
  },
  methods: {
    fetchReports() {
      fetch(process.env.BASE_URL + 'TestResultsJsons/index.json', { cache: 'reload' })
        .then(r => {
          if (!r.ok) throw new Error('Failed to load reports collection manifest.');
          return r.json();
        })
        .then(json => {
          if (Array.isArray(json)) {
            this.reportsCollection = json;
          } else if (json && Array.isArray(json.reports)) {
            this.reportsCollection = json.reports;
          } else {
            this.reportsCollection = [];
          }
        })
        .catch(e => {
          this.reportsCollectionError = e.message || 'Failed to load reports collection.';
        });
    },
    async deleteReport(report) {
      if (!confirm('Are you sure you want to delete this report?')) return;
      // Remove from localStorage (for demo uploads)
      let index = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      index = index.filter(r => (r.id || r.file) !== (report.id || report.file));
      localStorage.setItem('uploaded-reports-index', JSON.stringify(index));
      localStorage.removeItem('uploaded-report-' + (report.id || report.file));
      this.reportsCollection = index;
      // For static/fetched reports, just remove from UI (cannot delete on static hosting)
    }
  },
  mounted() {
    // Try to load from localStorage first (for demo uploads)
    let localIndex = [];
    try {
      localIndex = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
    } catch {}
    if (localIndex && localIndex.length) {
      this.reportsCollection = localIndex;
    } else {
      this.fetchReports();
    }
  },
};
</script>

<style scoped>
.reports-collection-bar-fluid {
  width: 100%;
  margin: 0 auto 2rem auto;
  padding: 0 0 2rem 0;
  display: flex;
  justify-content: center;
}
.reports-collection-card-fluid {
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-bottom: 1.2rem;
  width: 100%;
  max-width: 1100px;
  background: #f8f9fa;
}
.reports-collection-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: #1976d2;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.reports-collection-list {
  padding: 0;
}
.reports-collection-list-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.7em 0.2em;
  display: flex;
  align-items: center;
}
.report-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.01em;
}
.report-link:hover {
  text-decoration: underline;
}
.delete-btn {
  margin-left: 1em;
  transition: background 0.2s;
}
.delete-btn:hover {
  background: #ffeaea;
}
.report-row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.report-row-subtitle {
  margin-left: 2.2em;
  color: #888;
  font-size: 0.97em;
}
.report-date {
  color: #888;
  font-size: 0.97em;
  margin-right: 1em;
}
.report-summary {
  color: #444;
  font-size: 0.97em;
}
</style>
