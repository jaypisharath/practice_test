/**
 * File Processor Module
 * Handles file I/O operations for CSV, JSON, and directory listing
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class FileProcessor {
  constructor(options = {}) {
    this.encoding = options.encoding || 'utf8';
    this.logging = options.logging || false;
  }

  /**
   * Log operations for debugging
   */
  log(message, data = null) {
    if (this.logging) {
      console.log(`[FileProcessor] ${message}`, data || '');
    }
  }

  /**
   * Validate file path for security
   */
  sanitizePath(filePath) {
    // Remove any path traversal attempts
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('Invalid file path: path traversal not allowed');
    }
    return normalizedPath;
  }

  /**
   * Check if file exists and is accessible
   */
  async validateFile(filePath, operation = 'read') {
    const sanitizedPath = this.sanitizePath(filePath);
    
    try {
      const stats = await fs.stat(sanitizedPath);
      
      if (operation === 'read' && !stats.isFile()) {
        throw new Error('Path is not a file');
      }
      
      if (operation === 'write' && stats.isDirectory()) {
        throw new Error('Cannot write to directory');
      }

      return {
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * Read JSON file
   */
  async readJSON(filePath) {
    const sanitizedPath = this.sanitizePath(filePath);
    this.log(`Reading JSON file: ${sanitizedPath}`);
    
    try {
      const data = await fs.readFile(sanitizedPath, this.encoding);
      const jsonData = JSON.parse(data);
      this.log(`Successfully read JSON file with ${Array.isArray(jsonData) ? jsonData.length : 'object'} items`);
      return jsonData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in file: ${error.message}`);
      }
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  /**
   * Write JSON file
   */
  async writeJSON(filePath, data, options = {}) {
    const sanitizedPath = this.sanitizePath(filePath);
    this.log(`Writing JSON file: ${sanitizedPath}`);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(sanitizedPath);
      await fs.mkdir(dir, { recursive: true });
      
      const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
      await fs.writeFile(sanitizedPath, jsonString, this.encoding);
      this.log(`Successfully wrote JSON file`);
      return { success: true, path: sanitizedPath, size: jsonString.length };
    } catch (error) {
      throw new Error(`Failed to write JSON file: ${error.message}`);
    }
  }

  /**
   * Read CSV file
   */
  async readCSV(filePath) {
    const sanitizedPath = this.sanitizePath(filePath);
    this.log(`Reading CSV file: ${sanitizedPath}`);
    
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = fsSync.createReadStream(sanitizedPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.log(`Successfully read CSV file with ${results.length} rows`);
          resolve(results);
        })
        .on('error', (error) => {
          reject(new Error(`Failed to read CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Write CSV file
   */
  async writeCSV(filePath, data, options = {}) {
    const sanitizedPath = this.sanitizePath(filePath);
    this.log(`Writing CSV file: ${sanitizedPath}`);
    
    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('CSV data must be a non-empty array');
      }

      // Ensure directory exists
      const dir = path.dirname(sanitizedPath);
      await fs.mkdir(dir, { recursive: true });

      // Extract headers from first object
      const headers = options.headers || Object.keys(data[0]);
      
      const csvWriter = createCsvWriter({
        path: sanitizedPath,
        header: headers.map(h => ({ id: h, title: h }))
      });

      await csvWriter.writeRecords(data);
      this.log(`Successfully wrote CSV file with ${data.length} rows`);
      return { success: true, path: sanitizedPath, rows: data.length };
    } catch (error) {
      throw new Error(`Failed to write CSV file: ${error.message}`);
    }
  }

  /**
   * List files and directories
   */
  async listFiles(dirPath, options = {}) {
    const sanitizedPath = this.sanitizePath(dirPath);
    this.log(`Listing files in: ${sanitizedPath}`);
    
    try {
      const items = await fs.readdir(sanitizedPath, { withFileTypes: true });
      const results = [];

      for (const item of items) {
        const fullPath = path.join(sanitizedPath, item.name);
        const stats = await fs.stat(fullPath);
        
        const fileInfo = {
          name: item.name,
          path: fullPath,
          isFile: item.isFile(),
          isDirectory: item.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime
        };

        // Apply filters
        if (options.extension && item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (ext !== options.extension.toLowerCase()) {
            continue;
          }
        }

        if (options.minSize && stats.size < options.minSize) {
          continue;
        }

        if (options.maxSize && stats.size > options.maxSize) {
          continue;
        }

        if (options.since && stats.mtime < new Date(options.since)) {
          continue;
        }

        results.push(fileInfo);
      }

      // Sort results
      if (options.sortBy) {
        results.sort((a, b) => {
          const aVal = a[options.sortBy];
          const bVal = b[options.sortBy];
          return options.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
      }

      this.log(`Found ${results.length} items`);
      return results;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Recursive directory traversal
   */
  async listFilesRecursive(dirPath, options = {}) {
    const sanitizedPath = this.sanitizePath(dirPath);
    this.log(`Recursively listing files in: ${sanitizedPath}`);
    
    const results = [];
    
    async function traverse(currentPath, depth = 0) {
      if (options.maxDepth && depth > options.maxDepth) {
        return;
      }

      try {
        const items = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(currentPath, item.name);
          const stats = await fs.stat(fullPath);
          
          const fileInfo = {
            name: item.name,
            path: fullPath,
            relativePath: path.relative(sanitizedPath, fullPath),
            isFile: item.isFile(),
            isDirectory: item.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
            depth
          };

          // Apply filters
          if (options.extension && item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (ext !== options.extension.toLowerCase()) {
              continue;
            }
          }

          if (options.minSize && stats.size < options.minSize) {
            continue;
          }

          if (options.maxSize && stats.size > options.maxSize) {
            continue;
          }

          if (options.since && stats.mtime < new Date(options.since)) {
            continue;
          }

          results.push(fileInfo);

          // Recursively traverse directories
          if (item.isDirectory() && !options.skipDirectories) {
            await traverse(fullPath, depth + 1);
          }
        }
      } catch (error) {
        if (options.ignoreErrors) {
          console.warn(`Warning: Could not read directory ${currentPath}: ${error.message}`);
        } else {
          throw error;
        }
      }
    }

    await traverse(sanitizedPath);
    this.log(`Found ${results.length} items recursively`);
    return results;
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    const sanitizedPath = this.sanitizePath(filePath);
    return this.validateFile(sanitizedPath);
  }
}

module.exports = FileProcessor;
