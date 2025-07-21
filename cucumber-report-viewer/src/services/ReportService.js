/**
 * Enhanced Report Service
 * Handles report loading, caching, and statistics
 */

class ReportService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    // Fix the base URL to match the actual path structure
    this.baseUrl = process.env.VUE_APP_REPORTS_BASE_URL || '/TestResultsJsons/';
  }

  /**
   * Load enhanced index with statistics (with fallback support)
   */
  async loadIndex() {
    const cacheKey = 'index';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // First try localStorage for uploaded reports
    try {
      const localIndex = JSON.parse(localStorage.getItem('uploaded-reports-index') || '[]');
      if (localIndex.length > 0) {
        const fallbackData = {
          reports: localIndex.map(report => ({
            ...report,
            features: report.features || 0,
            scenarios: report.scenarios || 0,
            steps: report.steps || 0,
            passed: report.passed || 0,
            failed: report.failed || 0,
            skipped: report.skipped || 0,
            duration: report.duration || 0,
            tags: report.tags || [],
            size: report.size || 0
          })),
          statistics: null,
          version: '1.0.0-localStorage'
        };
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now()
        });
        
        console.log('Successfully loaded from localStorage');
        return fallbackData;
      }
    } catch (localError) {
      console.warn('Failed to load from localStorage:', localError);
    }

    // Try multiple possible paths for the index file
    const possiblePaths = [
      `${process.env.BASE_URL || '/'}TestResultsJsons/index.json`,
      '/TestResultsJsons/index.json',
      './TestResultsJsons/index.json',
      'TestResultsJsons/index.json'
    ];
    
    for (const indexPath of possiblePaths) {
      try {
        console.log(`Trying to load index from: ${indexPath}`);
        const response = await fetch(`${indexPath}?t=${Date.now()}`, { cache: 'reload' });
        
        if (!response.ok) {
          throw new Error(`Failed to load index: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle both enhanced and legacy formats
        let normalizedData;
        if (Array.isArray(data)) {
          // Legacy format: array of reports
          normalizedData = {
            reports: data.map(report => ({
              ...report,
              features: report.features || 0,
              scenarios: report.scenarios || 0,
              steps: report.steps || 0,
              passed: report.passed || 0,
              failed: report.failed || 0,
              skipped: report.skipped || 0,
              duration: report.duration || 0,
              tags: report.tags || [],
              size: report.size || 0
            })),
            statistics: null,
            version: '1.0.0'
          };
        } else if (data && data.reports) {
          // Enhanced format: object with reports and statistics
          normalizedData = data;
        } else {
          throw new Error('Invalid index format');
        }
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: normalizedData,
          timestamp: Date.now()
        });
        
        console.log(`Successfully loaded index from: ${indexPath}`);
        return normalizedData;
        
      } catch (error) {
        console.warn(`Failed to load from ${indexPath}:`, error.message);
        // Continue to next path
      }
    }
    
    // If all paths failed, return empty structure
    console.error('All index loading attempts failed');
    const emptyData = {
      reports: [],
      statistics: {
        totalReports: 0,
        totalScenarios: 0,
        totalSteps: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        passRate: '0.00',
        failRate: '0.00',
        skipRate: '0.00'
      },
      version: '1.0.0-fallback'
    };
    
    // Cache the empty result to avoid repeated failures
    this.cache.set(cacheKey, {
      data: emptyData,
      timestamp: Date.now()
    });
    
    return emptyData;
  }

  /**
   * Load specific report with caching
   */
  async loadReport(reportId) {
    const cacheKey = `report-${reportId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${reportId}.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Failed to load report ${reportId}: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error loading report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Load statistics
   */
  async loadStatistics() {
    try {
      const response = await fetch(`${this.baseUrl}stats.json?t=${Date.now()}`);
      if (!response.ok) {
        // Stats file might not exist, return null
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Statistics not available:', error);
      return null;
    }
  }

  /**
   * Search reports by various criteria
   */
  searchReports(reports, query) {
    if (!query || !reports) return reports;
    
    const searchTerm = query.toLowerCase();
    
    return reports.filter(report => {
      return (
        report.name.toLowerCase().includes(searchTerm) ||
        report.id.toLowerCase().includes(searchTerm) ||
        (report.tags && report.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (report.environment && report.environment.toLowerCase().includes(searchTerm)) ||
        (report.tool && report.tool.toLowerCase().includes(searchTerm))
      );
    });
  }

  /**
   * Filter reports by criteria
   */
  filterReports(reports, filters) {
    if (!reports) return [];
    
    return reports.filter(report => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        const hasStatus = filters.status.some(status => {
          switch (status) {
            case 'passed': return report.failed === 0 && report.passed > 0;
            case 'failed': return report.failed > 0;
            case 'mixed': return report.passed > 0 && report.failed > 0;
            default: return false;
          }
        });
        if (!hasStatus) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const reportDate = new Date(report.date);
        if (filters.dateFrom && reportDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && reportDate > new Date(filters.dateTo)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => 
          report.tags && report.tags.includes(tag)
        );
        if (!hasTag) return false;
      }

      // Environment filter
      if (filters.environment && filters.environment.length > 0) {
        if (!filters.environment.includes(report.environment)) return false;
      }

      // Duration filter
      if (filters.minDuration !== undefined && report.duration < filters.minDuration) return false;
      if (filters.maxDuration !== undefined && report.duration > filters.maxDuration) return false;

      return true;
    });
  }

  /**
   * Sort reports by various criteria
   */
  sortReports(reports, sortBy, sortOrder = 'desc') {
    if (!reports) return [];
    
    const sorted = [...reports].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'duration':
          aVal = a.duration || 0;
          bVal = b.duration || 0;
          break;
        case 'scenarios':
          aVal = a.scenarios || 0;
          bVal = b.scenarios || 0;
          break;
        case 'passRate':
          aVal = a.steps > 0 ? (a.passed / a.steps) : 0;
          bVal = b.steps > 0 ? (b.passed / b.steps) : 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }

  /**
   * Get report trends over time
   */
  getReportTrends(reports, days = 30) {
    if (!reports) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentReports = reports.filter(report => 
      new Date(report.date) >= cutoffDate
    );
    
    // Group by date
    const trendData = {};
    recentReports.forEach(report => {
      const dateKey = new Date(report.date).toISOString().split('T')[0];
      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          date: dateKey,
          reports: 0,
          totalScenarios: 0,
          totalPassed: 0,
          totalFailed: 0,
          totalDuration: 0
        };
      }
      
      const day = trendData[dateKey];
      day.reports++;
      day.totalScenarios += report.scenarios || 0;
      day.totalPassed += report.passed || 0;
      day.totalFailed += report.failed || 0;
      day.totalDuration += report.duration || 0;
    });
    
    return Object.values(trendData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.values())).length
    };
  }
}

export default new ReportService();