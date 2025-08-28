/**
 * Deletion Service
 * Handles report deletion operations with confirmation and error handling
 */

class DeletionService {
  constructor() {
    this.baseURL =
      process.env.NODE_ENV === "production" ? "" : "http://localhost:3001";
    this.isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
  }

  /**
   * Delete a report with confirmation and proper error handling
   */
  async deleteReport(reportId, options = {}) {
    const {
      confirm = true,
      soft = null, // null = auto-detect based on environment
      showFeedback = true,
    } = options;

    try {
      // Auto-detect deletion type if not specified
      const shouldSoftDelete = soft !== null ? soft : !this.isLocalhost;

      // Show confirmation dialog if requested
      if (
        confirm &&
        !(await this.confirmDeletion(reportId, shouldSoftDelete))
      ) {
        return {
          success: false,
          cancelled: true,
          message: "Deletion cancelled by user",
        };
      }

      // Show loading state
      if (showFeedback) {
        this.showLoadingState(reportId, true);
      }

      // Try server deletion first
      let result;
      try {
        // Perform deletion via server
        const filename = this.getFilenameFromId(reportId);
        const response = await fetch(
          `${this.baseURL}/api/reports/${filename}?soft=${shouldSoftDelete}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        );

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Server deletion failed");
        }
      } catch (serverError) {
        console.warn("Server deletion failed, falling back to local deletion:", serverError.message);
        
        // Fallback to local-only deletion
        result = await this.performLocalDeletion(reportId, shouldSoftDelete);
      }

      if (result.success) {
        // Update local state
        await this.updateLocalState(reportId, result.deletionType || (shouldSoftDelete ? 'soft' : 'hard'));

        // Show success feedback
        if (showFeedback) {
          this.showSuccessMessage(
            reportId, 
            result.deletionType || (shouldSoftDelete ? 'soft' : 'hard'),
            result.localOnly || false
          );
        }

        // Emit deletion event for UI updates
        this.emitDeletionEvent(reportId, result);
      } else {
        throw new Error(result.error || "Deletion failed");
      }

      return result;
    } catch (error) {
      console.error("Deletion error:", error);

      if (showFeedback) {
        this.showErrorMessage(reportId, error.message);
      }

      throw error;
    } finally {
      if (showFeedback) {
        this.showLoadingState(reportId, false);
      }
    }
  }

  /**
   * Perform local-only deletion when server is not available
   */
  async performLocalDeletion(reportId, shouldSoftDelete) {
    try {
      console.log(`Performing local deletion for ${reportId} (soft: ${shouldSoftDelete})`);
      
      // For local deletion, we can only manage localStorage and UI state
      // The actual file deletion would need server access
      
      if (shouldSoftDelete) {
        // For soft delete, just mark in localStorage
        const deletionInfo = {
          reportId,
          deletedAt: new Date().toISOString(),
          deletionType: 'soft',
          environment: this.isLocalhost ? "localhost" : "production",
          localOnly: true // Flag to indicate this was a local-only deletion
        };

        const deletionsKey = "deleted-reports";
        const storedDeletions = localStorage.getItem(deletionsKey);
        const deletions = storedDeletions ? JSON.parse(storedDeletions) : [];
        deletions.push(deletionInfo);
        localStorage.setItem(deletionsKey, JSON.stringify(deletions));

        return {
          success: true,
          deletionType: 'soft',
          localOnly: true,
          message: 'Report hidden locally (server not available)'
        };
      } else {
        // For hard delete without server, we can only remove from localStorage
        // The actual file will remain until server is available
        return {
          success: true,
          deletionType: 'hard',
          localOnly: true,
          message: 'Report removed from local view (file remains until server processes deletion)'
        };
      }
    } catch (error) {
      console.error("Local deletion failed:", error);
      throw new Error(`Local deletion failed: ${error.message}`);
    }
  }

  /**
   * Show confirmation dialog for deletion
   */
  async confirmDeletion(reportId, isSoftDelete) {
    return new Promise((resolve) => {
      const message = isSoftDelete
        ? "This will hide the report from the collection. The file will remain until next deployment."
        : "This will permanently delete the report file from the server.";

      const title = isSoftDelete ? "Hide Report" : "Delete Report";

      // Create confirmation dialog
      const dialog = this.createConfirmationDialog({
        title,
        message,
        reportId,
        confirmText: isSoftDelete ? "Hide" : "Delete",
        confirmColor: "error",
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });

      document.body.appendChild(dialog);
    });
  }

  /**
   * Create confirmation dialog element
   */
  createConfirmationDialog({
    title,
    message,
    reportId,
    confirmText,
    confirmColor,
    onConfirm,
    onCancel,
  }) {
    const overlay = document.createElement("div");
    overlay.className = "deletion-confirmation-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    const dialog = document.createElement("div");
    dialog.className = "deletion-confirmation-dialog";
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">${title}</h3>
      <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="cancel-btn" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">Cancel</button>
        <button class="confirm-btn" style="
          padding: 8px 16px;
          border: none;
          background: #f44336;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">${confirmText}</button>
      </div>
    `;

    // Add event listeners
    const cancelBtn = dialog.querySelector(".cancel-btn");
    const confirmBtn = dialog.querySelector(".confirm-btn");

    const cleanup = () => {
      document.body.removeChild(overlay);
    };

    cancelBtn.addEventListener("click", () => {
      cleanup();
      onCancel();
    });

    confirmBtn.addEventListener("click", () => {
      cleanup();
      onConfirm();
    });

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        onCancel();
      }
    });

    // Close on Escape key
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        cleanup();
        onCancel();
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);

