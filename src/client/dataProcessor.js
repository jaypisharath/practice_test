/**
 * Data Processor Module
 * Provides data analysis, pattern extraction, and labeling capabilities
 */

class DataProcessor {
  constructor(options = {}) {
    this.logging = options.logging || false;
  }

  /**
   * Log operations for debugging
   */
  log(message, data = null) {
    if (this.logging) {
      console.log(`[DataProcessor] ${message}`, data || '');
    }
  }

  /**
   * Validate data structure
   */
  validateData(data, expectedType = 'array') {
    if (expectedType === 'array' && !Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    if (expectedType === 'object' && typeof data !== 'object') {
      throw new Error('Data must be an object');
    }
    if (expectedType === 'array' && Array.isArray(data) && data.length === 0) {
      throw new Error('Data array cannot be empty');
    }
    return true;
  }

  /**
   * Parse and validate CSV data
   */
  parseCSVData(csvData) {
    this.validateData(csvData, 'array');
    this.log(`Parsing ${csvData.length} CSV rows`);
    
    const results = {
      valid: [],
      invalid: [],
      summary: {
        totalRows: csvData.length,
        validRows: 0,
        invalidRows: 0,
        columns: [],
        dataTypes: {}
      }
    };

    if (csvData.length > 0) {
      results.summary.columns = Object.keys(csvData[0]);
    }

    csvData.forEach((row, index) => {
      try {
        // Basic validation - check for required fields
        const isValid = this.validateCSVRow(row, results.summary.columns);
        
        if (isValid) {
          results.valid.push({ ...row, _rowIndex: index });
          results.summary.validRows++;
        } else {
          results.invalid.push({ ...row, _rowIndex: index, _error: 'Invalid row structure' });
          results.summary.invalidRows++;
        }
      } catch (error) {
        results.invalid.push({ ...row, _rowIndex: index, _error: error.message });
        results.summary.invalidRows++;
      }
    });

    // Analyze data types
    if (results.valid.length > 0) {
      results.summary.dataTypes = this.analyzeDataTypes(results.valid);
    }

    this.log(`Parsed CSV: ${results.summary.validRows} valid, ${results.summary.invalidRows} invalid rows`);
    return results;
  }

  /**
   * Validate individual CSV row
   */
  validateCSVRow(row, expectedColumns) {
    if (!row || typeof row !== 'object') {
      return false;
    }
    
    // Check if row has expected columns
    const rowColumns = Object.keys(row);
    return expectedColumns.every(col => rowColumns.includes(col));
  }

  /**
   * Parse and validate JSON data
   */
  parseJSONData(jsonData) {
    this.validateData(jsonData, 'array');
    this.log(`Parsing ${jsonData.length} JSON objects`);
    
    const results = {
      valid: [],
      invalid: [],
      summary: {
        totalObjects: jsonData.length,
        validObjects: 0,
        invalidObjects: 0,
        properties: [],
        dataTypes: {}
      }
    };

    if (jsonData.length > 0) {
      // Get all unique properties
      const allProperties = new Set();
      jsonData.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => allProperties.add(key));
        }
      });
      results.summary.properties = Array.from(allProperties);
    }

    jsonData.forEach((obj, index) => {
      try {
        const isValid = this.validateJSONObject(obj);
        
        if (isValid) {
          results.valid.push({ ...obj, _objectIndex: index });
          results.summary.validObjects++;
        } else {
          results.invalid.push({ ...obj, _objectIndex: index, _error: 'Invalid object structure' });
          results.summary.invalidObjects++;
        }
      } catch (error) {
        results.invalid.push({ ...obj, _objectIndex: index, _error: error.message });
        results.summary.invalidObjects++;
      }
    });

    // Analyze data types
    if (results.valid.length > 0) {
      results.summary.dataTypes = this.analyzeDataTypes(results.valid);
    }

    this.log(`Parsed JSON: ${results.summary.validObjects} valid, ${results.summary.invalidObjects} invalid objects`);
    return results;
  }

  /**
   * Validate individual JSON object
   */
  validateJSONObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  /**
   * Analyze data types in dataset
   */
  analyzeDataTypes(data) {
    const dataTypes = {};
    
    if (data.length === 0) return dataTypes;

    const sample = data[0];
    Object.keys(sample).forEach(key => {
      const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined);
      
      if (values.length === 0) {
        dataTypes[key] = 'empty';
        return;
      }

      const types = new Set(values.map(val => typeof val));
      
      if (types.has('number')) {
        dataTypes[key] = 'number';
      } else if (types.has('boolean')) {
        dataTypes[key] = 'boolean';
      } else if (types.has('string')) {
        // Check if it's a date
        if (this.isDateField(values)) {
          dataTypes[key] = 'date';
        } else {
          dataTypes[key] = 'string';
        }
      } else {
        dataTypes[key] = 'mixed';
      }
    });

    return dataTypes;
  }

  /**
   * Check if field contains date values
   */
  isDateField(values) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    ];

    const sampleSize = Math.min(10, values.length);
    const sample = values.slice(0, sampleSize);
    
    return sample.every(val => {
      if (typeof val !== 'string') return false;
      return datePatterns.some(pattern => pattern.test(val)) || !isNaN(Date.parse(val));
    });
  }

  /**
   * Find duplicate entries
   */
  findDuplicates(data, keyFields = null) {
    this.validateData(data, 'array');
    this.log(`Finding duplicates in ${data.length} records`);
    
    const seen = new Map();
    const duplicates = [];
    const unique = [];

    data.forEach((item, index) => {
      let key;
      
      if (keyFields) {
        // Use specific fields as key
        key = keyFields.map(field => item[field]).join('|');
      } else {
        // Use entire object as key
        key = JSON.stringify(item);
      }

      if (seen.has(key)) {
        duplicates.push({
          ...item,
          _index: index,
          _duplicateOf: seen.get(key)
        });
      } else {
        seen.set(key, index);
        unique.push({
          ...item,
          _index: index
        });
      }
    });

    this.log(`Found ${duplicates.length} duplicates, ${unique.length} unique records`);
    return {
      duplicates,
      unique,
      summary: {
        total: data.length,
        unique: unique.length,
        duplicates: duplicates.length,
        duplicateRate: (duplicates.length / data.length * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Categorize data based on rules
   */
  categorizeData(data, rules) {
    this.validateData(data, 'array');
    this.log(`Categorizing ${data.length} records with ${rules.length} rules`);
    
    const results = {
      categorized: [],
      uncategorized: [],
      categories: {},
      summary: {
        total: data.length,
        categorized: 0,
        uncategorized: 0
      }
    };

    // Initialize category counters
    rules.forEach(rule => {
      results.categories[rule.category] = 0;
    });

    data.forEach((item, index) => {
      let categorized = false;
      
      for (const rule of rules) {
        if (this.evaluateRule(item, rule.condition)) {
          results.categorized.push({
            ...item,
            _index: index,
            _category: rule.category,
            _confidence: rule.confidence || 1.0
          });
          results.categories[rule.category]++;
          results.summary.categorized++;
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        results.uncategorized.push({
          ...item,
          _index: index
        });
        results.summary.uncategorized++;
      }
    });

    this.log(`Categorized ${results.summary.categorized} records, ${results.summary.uncategorized} uncategorized`);
    return results;
  }

  /**
   * Evaluate categorization rule
   */
  evaluateRule(item, condition) {
    if (typeof condition === 'function') {
      return condition(item);
    }
    
    if (typeof condition === 'object') {
      return Object.entries(condition).every(([field, expectedValue]) => {
        const actualValue = item[field];
        
        if (typeof expectedValue === 'string' && expectedValue.startsWith('>')) {
          return actualValue > parseFloat(expectedValue.slice(1));
        }
        if (typeof expectedValue === 'string' && expectedValue.startsWith('<')) {
          return actualValue < parseFloat(expectedValue.slice(1));
        }
        if (typeof expectedValue === 'string' && expectedValue.startsWith('>=')) {
          return actualValue >= parseFloat(expectedValue.slice(2));
        }
        if (typeof expectedValue === 'string' && expectedValue.startsWith('<=')) {
          return actualValue <= parseFloat(expectedValue.slice(2));
        }
        if (typeof expectedValue === 'string' && expectedValue.includes('*')) {
          const pattern = expectedValue.replace(/\*/g, '.*');
          return new RegExp(pattern, 'i').test(actualValue);
        }
        
        return actualValue === expectedValue;
      });
    }
    
    return false;
  }

  /**
   * Filter data based on criteria
   */
  filterData(data, criteria) {
    this.validateData(data, 'array');
    this.log(`Filtering ${data.length} records`);
    
    const filtered = data.filter(item => {
      return Object.entries(criteria).every(([field, condition]) => {
        const value = item[field];
        
        if (typeof condition === 'function') {
          return condition(value);
        }
        
        if (Array.isArray(condition)) {
          return condition.includes(value);
        }
        
        if (typeof condition === 'object') {
          if (condition.min !== undefined && value < condition.min) return false;
          if (condition.max !== undefined && value > condition.max) return false;
          if (condition.pattern && !new RegExp(condition.pattern).test(value)) return false;
          return true;
        }
        
        return value === condition;
      });
    });

    this.log(`Filtered to ${filtered.length} records`);
    return filtered;
  }

  /**
   * Aggregate data by grouping
   */
  aggregateData(data, groupBy, aggregations) {
    this.validateData(data, 'array');
    this.log(`Aggregating ${data.length} records by ${groupBy}`);
    
    const groups = {};
    
    data.forEach(item => {
      const groupKey = item[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    const results = Object.entries(groups).map(([groupKey, groupData]) => {
      const result = { [groupBy]: groupKey, count: groupData.length };
      
      aggregations.forEach(agg => {
        const values = groupData.map(item => item[agg.field]).filter(val => val !== null && val !== undefined);
        
        switch (agg.operation) {
          case 'sum':
            result[`${agg.field}_sum`] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result[`${agg.field}_avg`] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            result[`${agg.field}_min`] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            result[`${agg.field}_max`] = values.length > 0 ? Math.max(...values) : null;
            break;
          case 'count':
            result[`${agg.field}_count`] = values.length;
            break;
        }
      });
      
      return result;
    });

    this.log(`Created ${results.length} aggregated groups`);
    return results;
  }

  /**
   * Export processed data
   */
  exportData(data, format = 'json', options = {}) {
    this.validateData(data, 'array');
    this.log(`Exporting ${data.length} records in ${format} format`);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, options.pretty ? 2 : 0);
      
      case 'csv':
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
          const row = headers.map(header => {
            const value = item[header];
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          });
          csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = DataProcessor;
