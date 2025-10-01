/**
 * Workflow Demo
 * Demonstrates advanced workflow capabilities
 */

const { Client } = require('../src/client');
const path = require('path');

async function runWorkflowDemo() {
  console.log('⚡ Starting Workflow Demo\n');

  const client = new Client({ logging: true });

  try {
    // Create output directory
    const outputDir = path.join(__dirname, '../output');
    const fs = require('fs').promises;
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Workflow 1: Employee Analysis
    console.log('👥 Workflow 1: Employee Analysis');
    console.log('================================');
    
    const employeeAnalysisConfig = {
      source: {
        type: 'file',
        path: path.join(__dirname, '../data/sample.json'),
        format: 'json'
      },
      operations: [
        {
          type: 'filter',
          criteria: { active: true }
        },
        {
          type: 'categorize',
          rules: [
            {
              category: 'High Performer',
              condition: { performance_score: '>=9.0' }
            },
            {
              category: 'Good Performer',
              condition: { performance_score: '>=8.0' }
            },
            {
              category: 'Average Performer',
              condition: { performance_score: '>=7.0' }
            },
            {
              category: 'Needs Improvement',
              condition: { performance_score: '<7.0' }
            }
          ]
        },
        {
          type: 'aggregate',
          groupBy: 'category',
          aggregations: [
            { field: 'salary', operation: 'avg' },
            { field: 'age', operation: 'avg' },
            { field: 'performance_score', operation: 'avg' }
          ]
        }
      ],
      output: {
        type: 'file',
        path: path.join(outputDir, 'employee_analysis.json'),
        format: 'json',
        options: { pretty: true }
      }
    };

    const employeeResult = await client.workflow(employeeAnalysisConfig);
    if (employeeResult.success) {
      console.log('✅ Employee analysis completed');
      console.log(`   - Output: ${employeeResult.summary.recordsProcessed} records`);
    }

    // Workflow 2: Department Salary Report
    console.log('\n💰 Workflow 2: Department Salary Report');
    console.log('=======================================');
    
    const salaryReportConfig = {
      source: {
        type: 'file',
        path: path.join(__dirname, '../data/sample.json'),
        format: 'json'
      },
      operations: [
        {
          type: 'aggregate',
          groupBy: 'department',
          aggregations: [
            { field: 'salary', operation: 'avg' },
            { field: 'salary', operation: 'min' },
            { field: 'salary', operation: 'max' },
            { field: 'age', operation: 'avg' },
            { field: 'name', operation: 'count' }
          ]
        }
      ],
      output: {
        type: 'file',
        path: path.join(outputDir, 'department_salary_report.csv'),
        format: 'csv'
      }
    };

    const salaryResult = await client.workflow(salaryReportConfig);
    if (salaryResult.success) {
      console.log('✅ Salary report completed');
      console.log(`   - Output: ${salaryResult.summary.recordsProcessed} records`);
    }

    // Workflow 3: Skills Analysis
    console.log('\n🛠️  Workflow 3: Skills Analysis');
    console.log('===============================');
    
    // First, let's flatten the skills data
    const skillsData = await client.readFile(path.join(__dirname, '../data/sample.json'), 'json');
    
    // Flatten skills into individual records
    const flattenedSkills = [];
    skillsData.forEach(employee => {
      if (employee.skills && Array.isArray(employee.skills)) {
        employee.skills.forEach(skill => {
          flattenedSkills.push({
            employee_name: employee.name,
            department: employee.department,
            skill: skill,
            salary: employee.salary,
            performance_score: employee.performance_score
          });
        });
      }
    });

    // Write flattened data
    const flattenedPath = path.join(outputDir, 'flattened_skills.json');
    await client.writeFile(flattenedPath, flattenedSkills, 'json');

    const skillsAnalysisConfig = {
      source: {
        type: 'file',
        path: flattenedPath,
        format: 'json'
      },
      operations: [
        {
          type: 'aggregate',
          groupBy: 'skill',
          aggregations: [
            { field: 'salary', operation: 'avg' },
            { field: 'performance_score', operation: 'avg' },
            { field: 'employee_name', operation: 'count' }
          ]
        }
      ],
      output: {
        type: 'file',
        path: path.join(outputDir, 'skills_analysis.json'),
        format: 'json',
        options: { pretty: true }
      }
    };

    const skillsResult = await client.workflow(skillsAnalysisConfig);
    if (skillsResult.success) {
      console.log('✅ Skills analysis completed');
      console.log(`   - Output: ${skillsResult.summary.recordsProcessed} records`);
    }

    // Workflow 4: Data Quality Check
    console.log('\n🔍 Workflow 4: Data Quality Check');
    console.log('==================================');
    
    const qualityCheckConfig = {
      source: {
        type: 'file',
        path: path.join(__dirname, '../data/sample.json'),
        format: 'json'
      },
      operations: [
        {
          type: 'findDuplicates',
          keyFields: ['name']
        }
      ],
      output: {
        type: 'file',
        path: path.join(outputDir, 'data_quality_report.json'),
        format: 'json',
        options: { pretty: true }
      }
    };

    const qualityResult = await client.workflow(qualityCheckConfig);
    if (qualityResult.success) {
      console.log('✅ Data quality check completed');
      console.log(`   - Output: ${qualityResult.summary.recordsProcessed} records`);
    }

    // Summary
    console.log('\n📊 Workflow Summary');
    console.log('===================');
    
    const outputFiles = await client.files.listFiles(outputDir);
    console.log(`✅ Generated ${outputFiles.length} output files:`);
    outputFiles.forEach(file => {
      console.log(`   - ${file.name} (${file.size} bytes)`);
    });

    console.log('\n🎉 All workflows completed successfully!');
    console.log('\nGenerated reports:');
    console.log('✅ Employee performance analysis');
    console.log('✅ Department salary report');
    console.log('✅ Skills analysis');
    console.log('✅ Data quality check');

  } catch (error) {
    console.error('❌ Workflow demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runWorkflowDemo();
}

module.exports = { runWorkflowDemo };