    overlay.appendChild(dialog);
    return overlay;
  }

  /**
   * Update local state after deletion
   */
  async updateLocalState(reportId, deletionType) {
    try {
      // Update localStorage if used
      const reportsKey = "cucumber-reports";
      const storedReports = localStorage.getItem(reportsKey);

      if (storedReports) {
        const reports = JSON.parse(storedReports);
        const updatedReports = reports.filter((r) => r.id !== reportId);
        localStorage.setItem(reportsKey, JSON.stringify(updatedReports));
      }

      // Store deletion info for sync tracking
      const deletionInfo = {
        reportId,
        deletedAt: new Date().toISOString(),
        deletionType,
        environment: this.isLocalhost ? "localhost" : "production",
      };

      const deletionsKey = "deleted-reports";
      const storedDeletions = localStorage.getItem(deletionsKey);
      const deletions = storedDeletions ? JSON.parse(storedDeletions) : [];
      deletions.push(deletionInfo);
      localStorage.setItem(deletionsKey, JSON.stringify(deletions));
    } catch (error) {
      console.error("Error updating local state:", error);
    }
  }

  /**
   * Show loading state for deletion operation
   */
  showLoadingState(reportId, isLoading) {
    const deleteBtn = document.querySelector(
      `[data-report-id="${reportId}"] .delete-btn`
    );
    if (deleteBtn) {
      deleteBtn.disabled = isLoading;
      deleteBtn.innerHTML = isLoading
        ? '<i class="mdi mdi-loading mdi-spin"></i>'
        : '<i class="mdi mdi-delete"></i>';
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(reportId, deletionType, isLocalOnly = false) {
    let message;
    
    if (isLocalOnly) {
      message = deletionType === "soft"
        ? "Report hidden locally (server offline)"
        : "Report removed from view (server offline)";
    } else {
      message = deletionType === "soft"
        ? "Report hidden from collection"
        : "Report deleted successfully";
    }

    this.showNotification(message, "success");
  }

  /**
   * Show error message
   */
  showErrorMessage(reportId, error) {
    // Make error messages more user-friendly
    let userFriendlyMessage = error;
    
    if (error.includes('Failed to fetch') || error.includes('NetworkError')) {
      userFriendlyMessage = 'Unable to connect to server. Report removed from local view only.';
    } else if (error.includes('timeout') || error.includes('AbortError')) {
      userFriendlyMessage = 'Server request timed out. Report may have been deleted.';
    } else if (error.includes('404')) {
      userFriendlyMessage = 'Report not found on server (may already be deleted).';
    } else if (error.includes('500')) {
      userFriendlyMessage = 'Server error occurred during deletion.';
    }
    
    this.showNotification(`Deletion issue: ${userFriendlyMessage}`, "warning");
  }

  /**
   * Show notification (can be enhanced with a proper notification system)
   */
  showNotification(message, type = "info") {
    // Simple notification - can be replaced with Vuetify snackbar or similar
    const notification = document.createElement("div");
    notification.className = `deletion-notification deletion-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      z-index: 10000;
      max-width: 300px;
      background: ${
        type === "success"
          ? "#4caf50"
          : type === "error"
          ? "#f44336"
          : "#2196f3"
      };
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Emit deletion event for UI components to listen to
   */
  emitDeletionEvent(reportId, result) {
    const event = new CustomEvent("reportDeleted", {
      detail: {
        reportId,
        result,
        timestamp: new Date().toISOString(),
      },
    });

    window.dispatchEvent(event);
  }

  /**
   * Get filename from report ID
   */
  getFilenameFromId(reportId) {
    // If reportId already includes .json, use as-is
    if (reportId.endsWith(".json")) {
      return reportId;
    }

    // Otherwise, add .json extension
    return `${reportId}.json`;
  }

  /**
   * Test server connectivity
   */
  async testServerConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('Server connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Restore a soft-deleted report
   */
  async restoreReport(reportId, options = {}) {
    const { showFeedback = true } = options;

    try {
      if (showFeedback) {
        this.showLoadingState(reportId, true);
      }

      const filename = this.getFilenameFromId(reportId);
      const response = await fetch(
        `${this.baseURL}/api/reports/${filename}/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Remove from local deleted reports
        await this.removeFromLocalDeleted(reportId);

        if (showFeedback) {
          this.showNotification("Report restored successfully", "success");
        }

        // Emit restoration event
        const event = new CustomEvent("reportRestored", {
          detail: { reportId, result },
        });
        window.dispatchEvent(event);
      } else {
        throw new Error(result.message || "Restoration failed");
      }

      return result;
    } catch (error) {
      console.error("Restoration error:", error);

      if (showFeedback) {
        this.showErrorMessage(reportId, error.message);
      }

      throw error;
    } finally {
      if (showFeedback) {
        this.showLoadingState(reportId, false);
      }
    }
  }

  /**
   * Remove report from local deleted list
   */
  async removeFromLocalDeleted(reportId) {
    try {
      const deletionsKey = "deleted-reports";
      const storedDeletions = localStorage.getItem(deletionsKey);

      if (storedDeletions) {
        const deletions = JSON.parse(storedDeletions);
        const updatedDeletions = deletions.filter(
          (d) => d.reportId !== reportId
        );
        localStorage.setItem(deletionsKey, JSON.stringify(updatedDeletions));
      }
    } catch (error) {
      console.error("Error removing from local deleted:", error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const response = await fetch(`${this.baseURL}/api/sync/status`);
      const result = await response.json();

      if (result.success) {
        return result.syncStatus;
      } else {
        throw new Error(result.error || "Failed to get sync status");
      }
    } catch (error) {
      console.error("Error getting sync status:", error);
      throw error;
    }
  }

  /**
   * Get deleted reports list
   */
  async getDeletedReports() {
    try {
      const response = await fetch(`${this.baseURL}/api/reports/deleted`);
      const result = await response.json();

      if (result.success) {
        return result.deletedReports;
      } else {
        throw new Error(result.error || "Failed to get deleted reports");
      }
    } catch (error) {
      console.error("Error getting deleted reports:", error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple reports
   */
  async deleteMultipleReports(reportIds, options = {}) {
    const { batchSize = 5, showProgress = true } = options;
    const results = [];
    const errors = [];

    if (showProgress) {
      this.showBulkProgress(0, reportIds.length);
    }

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < reportIds.length; i += batchSize) {
      const batch = reportIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (reportId) => {
        try {
          const result = await this.deleteReport(reportId, {
            confirm: false,
            showFeedback: false,
          });
          results.push({ reportId, result });
          return result;
        } catch (error) {
          errors.push({ reportId, error: error.message });
          return { success: false, error: error.message };
        }
      });

      await Promise.all(batchPromises);

      if (showProgress) {
        this.showBulkProgress(
          Math.min(i + batchSize, reportIds.length),
          reportIds.length
        );
      }

      // Small delay between batches
      if (i + batchSize < reportIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (showProgress) {
      this.hideBulkProgress();
    }

    // Show summary
    const successCount = results.filter((r) => r.result.success).length;
    const message = `Bulk deletion completed: ${successCount}/${reportIds.length} successful`;
    this.showNotification(message, errors.length > 0 ? "warning" : "success");

    return {
      success: true,
      results,
      errors,
      summary: {
        total: reportIds.length,
        successful: successCount,
        failed: errors.length,
      },
    };
  }

  /**
   * Show bulk operation progress
   */
  showBulkProgress(current, total) {
    let progressEl = document.getElementById("bulk-deletion-progress");

    if (!progressEl) {
      progressEl = document.createElement("div");
      progressEl.id = "bulk-deletion-progress";
      progressEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        min-width: 300px;
        text-align: center;
      `;
      document.body.appendChild(progressEl);
    }

    const percentage = Math.round((current / total) * 100);
    progressEl.innerHTML = `
      <h4 style="margin: 0 0 16px 0;">Deleting Reports</h4>
      <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
        <div style="
          background: #2196f3;
          height: 8px;
          width: ${percentage}%;
          transition: width 0.3s ease;
        "></div>
      </div>
      <p style="margin: 0; color: #666;">${current} of ${total} completed (${percentage}%)</p>
    `;
  }

  /**
   * Hide bulk operation progress
   */
  hideBulkProgress() {
    const progressEl = document.getElementById("bulk-deletion-progress");
    if (progressEl) {
      document.body.removeChild(progressEl);
    }
  }
}

export default DeletionService;