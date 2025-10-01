/**
 * Client Library Demo
 * Demonstrates the capabilities of the client library
 */

const { Client } = require('../src/client');
const path = require('path');

async function runDemo() {
  console.log('🚀 Starting Client Library Demo\n');

  // Initialize client with logging enabled
  const client = new Client({ logging: true });

  try {
    // Demo 1: File Operations
    console.log('📁 Demo 1: File Operations');
    console.log('========================');
    
    const sampleJsonPath = path.join(__dirname, '../data/sample.json');
    const sampleCsvPath = path.join(__dirname, '../data/sample.csv');
    
    // Read JSON data
    console.log('\nReading JSON data...');
    const jsonData = await client.readFile(sampleJsonPath, 'json');
    console.log(`✅ Loaded ${jsonData.length} JSON records`);
    
    // Read CSV data
    console.log('\nReading CSV data...');
    const csvData = await client.readFile(sampleCsvPath, 'csv');
    console.log(`✅ Loaded ${csvData.length} CSV records`);
    
    // List files in data directory
    console.log('\nListing files in data directory...');
    const files = await client.files.listFiles(path.join(__dirname, '../data'));
    console.log(`✅ Found ${files.length} files:`);
    files.forEach(file => {
      console.log(`   - ${file.name} (${file.size} bytes)`);
    });

    // Demo 2: Data Processing
    console.log('\n\n🔍 Demo 2: Data Processing');
    console.log('==========================');
    
    // Find duplicates
    console.log('\nFinding duplicates...');
    const duplicates = client.data.findDuplicates(jsonData, ['name']);
    console.log(`✅ Found ${duplicates.summary.duplicates} duplicates`);
    
    // Filter data
    console.log('\nFiltering Engineering employees...');
    const engineeringEmployees = client.data.filterData(jsonData, { 
      department: 'Engineering' 
    });
    console.log(`✅ Found ${engineeringEmployees.length} Engineering employees`);
    
    // Categorize data
    console.log('\nCategorizing employees by age...');
    const categorized = client.data.categorizeData(jsonData, [
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
    ]);
    console.log('✅ Categorization results:');
    Object.entries(categorized.categories).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} employees`);
    });
    
    // Aggregate data
    console.log('\nAggregating salary by department...');
    const aggregated = client.data.aggregateData(jsonData, 'department', [
      { field: 'salary', operation: 'avg' },
      { field: 'age', operation: 'avg' },
      { field: 'name', operation: 'count' }
    ]);
    console.log('✅ Department averages:');
    aggregated.forEach(dept => {
      console.log(`   - ${dept.department}: $${Math.round(dept.salary_avg)} avg salary, ${Math.round(dept.age_avg)} avg age, ${dept.name_count} employees`);
    });

    // Demo 3: Complete Workflow
    console.log('\n\n⚡ Demo 3: Complete Workflow');
    console.log('===========================');
    
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
            { field: 'performance_score', operation: 'avg' }
          ]
        }
      ],
      output: {
        type: 'return'
      }
    };
    
    console.log('\nExecuting complete workflow...');
    const workflowResult = await client.workflow(workflowConfig);
    
    if (workflowResult.success) {
      console.log('✅ Workflow completed successfully!');
      console.log(`   - Processed ${workflowResult.summary.recordsProcessed} records`);
      console.log(`   - Applied ${workflowResult.summary.operations} operations`);
      console.log('   - Result:', workflowResult.data);
    } else {
      console.log('❌ Workflow failed:', workflowResult.error);
    }

    // Demo 4: HTTP Client (if server is running)
    console.log('\n\n🌐 Demo 4: HTTP Client');
    console.log('======================');
    
    try {
      console.log('\nTesting HTTP client with local server...');
      const response = await client.get('http://localhost:3000/hello_world');
      console.log('✅ HTTP request successful!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.log('⚠️  HTTP client test skipped (server not running)');
      console.log(`   - Error: ${error.message}`);
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nThe client library provides:');
    console.log('✅ HTTP request capabilities with retry logic');
    console.log('✅ File I/O operations for CSV and JSON');
    console.log('✅ Directory listing and file filtering');
    console.log('✅ Data processing and pattern extraction');
    console.log('✅ Complete workflow automation');
    console.log('✅ Comprehensive error handling');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };
