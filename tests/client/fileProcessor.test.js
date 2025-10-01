/**
 * File Processor Tests
 */

const fs = require('fs').promises;
const path = require('path');
const FileProcessor = require('../../src/client/fileProcessor');

describe('FileProcessor', () => {
  let fileProcessor;
  const testDir = path.join(__dirname, '../temp');
  const testFile = path.join(testDir, 'test.json');
  const testCsvFile = path.join(testDir, 'test.csv');

  beforeAll(async () => {
    // Create test directory
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  beforeEach(() => {
    fileProcessor = new FileProcessor({ logging: false });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const processor = new FileProcessor();
      expect(processor.encoding).toBe('utf8');
      expect(processor.logging).toBe(false);
    });

    test('should initialize with custom options', () => {
      const processor = new FileProcessor({
        encoding: 'ascii',
        logging: true
      });
      expect(processor.encoding).toBe('ascii');
      expect(processor.logging).toBe(true);
    });
  });

  describe('Path sanitization', () => {
    test('should sanitize normal paths', () => {
      const result = fileProcessor.sanitizePath('/valid/path/file.txt');
      expect(result).toBe('/valid/path/file.txt');
    });

    test('should reject path traversal attempts', () => {
      expect(() => {
        fileProcessor.sanitizePath('../../../etc/passwd');
      }).toThrow('Invalid file path: path traversal not allowed');
    });
  });

  describe('File validation', () => {
    test('should validate existing file', async () => {
      // Create a test file
      await fs.writeFile(testFile, '{"test": "data"}');
      
      const result = await fileProcessor.validateFile(testFile);
      expect(result.exists).toBe(true);
      expect(result.isFile).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });

    test('should handle non-existent file', async () => {
      const result = await fileProcessor.validateFile('/non/existent/file.txt');
      expect(result.exists).toBe(false);
    });
  });

  describe('JSON operations', () => {
    test('should read JSON file', async () => {
      const testData = { name: 'Test', value: 123 };
      await fs.writeFile(testFile, JSON.stringify(testData));
      
      const result = await fileProcessor.readJSON(testFile);
      expect(result).toEqual(testData);
    });

    test('should write JSON file', async () => {
      const testData = { name: 'Test', value: 456 };
      
      const result = await fileProcessor.writeJSON(testFile, testData);
      expect(result.success).toBe(true);
      expect(result.path).toBe(testFile);
      
      // Verify file was written correctly
      const content = await fs.readFile(testFile, 'utf8');
      expect(JSON.parse(content)).toEqual(testData);
    });

    test('should write pretty JSON', async () => {
      const testData = { name: 'Test', value: 789 };
      
      await fileProcessor.writeJSON(testFile, testData, { pretty: true });
      
      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toContain('\n');
      expect(JSON.parse(content)).toEqual(testData);
    });

    test('should handle invalid JSON', async () => {
      await fs.writeFile(testFile, 'invalid json content');
      
      await expect(fileProcessor.readJSON(testFile))
        .rejects.toThrow('Invalid JSON format');
    });
  });

  describe('CSV operations', () => {
    test('should read CSV file', async () => {
      const csvContent = 'name,age\nJohn,25\nJane,30';
      await fs.writeFile(testCsvFile, csvContent);
      
      const result = await fileProcessor.readCSV(testCsvFile);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'John', age: '25' });
      expect(result[1]).toEqual({ name: 'Jane', age: '30' });
    });

    test('should write CSV file', async () => {
      const testData = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 30 }
      ];
      
      const result = await fileProcessor.writeCSV(testCsvFile, testData);
      expect(result.success).toBe(true);
      expect(result.rows).toBe(2);
      
      // Verify file was written correctly
      const content = await fs.readFile(testCsvFile, 'utf8');
      expect(content).toContain('name,age');
      expect(content).toContain('John,25');
      expect(content).toContain('Jane,30');
    });

    test('should handle empty CSV data', async () => {
      await expect(fileProcessor.writeCSV(testCsvFile, []))
        .rejects.toThrow('CSV data must be a non-empty array');
    });
  });

  describe('Directory listing', () => {
    test('should list files in directory', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.json'), '{"test": "data"}');
      
      const result = await fileProcessor.listFiles(testDir);
      
      expect(result.length).toBeGreaterThanOrEqual(2);
      const fileNames = result.map(f => f.name);
      expect(fileNames).toContain('file1.txt');
      expect(fileNames).toContain('file2.json');
    });

    test('should filter files by extension', async () => {
      const result = await fileProcessor.listFiles(testDir, { extension: '.json' });
      
      expect(result.every(f => f.name.endsWith('.json'))).toBe(true);
    });

    test('should filter files by size', async () => {
      const result = await fileProcessor.listFiles(testDir, { minSize: 10 });
      
      expect(result.every(f => f.size >= 10)).toBe(true);
    });

    test('should sort files', async () => {
      const result = await fileProcessor.listFiles(testDir, { 
        sortBy: 'size', 
        sortOrder: 'desc' 
      });
      
      for (let i = 1; i < result.length; i++) {
        expect(result[i-1].size).toBeGreaterThanOrEqual(result[i].size);
      }
    });
  });

  describe('Recursive directory listing', () => {
    test('should list files recursively', async () => {
      // Create nested directory structure
      const subDir = path.join(testDir, 'subdir');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(path.join(subDir, 'nested.txt'), 'nested content');
      
      const result = await fileProcessor.listFilesRecursive(testDir);
      
      expect(result.length).toBeGreaterThan(0);
      const hasNestedFile = result.some(f => f.name === 'nested.txt');
      expect(hasNestedFile).toBe(true);
    });

    test('should respect max depth', async () => {
      const result = await fileProcessor.listFilesRecursive(testDir, { maxDepth: 0 });
      
      // Should only include files in the root directory (depth 0)
      const hasDepthZero = result.some(f => f.depth === 0);
      expect(hasDepthZero).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle file read errors', async () => {
      await expect(fileProcessor.readJSON('/non/existent/file.json'))
        .rejects.toThrow('Failed to read JSON file');
    });

    test('should handle directory listing errors', async () => {
      await expect(fileProcessor.listFiles('/non/existent/directory'))
        .rejects.toThrow('Failed to list files');
    });
  });
});
