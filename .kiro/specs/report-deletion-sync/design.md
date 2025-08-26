# Report Deletion and Sync Management - Technical Design

## Architecture Overview

The system implements a **hybrid storage architecture** that provides full CRUD operations in local development while gracefully handling GitHub Pages static hosting limitations through a "soft delete" approach.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Report Management System                     │
├─────────────────────────────────────────────────────────────────┤
│  Local Development          │         GitHub Pages              │
│  ┌─────────────────────┐   │   ┌─────────────────────────────┐ │
│  │   Full CRUD Ops     │   │   │      Soft Delete Only       │ │
│  │  ┌───────────────┐  │   │   │  ┌───────────────────────┐  │ │
│  │  │ Create/Upload │  │   │   │  │   Static File Serving │  │ │
│  │  │ Read/Display  │  │   │   │  │   Index-based Filtering│  │ │
│  │  │ Update/Edit   │  │   │   │  │   Graceful Degradation │  │ │
│  │  │ Delete/Remove │  │◄──┼───┼──┤   Deployment Cleanup   │  │ │
│  │  └───────────────┘  │   │   │  └───────────────────────┘  │ │
│  └─────────────────────┘   │   └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Enhanced Delete API

```javascript
// Server-side delete endpoint
app.delete('/api/reports/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { soft = false } = req.query;
    
    if (soft) {
      // Soft delete - mark in index only
      await markReportAsDeleted(filename);
    } else {
      // Hard delete - remove file and update index
      await deleteReportFile(filename);
      await removeFromIndex(filename);
    }
    
    await regenerateIndex();
    
    res.json({
      success: true,
      message: soft ? 'Report marked for deletion' : 'Report deleted successfully',
      deletionType: soft ? 'soft' : 'hard'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Storage State Management

```javascript
class StorageManager {
  constructor() {
    this.localStorage = window.localStorage;
    this.sessionState = new Map();
  }
  
  // Track report states
  async getReportStates() {
    return {
      local: await this.getLocalReports(),
      published: await this.getPublishedReports(),
      deleted: await this.getDeletedReports(),
      pendingCleanup: await this.getPendingCleanup()
    };
  }
  
  // Mark report for deletion
  async markForDeletion(reportId) {
    const states = await this.getReportStates();
    states.deleted.push({
      id: reportId,
      deletedAt: new Date().toISOString(),
      needsCleanup: true
    });
    
    await this.saveStates(states);
  }
  
  // Sync with server state
  async syncWithServer() {
    const serverReports = await fetch('/api/reports').then(r => r.json());
    const localStates = await this.getReportStates();
    
    return this.resolveConflicts(serverReports, localStates);
  }
}
```

### 3. Deletion Service

```javascript
class DeletionService {
  constructor() {
    this.storageManager = new StorageManager();
  }
  
  async deleteReport(reportId, options = {}) {
    const { confirm = true, soft = false } = options;
    
    if (confirm && !await this.confirmDeletion(reportId)) {
      return { cancelled: true };
    }
    
    try {
      // Determine deletion type based on environment
      const isLocal = window.location.hostname === 'localhost';
      const deletionType = isLocal && !soft ? 'hard' : 'soft';
      
      const response = await fetch(`/api/reports/${reportId}?soft=${deletionType === 'soft'}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await this.updateLocalState(reportId, deletionType);
        this.notifyDeletion(reportId, deletionType);
      }
      
      return result;
    } catch (error) {
      this.handleDeletionError(error);
      throw error;
    }
  }
  
  async confirmDeletion(reportId) {
    return new Promise((resolve) => {
      // Show confirmation dialog
      this.showConfirmationDialog({
        title: 'Delete Report',
        message: 'Are you sure you want to delete this report?',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }
}
```

### 4. Sync Status Tracking

```javascript
class SyncManager {
  async getSyncStatus() {
    const localReports = await this.getLocalReports();
    const publishedReports = await this.getPublishedReports();
    const deletedReports = await this.getDeletedReports();
    
    return {
      localCount: localReports.length,
      publishedCount: publishedReports.length,
      deletedCount: deletedReports.length,
      pendingCleanup: this.getPendingCleanup(deletedReports),
      conflicts: this.detectConflicts(localReports, publishedReports),
      lastSyncAt: await this.getLastSyncTime()
    };
  }
  
  detectConflicts(local, published) {
    const conflicts = [];
    
    // Find reports that exist in published but are deleted locally
    published.forEach(report => {
      if (this.isDeletedLocally(report.id) && !this.isMarkedForCleanup(report.id)) {
        conflicts.push({
          type: 'deleted-locally-exists-published',
          reportId: report.id,
          resolution: 'mark-for-cleanup'
        });
      }
    });
    
    return conflicts;
  }
}
```

### 5. Enhanced Index Generation

```javascript
// Enhanced index generation with deletion support
class IndexGenerator {
  async generateIndex() {
    const reports = await this.getAllReports();
    const deletedReports = await this.getDeletedReports();
    
    // Filter out deleted reports for display
    const activeReports = reports.filter(report => 
      !deletedReports.some(deleted => deleted.id === report.id)
    );
    
    const index = {
      reports: activeReports,
      totalReports: activeReports.length,
      deletedReports: deletedReports.length,
      lastUpdated: new Date().toISOString(),
      syncStatus: await this.getSyncStatus()
    };
    
    await this.writeIndex(index);
    return index;
  }
  
  async markReportAsDeleted(reportId) {
    const deletedReports = await this.getDeletedReports();
    deletedReports.push({
      id: reportId,
      deletedAt: new Date().toISOString(),
      needsCleanup: true
    });
    
    await this.saveDeletedReports(deletedReports);
    await this.generateIndex(); // Regenerate index
  }
}
```

### 6. Deployment Cleanup Process

```javascript
// Pre-deployment cleanup script
class DeploymentCleanup {
  constructor() {
    this.reportsDir = path.join(__dirname, '../public/TestResultsJsons');
    this.indexPath = path.join(this.reportsDir, 'index.json');
  }
  
  async cleanup() {
    console.log('🧹 Starting deployment cleanup...');
    
    const index = await this.loadIndex();
    const deletedReports = this.getDeletedReports(index);
    
    if (deletedReports.length === 0) {
      console.log('✅ No reports to cleanup');
      return;
    }
    
    console.log(`🗑️  Found ${deletedReports.length} reports to cleanup`);
    
    for (const report of deletedReports) {
      await this.cleanupReport(report);
    }
    
    await this.updateIndex(index, deletedReports);
    
    console.log('✅ Cleanup completed successfully');
  }
  
  async cleanupReport(report) {
    const filePath = path.join(this.reportsDir, `${report.id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`   Deleted: ${report.id}.json`);
    }
  }
}
```

## Data Models

### Enhanced Report Model
```javascript
interface Report {
  id: string;
  name: string;
  date: string;
  features: Feature[];
  
