# Practice Test Framework

A Node.js-based application framework with Express server, Jest testing, and client capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone or download the project
cd practice_test

# Install dependencies
npm install

# Start the server
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## 📡 API Endpoints

### GET /hello_world
Returns a simple hello world message.

**Request:**
```bash
curl http://localhost:3000/hello_world
```

**Response:**
```json
{
  "hello": "world"
}
```

## 🔧 Client Library

The framework includes a comprehensive client library for HTTP requests, file operations, and data processing.

### Quick Start

```javascript
const { Client } = require('./src/client');

// Initialize client
const client = new Client({ logging: true });

// Make HTTP requests
const response = await client.get('https://api.example.com/data');

// Read files
const csvData = await client.readFile('data/sample.csv', 'csv');
const jsonData = await client.readFile('data/sample.json', 'json');

// Process data
const processed = await client.processData(jsonData, [
  {
    type: 'filter',
    criteria: { department: 'Engineering' }
  },
  {
    type: 'aggregate',
    groupBy: 'department',
    aggregations: [
      { field: 'salary', operation: 'avg' }
    ]
  }
]);
```

### HTTP Client

```javascript
const { HttpClient } = require('./src/client');

const httpClient = new HttpClient({
  timeout: 10000,
  retries: 3,
  logging: true
});

// GET request
const response = await httpClient.get('https://api.example.com/users');

// POST request
const newUser = await httpClient.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updated = await httpClient.put('https://api.example.com/users/1', {
  name: 'John Smith'
});

// DELETE request
await httpClient.delete('https://api.example.com/users/1');
```

### File Operations

```javascript
const { FileProcessor } = require('./src/client');

const fileProcessor = new FileProcessor({ logging: true });

// Read JSON file
const jsonData = await fileProcessor.readJSON('data/sample.json');

// Write JSON file
await fileProcessor.writeJSON('output/processed.json', jsonData, { pretty: true });

// Read CSV file
const csvData = await fileProcessor.readCSV('data/sample.csv');

// Write CSV file
await fileProcessor.writeCSV('output/processed.csv', csvData);

// List files in directory
const files = await fileProcessor.listFiles('data/', { extension: '.json' });

// Recursive directory listing
const allFiles = await fileProcessor.listFilesRecursive('src/', { maxDepth: 3 });
```

### Data Processing

```javascript
const { DataProcessor } = require('./src/client');

const dataProcessor = new DataProcessor({ logging: true });

// Parse and validate data
const parsed = dataProcessor.parseJSONData(jsonData);

// Find duplicates
const duplicates = dataProcessor.findDuplicates(data, ['name', 'email']);

// Categorize data
const categorized = dataProcessor.categorizeData(data, [
  {
    category: 'Senior',
    condition: { age: '>=35', salary: '>=80000' }
  },
  {
    category: 'Junior',
    condition: { age: '<30' }
  }
]);

// Filter data
const filtered = dataProcessor.filterData(data, {
  department: 'Engineering',
  age: { min: 25, max: 40 }
});

// Aggregate data
const aggregated = dataProcessor.aggregateData(data, 'department', [
  { field: 'salary', operation: 'avg' },
  { field: 'age', operation: 'avg' }
]);

// Export data
const csvExport = dataProcessor.exportData(data, 'csv');
const jsonExport = dataProcessor.exportData(data, 'json', { pretty: true });
```

### Complete Workflow Example

```javascript
const { Client } = require('./src/client');

const client = new Client({ logging: true });

// Define workflow
const workflowConfig = {
  source: {
    type: 'file',
    path: 'data/employees.csv',
    format: 'csv'
  },
  operations: [
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
    },
    {
      type: 'aggregate',
      groupBy: 'category',
      aggregations: [
        { field: 'salary', operation: 'avg' },
        { field: 'performance_score', operation: 'avg' }
      ]
    }
  ],
  output: {
    type: 'file',
    path: 'output/engineering_analysis.json',
    format: 'json'
  }
};

// Execute workflow
const result = await client.workflow(workflowConfig);
console.log('Workflow completed:', result.summary);
```

## 🏗️ Project Structure

```
practice_test/
├── src/
│   ├── server/           # Express server and routes
│   ├── client/           # Client utilities (future)
│   └── utils/            # Shared utilities
├── tests/
│   ├── server/           # Server tests
│   ├── client/           # Client tests (future)
│   └── integration/      # Integration tests (future)
├── data/                 # Sample data files (future)
├── package.json          # Dependencies and scripts
├── jest.config.js        # Jest testing configuration
└── README.md            # This file
```

## 🛠️ Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🧪 Testing

This project uses Jest for testing with the following test files:

- `tests/basic.test.js` - Basic functionality tests
- `tests/server/hello.test.js` - API endpoint tests

### Test Coverage
The project aims for 80%+ test coverage. Run `npm run test:coverage` to see the current coverage report.

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
```

### Jest Configuration
Jest is configured in `jest.config.js` with:
- Node.js test environment
- Test file pattern matching
- Coverage collection settings

## 📈 Milestones

### ✅ Milestone 1: Basic Server & Testing Setup
- [x] Express server with configurable port
- [x] GET /hello_world endpoint
- [x] Jest testing framework
- [x] Basic and API tests
- [x] Project documentation

### 🔄 Milestone 2: Client Library Foundation (Next)
- [ ] HTTP client module
- [ ] File I/O capabilities
- [ ] Data processing functions
- [ ] Client tests

### 🔄 Milestone 3: Advanced Features (Future)
- [ ] Pattern extraction
- [ ] Error handling
- [ ] Performance optimization
- [ ] CI/CD setup

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed

## 📝 License

ISC
