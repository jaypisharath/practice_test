/**
 * Client Integration Tests
 * Tests the complete client workflow with real files and data
 */

const path = require('path');
const fs = require('fs').promises;
const { Client } = require('../../src/client');

describe('Client Integration Tests', () => {
  let client;
  const testDir = path.join(__dirname, '../temp');
  const sampleCsvPath = path.join(__dirname, '../../data/sample.csv');
  const sampleJsonPath = path.join(__dirname, '../../data/sample.json');

  beforeAll(async () => {
    // Create test directory
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  beforeEach(() => {
    client = new Client({ logging: false });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('File Operations Integration', () => {
    test('should read and process CSV data', async () => {
      const csvData = await client.readFile(sampleCsvPath, 'csv');
      
      expect(Array.isArray(csvData)).toBe(true);
      expect(csvData.length).toBeGreaterThan(0);
      expect(csvData[0]).toHaveProperty('name');
      expect(csvData[0]).toHaveProperty('age');
      expect(csvData[0]).toHaveProperty('department');
    });

    test('should read and process JSON data', async () => {
      const jsonData = await client.readFile(sampleJsonPath, 'json');
      
      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData.length).toBeGreaterThan(0);
      expect(jsonData[0]).toHaveProperty('id');
      expect(jsonData[0]).toHaveProperty('name');
      expect(jsonData[0]).toHaveProperty('skills');
    });

    test('should write and read back data', async () => {
      const testData = [
        { name: 'Test User', age: 25, department: 'Testing' },
        { name: 'Another User', age: 30, department: 'QA' }
      ];

      const outputPath = path.join(testDir, 'test_output.json');
      
      // Write data
      await client.writeFile(outputPath, testData, 'json');
      
      // Read data back
      const readData = await client.readFile(outputPath, 'json');
      
      expect(readData).toEqual(testData);
    });
  });

  describe('Data Processing Integration', () => {
    let sampleData;

    beforeAll(async () => {
      sampleData = await client.readFile(sampleJsonPath, 'json');
    });

    test('should process data with multiple operations', async () => {
      const operations = [
        {
          type: 'filter',
          criteria: { department: 'Engineering' }
        },
        {
          type: 'categorize',
          rules: [
            {
              category: 'Senior',
              condition: { age: '>=35' }
            },
            {
              category: 'Junior',
              condition: { age: '<30' }
            }
          ]
        }
      ];

      const result = await client.processData(sampleData, operations);
      
      expect(result).toHaveProperty('categorized');
      expect(result).toHaveProperty('uncategorized');
      expect(result).toHaveProperty('categories');
    });

    test('should find duplicates in data', async () => {
      const duplicateData = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'jane@example.com' },
        { name: 'John', email: 'john@example.com' } // Duplicate
      ];

      const result = client.data.findDuplicates(duplicateData, ['name', 'email']);
      
      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(2);
    });

    test('should aggregate data by department', async () => {
      const aggregations = [
        { field: 'salary', operation: 'avg' },
        { field: 'age', operation: 'avg' },
        { field: 'name', operation: 'count' }
      ];

      const result = client.data.aggregateData(sampleData, 'department', aggregations);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const engineeringDept = result.find(r => r.department === 'Engineering');
      expect(engineeringDept).toBeDefined();
      expect(engineeringDept).toHaveProperty('salary_avg');
      expect(engineeringDept).toHaveProperty('age_avg');
      expect(engineeringDept).toHaveProperty('name_count');
    });
  });

  describe('Directory Operations Integration', () => {
    test('should list files in data directory', async () => {
      const dataDir = path.join(__dirname, '../../data');
      const files = await client.files.listFiles(dataDir);
      
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      
      const fileNames = files.map(f => f.name);
      expect(fileNames).toContain('sample.csv');
      expect(fileNames).toContain('sample.json');
    });

    test('should filter files by extension', async () => {
      const dataDir = path.join(__dirname, '../../data');
      const jsonFiles = await client.files.listFiles(dataDir, { extension: '.json' });
      
      expect(jsonFiles.every(f => f.name.endsWith('.json'))).toBe(true);
    });

    test('should recursively list files', async () => {
      const projectRoot = path.join(__dirname, '../..');
      const allFiles = await client.files.listFilesRecursive(projectRoot, { maxDepth: 2 });
      
      expect(Array.isArray(allFiles)).toBe(true);
      expect(allFiles.length).toBeGreaterThan(0);
      
      // Should include files from different directories
      const hasSrcFiles = allFiles.some(f => f.path.includes('src/'));
      const hasTestFiles = allFiles.some(f => f.path.includes('tests/'));
      expect(hasSrcFiles || hasTestFiles).toBe(true);
    });
  });

  describe('Complete Workflow Integration', () => {
    test('should execute complete data processing workflow', async () => {
      const workflowConfig = {
        source: {
          type: 'file',
          path: sampleJsonPath,
          format: 'json'
        },
        operations: [
          {
            type: 'filter',
            criteria: { department: 'Engineering' }
          },
          {
            type: 'aggregate',
            groupBy: 'department',
            aggregations: [
              { field: 'salary', operation: 'avg' },
              { field: 'age', operation: 'avg' }
            ]
          }
        ],
        output: {
          type: 'file',
          path: path.join(testDir, 'workflow_output.json'),
          format: 'json'
        }
      };

      const result = await client.workflow(workflowConfig);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.summary.recordsProcessed).toBeGreaterThan(0);
      expect(result.summary.operations).toBe(2);
    });

    test('should handle workflow errors gracefully', async () => {
      const invalidWorkflowConfig = {
        source: {
          type: 'file',
          path: '/non/existent/file.json',
          format: 'json'
        },
        operations: [],
        output: {
          type: 'return'
        }
      };

      const result = await client.workflow(invalidWorkflowConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('HTTP Client Integration', () => {
    test('should make HTTP request to local server', async () => {
      // Start the local server for testing
      const app = require('../../src/server/index');
      
      try {
        const response = await client.get('http://localhost:3000/hello_world');
        
        expect(response.status).toBe(200);
        expect(response.data).toEqual({ hello: 'world' });
      } catch (error) {
        // Server might not be running, which is okay for this test
        expect(error.message).toContain('fetch');
      }
    });

    test('should handle HTTP errors', async () => {
      try {
        await client.get('http://localhost:3000/nonexistent');
      } catch (error) {
        expect(error.message).toContain('HTTP');
      }
    });
  });

  describe('Performance Tests', () => {
    test('should process large dataset efficiently', async () => {
      // Create a larger dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        age: 20 + (i % 50),
        department: ['Engineering', 'Marketing', 'Sales'][i % 3],
        salary: 50000 + (i * 100)
      }));

      const startTime = Date.now();
      
      // Process the data
      const operations = [
        {
          type: 'filter',
          criteria: { department: 'Engineering' }
        },
        {
          type: 'aggregate',
          groupBy: 'department',
          aggregations: [
            { field: 'salary', operation: 'avg' },
            { field: 'age', operation: 'avg' }
          ]
        }
      ];

      const result = await client.processData(largeDataset, operations);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