  // Deletion Management
  status: 'active' | 'deleted' | 'pending-cleanup';
  deletedAt?: string;
  deletedBy?: string;
  
  // Sync Management
  localExists: boolean;
  publishedExists: boolean;
  lastSyncAt?: string;
}
```

### Sync State Model
```javascript
interface SyncState {
  lastSyncAt: string;
  localCount: number;
  publishedCount: number;
  deletedCount: number;
  pendingCleanupCount: number;
  conflicts: SyncConflict[];
}
```

## UI Components

### Status Indicators
```vue
<template>
  <div class="report-item">
    <div class="report-info">
      <h3>{{ report.name }}</h3>
      <div class="status-indicators">
        <v-chip 
          :color="getStatusColor(report.status)"
          size="small"
          class="mr-2"
        >
          {{ getStatusLabel(report.status) }}
        </v-chip>
        
        <v-chip 
          v-if="report.syncStatus !== 'synced'"
          :color="getSyncColor(report.syncStatus)"
          size="small"
          variant="outlined"
        >
          {{ getSyncLabel(report.syncStatus) }}
        </v-chip>
      </div>
    </div>
    
    <div class="report-actions">
      <v-btn 
        v-if="report.status === 'active'"
        icon="mdi-delete"
        size="small"
        color="error"
        @click="deleteReport(report.id)"
      />
      
      <v-btn 
        v-if="report.status === 'deleted' && canRestore"
        icon="mdi-restore"
        size="small"
        color="success"
        @click="restoreReport(report.id)"
      />
    </div>
  </div>
</template>
```

### Enhanced Delete Button
```vue
<template>
  <v-btn
    :loading="deleting"
    :disabled="report.status === 'deleted'"
    color="error"
    size="small"
    @click="handleDelete"
  >
    <v-icon>mdi-delete</v-icon>
    <v-tooltip activator="parent" location="top">
      {{ getDeleteTooltip() }}
    </v-tooltip>
  </v-btn>
</template>

<script>
export default {
  methods: {
    async handleDelete() {
      const isLocal = window.location.hostname === 'localhost';
      const message = isLocal 
        ? 'This will permanently delete the report file.'
        : 'This will hide the report from the collection.';
      
      if (await this.$refs.confirmDialog.show({
        title: 'Delete Report',
        message: message
      })) {
        await this.deletionService.deleteReport(this.report.id);
      }
    },
    
    getDeleteTooltip() {
      const isLocal = window.location.hostname === 'localhost';
      return isLocal 
        ? 'Delete report file permanently'
        : 'Hide report from collection';
    }
  }
}
</script>
```

## Error Handling

### Deletion Error Recovery
```javascript
class DeletionErrorHandler {
  async handleDeletionError(error, reportId, operation) {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'FILE_NOT_FOUND':
        // File already deleted, update index only
        await this.updateIndexOnly(reportId);
        break;
        
      case 'PERMISSION_DENIED':
        // Show user-friendly error
        this.showPermissionError();
        break;
        
      case 'NETWORK_ERROR':
        // Offer retry option
        await this.offerRetry(reportId, operation);
        break;
        
      default:
        // Log and show generic error
        this.logError(error);
        this.showGenericError();
    }
  }
}
```

## Performance Considerations

### Batch Operations
```javascript
class BatchDeletion {
  async deleteMultipleReports(reportIds, options = {}) {
    const { batchSize = 10 } = options;
    const batches = this.createBatches(reportIds, batchSize);
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(id => this.deleteReport(id, { confirm: false }))
      );
      
      // Update UI after each batch
      await this.updateUI();
      
      // Small delay to prevent overwhelming the system
      await this.delay(100);
    }
    
    // Final index regeneration
    await this.regenerateIndex();
  }
}
```

This design provides a comprehensive solution for report deletion and sync management while maintaining backward compatibility and handling the constraints of GitHub Pages static hosting.