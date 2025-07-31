/**
 * Service for handling report uploads to the backend API
 */

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3001/api';

class UploadService {
  /**
   * Upload a report to the server
   * @param {string} reportId - Unique identifier for the report
   * @param {Object} reportData - The report data object
   * @param {string} name - Display name for the report
   * @returns {Promise<Object>} Upload result
   */
  async uploadReport(reportId, reportData, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/upload-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          reportData,
          name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
    }
  }

  /**
   * Get list of available reports
   * @returns {Promise<Array>} List of reports
   */
  async getReports() {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch reports');
      }

      return result.reports || [];
    } catch (error) {
      console.error('Get reports error:', error);
      throw error;
    }
  }

  /**
   * Delete a specific report
   * @param {string} filename - Name of the file to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteReport(filename) {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${filename}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      return result;
    } catch (error) {
      console.error('Delete service error:', error);
      throw error;
    }
  }

  /**
   * Regenerate the index.json file
   * @returns {Promise<Object>} Regeneration result
   */
  async regenerateIndex() {
    try {
      const response = await fetch(`${API_BASE_URL}/regenerate-index`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Index regeneration failed');
      }

      return result;
    } catch (error) {
      console.error('Regenerate index error:', error);
      throw error;
    }
  }

  /**
   * Check if the upload server is available
   * @returns {Promise<boolean>} Server availability status
   */
  async checkServerHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      console.warn('Upload server not available:', error.message);
      return false;
    }
  }

  /**
   * Get the public URL for a report file
   * @param {string} filename - Name of the report file
   * @returns {string} Public URL to the report
   */
  getReportUrl(filename) {
    const baseUrl = process.env.VUE_APP_BASE_URL || window.location.origin;
    return `${baseUrl}/TestResultsJsons/${filename}`;
  }
}

export default new UploadService();