/**
 * Deletion Utility Functions
 * Handles file deletion, soft delete marking, and index management
 */

const fs = require('fs');
const path = require('path');

class DeletionUtils {
  constructor(reportsDir) {
    this.reportsDir = reportsDir || path.join(__dirname, '../../public/TestResultsJsons');
    this.indexPath = path.join(this.reportsDir, 'index.json');
    this.deletedReportsPath = path.join(this.reportsDir, '.deleted-reports.json');
  }

  /**
   * Hard delete - physically remove file from filesystem
   * Used in local development
   */
  async deleteReportFile(filename) {
    try {
      const filePath = path.join(this.reportsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Report file not found: ${filename}`);
      }

      // Create backup before deletion (for potential recovery)
      await this.createBackup(filename);
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      console.log(`✅ Hard deleted report file: ${filename}`);
      return {
        success: true,
        type: 'hard',
        filename,
        message: 'Report file deleted successfully'
      };
    } catch (error) {
      console.error(`❌ Error deleting report file ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Soft delete - mark report as deleted in metadata
   * Used for GitHub Pages compatibility
   */
  async markReportAsDeleted(filename) {
    try {
      const deletedReports = await this.getDeletedReports();
      
      // Check if already marked as deleted
      const existingEntry = deletedReports.find(r => r.filename === filename);
      if (existingEntry) {
        return {
          success: true,
          type: 'soft',
          filename,
          message: 'Report already marked as deleted',
          alreadyDeleted: true
        };
      }

      // Add to deleted reports list
      const deletionRecord = {
        filename,
        deletedAt: new Date().toISOString(),
        needsCleanup: true,
        type: 'soft'
      };

      deletedReports.push(deletionRecord);
      await this.saveDeletedReports(deletedReports);
      
      console.log(`✅ Soft deleted report: ${filename}`);
      return {
        success: true,
        type: 'soft',
        filename,
        message: 'Report marked for deletion',
        deletionRecord
      };
    } catch (error) {
      console.error(`❌ Error marking report as deleted ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove report reference from index.json
   * Used after hard deletion
   */
  async removeFromIndex(filename) {
    try {
      const index = await this.loadIndex();
      
      if (!index || !index.reports) {
        console.log('⚠️  No index found or empty reports array');
        return { success: true, found: false };
      }

      const reportId = filename.replace(/\.json$/, '');
      const initialCount = index.reports.length;
      
      // Remove report from index
      index.reports = index.reports.filter(report => report.id !== reportId);
      
      const removedCount = initialCount - index.reports.length;
      
      if (removedCount > 0) {
        // Update statistics
        if (index.statistics) {
          index.statistics.totalReports = index.reports.length;
        }
        
        // Update timestamp
        index.generated = new Date().toISOString();
        
        await this.saveIndex(index);
        console.log(`✅ Removed ${removedCount} report(s) from index: ${reportId}`);
      } else {
        console.log(`⚠️  Report not found in index: ${reportId}`);
      }

      return {
        success: true,
        found: removedCount > 0,
        removedCount,
        reportId
      };
    } catch (error) {
      console.error(`❌ Error removing from index ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Get list of deleted reports
   */
  async getDeletedReports() {
    try {
      if (!fs.existsSync(this.deletedReportsPath)) {
        return [];
      }
      
      const data = fs.readFileSync(this.deletedReportsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading deleted reports:', error.message);
      return [];
    }
  }

  /**
   * Save deleted reports list
   */
  async saveDeletedReports(deletedReports) {
    try {
      fs.writeFileSync(
        this.deletedReportsPath, 
        JSON.stringify(deletedReports, null, 2)
      );
    } catch (error) {
      console.error('Error saving deleted reports:', error.message);
      throw error;
    }
  }

  /**
   * Load current index.json
   */
  async loadIndex() {
    try {
      if (!fs.existsSync(this.indexPath)) {
        return { reports: [], statistics: null };
      }
      
      const data = fs.readFileSync(this.indexPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading index:', error.message);
      return { reports: [], statistics: null };
    }
  }

  /**
   * Save index.json
   */
  async saveIndex(index) {
    try {
      fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('Error saving index:', error.message);
      throw error;
    }
  }

  /**
   * Create backup of report before deletion
   */
  async createBackup(filename) {
    try {
      const backupDir = path.join(this.reportsDir, '.backups');
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const sourcePath = path.join(this.reportsDir, filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${filename.replace('.json', '')}-backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFilename);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📁 Created backup: ${backupFilename}`);
        
        // Clean old backups (keep only last 10)
        await this.cleanOldBackups(backupDir);
      }
    } catch (error) {
      console.error('Error creating backup:', error.message);
      // Don't throw - backup failure shouldn't stop deletion
    }
  }

  /**
   * Clean old backup files
   */
  async cleanOldBackups(backupDir, keepCount = 10) {
    try {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.includes('-backup-'))
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          mtime: fs.statSync(path.join(backupDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (backupFiles.length > keepCount) {
        const filesToDelete = backupFiles.slice(keepCount);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Cleaned old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error.message);
    }
  }

  /**
   * Check if report is marked as deleted
   */
  async isReportDeleted(filename) {
    try {
      const deletedReports = await this.getDeletedReports();
      return deletedReports.some(r => r.filename === filename);
    } catch (error) {
      console.error('Error checking deletion status:', error.message);
      return false;
    }
  }

  /**
   * Restore a soft-deleted report
   */
  async restoreReport(filename) {
    try {
      const deletedReports = await this.getDeletedReports();
      const reportIndex = deletedReports.findIndex(r => r.filename === filename);
      
      if (reportIndex === -1) {
        return {
          success: false,
          message: 'Report not found in deleted list'
        };
      }

      // Remove from deleted list
      deletedReports.splice(reportIndex, 1);
      await this.saveDeletedReports(deletedReports);
      
      console.log(`✅ Restored report: ${filename}`);
      return {
        success: true,
        filename,
        message: 'Report restored successfully'
      };
    } catch (error) {
      console.error(`❌ Error restoring report ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Get reports that need cleanup (for deployment)
   */
  async getReportsNeedingCleanup() {
    try {
      const deletedReports = await this.getDeletedReports();
      return deletedReports.filter(r => r.needsCleanup);
    } catch (error) {
      console.error('Error getting reports needing cleanup:', error.message);
      return [];
    }
  }

  /**
   * Mark reports as cleaned up (after deployment)
   */
  async markReportsAsCleanedUp(filenames) {
    try {
      const deletedReports = await this.getDeletedReports();
      
      filenames.forEach(filename => {
        const report = deletedReports.find(r => r.filename === filename);
        if (report) {
          report.needsCleanup = false;
          report.cleanedUpAt = new Date().toISOString();
        }
      });

      await this.saveDeletedReports(deletedReports);
      console.log(`✅ Marked ${filenames.length} reports as cleaned up`);
    } catch (error) {
      console.error('Error marking reports as cleaned up:', error.message);
      throw error;
    }
  }
}

module.exports = DeletionUtils;