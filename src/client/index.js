/**
 * Client Library Main Module
 * Provides a unified interface for HTTP requests, file operations, and data processing
 */

const HttpClient = require('./httpClient');
const FileProcessor = require('./fileProcessor');
const DataProcessor = require('./dataProcessor');

class Client {
  constructor(options = {}) {
    this.options = {
      logging: false,
      timeout: 10000,
      retries: 3,
      ...options
    };

    // Initialize modules
    this.http = new HttpClient({
      timeout: this.options.timeout,
      retries: this.options.retries,
      logging: this.options.logging
    });

    this.files = new FileProcessor({
      logging: this.options.logging
    });

    this.data = new DataProcessor({
      logging: this.options.logging
    });

    if (this.options.logging) {
      console.log('[Client] Initialized with options:', this.options);
    }
  }

  /**
   * Configure client settings
   */
  configure(options) {
    this.options = { ...this.options, ...options };
    
    // Reinitialize modules with new options
    this.http = new HttpClient({
      timeout: this.options.timeout,
      retries: this.options.retries,
      logging: this.options.logging
    });

    this.files = new FileProcessor({
      logging: this.options.logging
    });

    this.data = new DataProcessor({
      logging: this.options.logging
    });

    if (this.options.logging) {
      console.log('[Client] Reconfigured with options:', this.options);
    }
  }

  /**
   * Enable or disable logging
   */
  setLogging(enabled) {
    this.options.logging = enabled;
    this.http.logging = enabled;
    this.files.logging = enabled;
    this.data.logging = enabled;
  }

  /**
   * Get client status and configuration
   */
  getStatus() {
    return {
      initialized: true,
      options: this.options,
      modules: {
        http: 'HttpClient',
        files: 'FileProcessor',
        data: 'DataProcessor'
      }
    };
  }

  /**
   * Convenience method for quick HTTP GET
   */
  async get(url, options = {}) {
    return this.http.get(url, options);
  }

  /**
   * Convenience method for quick HTTP POST
   */
  async post(url, data, options = {}) {
    return this.http.post(url, data, options);
  }

  /**
   * Convenience method for quick file read
   */
  async readFile(filePath, format = 'auto') {
    if (format === 'auto') {
      const ext = filePath.toLowerCase().split('.').pop();
      format = ext;
    }

    switch (format.toLowerCase()) {
      case 'json':
        return this.files.readJSON(filePath);
      case 'csv':
        return this.files.readCSV(filePath);
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  /**
   * Convenience method for quick file write
   */
  async writeFile(filePath, data, format = 'auto', options = {}) {
    if (format === 'auto') {
      const ext = filePath.toLowerCase().split('.').pop();
      format = ext;
    }

    switch (format.toLowerCase()) {
      case 'json':
        return this.files.writeJSON(filePath, data, options);
      case 'csv':
        return this.files.writeCSV(filePath, data, options);
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  /**
   * Convenience method for data processing
   */
  async processData(data, operations = []) {
    let result = data;

    for (const operation of operations) {
      switch (operation.type) {
        case 'filter':
          result = this.data.filterData(result, operation.criteria);
          break;
        case 'categorize':
          result = this.data.categorizeData(result, operation.rules);
          break;
        case 'aggregate':
          result = this.data.aggregateData(result, operation.groupBy, operation.aggregations);
          break;
        case 'findDuplicates':
          result = this.data.findDuplicates(result, operation.keyFields);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    }

    return result;
  }

  /**
   * Complete workflow: fetch data, process, and save
   */
  async workflow(config) {
    const { source, operations, output } = config;
    let data;

    try {
      // Step 1: Load data
      if (source.type === 'http') {
        const response = await this.http.get(source.url);
        data = response.data;
      } else if (source.type === 'file') {
        data = await this.readFile(source.path, source.format);
      } else {
        throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Step 2: Process data
      if (operations && operations.length > 0) {
        data = await this.processData(data, operations);
      }

      // Step 3: Save results
      if (output) {
        if (output.type === 'file') {
          await this.writeFile(output.path, data, output.format, output.options);
        } else if (output.type === 'return') {
          return data;
        }
      }

      return {
        success: true,
        data,
        summary: {
          recordsProcessed: Array.isArray(data) ? data.length : 1,
          operations: operations ? operations.length : 0
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// Export individual modules for direct use
module.exports = {
  Client,
  HttpClient,
  FileProcessor,
  DataProcessor
};

// Default export
module.exports.default = Client;
