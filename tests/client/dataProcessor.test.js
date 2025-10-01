/**
 * Data Processor Tests
 */

const DataProcessor = require('../../src/client/dataProcessor');

describe('DataProcessor', () => {
  let dataProcessor;

  beforeEach(() => {
    dataProcessor = new DataProcessor({ logging: false });
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const processor = new DataProcessor();
      expect(processor.logging).toBe(false);
    });

    test('should initialize with custom options', () => {
      const processor = new DataProcessor({ logging: true });
      expect(processor.logging).toBe(true);
    });
  });

  describe('Data validation', () => {
    test('should validate array data', () => {
      const data = [{ name: 'John' }, { name: 'Jane' }];
      expect(() => dataProcessor.validateData(data, 'array')).not.toThrow();
    });

    test('should reject non-array data when expecting array', () => {
      expect(() => dataProcessor.validateData('not an array', 'array'))
        .toThrow('Data must be an array');
    });

    test('should reject empty array', () => {
      expect(() => dataProcessor.validateData([], 'array'))
        .toThrow('Data array cannot be empty');
    });
  });

  describe('CSV data parsing', () => {
    const csvData = [
      { name: 'John', age: '25', department: 'Engineering' },
      { name: 'Jane', age: '30', department: 'Marketing' },
      { name: 'Bob', age: '35', department: 'Sales' }
    ];

    test('should parse valid CSV data', () => {
      const result = dataProcessor.parseCSVData(csvData);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
      expect(result.summary.totalRows).toBe(3);
      expect(result.summary.validRows).toBe(3);
      expect(result.summary.columns).toEqual(['name', 'age', 'department']);
    });

    test('should identify invalid CSV rows', () => {
      const invalidCsvData = [
        { name: 'John', age: '25' }, // Missing department
        { name: 'Jane', age: '30', department: 'Marketing' },
        { name: 'Bob' } // Missing age and department
      ];

      const result = dataProcessor.parseCSVData(invalidCsvData);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.summary.validRows).toBe(2);
      expect(result.summary.invalidRows).toBe(1);
    });

    test('should analyze data types', () => {
      const result = dataProcessor.parseCSVData(csvData);
      
      expect(result.summary.dataTypes).toHaveProperty('name');
      expect(result.summary.dataTypes).toHaveProperty('age');
      expect(result.summary.dataTypes).toHaveProperty('department');
    });
  });

  describe('JSON data parsing', () => {
    const jsonData = [
      { id: 1, name: 'John', age: 25, active: true },
      { id: 2, name: 'Jane', age: 30, active: false },
      { id: 3, name: 'Bob', age: 35, active: true }
    ];

    test('should parse valid JSON data', () => {
      const result = dataProcessor.parseJSONData(jsonData);
      
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
      expect(result.summary.totalObjects).toBe(3);
      expect(result.summary.validObjects).toBe(3);
    });

    test('should identify invalid JSON objects', () => {
      const invalidJsonData = [
        { id: 1, name: 'John' },
        null, // Invalid object
        { id: 3, name: 'Bob' }
      ];

      const result = dataProcessor.parseJSONData(invalidJsonData);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
    });
  });

  describe('Duplicate detection', () => {
    const dataWithDuplicates = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
      { id: 3, name: 'John', email: 'john@example.com' }, // Duplicate
      { id: 4, name: 'Bob', email: 'bob@example.com' }
    ];

    test('should find duplicates by specific fields', () => {
      const result = dataProcessor.findDuplicates(dataWithDuplicates, ['name', 'email']);
      
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(3);
      expect(result.summary.duplicates).toBe(1);
      expect(result.summary.duplicateRate).toBe('25.00%');
    });

    test('should find duplicates by entire object', () => {
      const exactDuplicates = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 },
        { name: 'John', age: 25 } // Exact duplicate
      ];

      const result = dataProcessor.findDuplicates(exactDuplicates);
      
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(2);
    });
  });

  describe('Data categorization', () => {
    const employeeData = [
      { name: 'John', age: 25, salary: 50000, department: 'Engineering' },
      { name: 'Jane', age: 35, salary: 80000, department: 'Marketing' },
      { name: 'Bob', age: 45, salary: 120000, department: 'Engineering' },
      { name: 'Alice', age: 28, salary: 60000, department: 'Sales' }
    ];

    const rules = [
      {
        category: 'Senior',
        condition: { age: '>=35' }
      },
      {
        category: 'Junior',
        condition: { age: '<30' }
      },
      {
        category: 'Mid-level',
        condition: { age: '>=30' }
      }
    ];

    test('should categorize data based on rules', () => {
      const result = dataProcessor.categorizeData(employeeData, rules);
      
      expect(result.categorized).toHaveLength(2);
      expect(result.uncategorized).toHaveLength(2);
      expect(result.categories.Senior).toBe(0);
      expect(result.categories.Junior).toBe(2);
      expect(result.categories['Mid-level']).toBe(0);
    });

    test('should handle uncategorized data', () => {
      const limitedRules = [
        {
          category: 'Senior',
          condition: { age: '>=40' }
        }
      ];

      const result = dataProcessor.categorizeData(employeeData, limitedRules);
      
      expect(result.categorized.length).toBeLessThan(employeeData.length);
      expect(result.uncategorized.length).toBeGreaterThan(0);
    });
  });

  describe('Data filtering', () => {
    const testData = [
      { name: 'John', age: 25, salary: 50000, department: 'Engineering' },
      { name: 'Jane', age: 35, salary: 80000, department: 'Marketing' },
      { name: 'Bob', age: 45, salary: 120000, department: 'Engineering' },
      { name: 'Alice', age: 28, salary: 60000, department: 'Sales' }
    ];

    test('should filter by simple criteria', () => {
      const criteria = { department: 'Engineering' };
      const result = dataProcessor.filterData(testData, criteria);
      
      expect(result).toHaveLength(2);
      expect(result.every(item => item.department === 'Engineering')).toBe(true);
    });

    test('should filter by range criteria', () => {
      const criteria = { 
        age: { min: 30, max: 40 },
        salary: { min: 70000 }
      };
      const result = dataProcessor.filterData(testData, criteria);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane');
    });

    test('should filter by array criteria', () => {
      const criteria = { department: ['Engineering', 'Sales'] };
      const result = dataProcessor.filterData(testData, criteria);
      
      expect(result).toHaveLength(3);
      expect(result.every(item => ['Engineering', 'Sales'].includes(item.department))).toBe(true);
    });
  });

  describe('Data aggregation', () => {
    const salesData = [
      { region: 'North', product: 'A', sales: 1000 },
      { region: 'North', product: 'B', sales: 1500 },
      { region: 'South', product: 'A', sales: 800 },
      { region: 'South', product: 'B', sales: 1200 }
    ];

    test('should aggregate data by grouping', () => {
      const aggregations = [
        { field: 'sales', operation: 'sum' },
        { field: 'sales', operation: 'avg' },
        { field: 'product', operation: 'count' }
      ];

      const result = dataProcessor.aggregateData(salesData, 'region', aggregations);
      
      expect(result).toHaveLength(2);
      
      const northRegion = result.find(r => r.region === 'North');
      expect(northRegion.sales_sum).toBe(2500);
      expect(northRegion.sales_avg).toBe(1250);
      expect(northRegion.product_count).toBe(2);
    });
  });

  describe('Data export', () => {
    const testData = [
      { name: 'John', age: 25 },
      { name: 'Jane', age: 30 }
    ];

    test('should export to JSON format', () => {
      const result = dataProcessor.exportData(testData, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(testData);
    });

    test('should export to CSV format', () => {
      const result = dataProcessor.exportData(testData, 'csv');
      
      expect(result).toContain('name,age');
      expect(result).toContain('John,25');
      expect(result).toContain('Jane,30');
    });

    test('should handle empty data', () => {
      expect(() => dataProcessor.exportData([], 'json')).toThrow('Data array cannot be empty');
    });

    test('should throw error for unsupported format', () => {
      expect(() => dataProcessor.exportData(testData, 'xml'))
        .toThrow('Unsupported export format: xml');
    });
  });
});
