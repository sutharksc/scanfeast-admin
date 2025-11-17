import React from 'react';
import { pdfExportService, createBarChartData, createDoughnutChartData } from '../services/pdfExportService';

const PDFExportTest: React.FC = () => {
  const handleTestPDF = async () => {
    try {
      const testData = {
        title: 'Test PDF Report',
        subtitle: 'This is a test PDF to verify the export functionality',
        dateRange: 'Test Period',
        stats: [
          { label: 'Test Stat 1', value: 100, description: 'Test description' },
          { label: 'Test Stat 2', value: '$250.50', description: 'Test description' },
          { label: 'Test Stat 3', value: 25, description: 'Test description' },
          { label: 'Test Stat 4', value: 'High', description: 'Test description' }
        ],
        charts: [
          {
            ...createBarChartData(
              ['Item A', 'Item B', 'Item C', 'Item D'],
              [10, 20, 15, 25],
              'Test Data',
              '#FF6B6B'
            ),
            title: 'Test Bar Chart'
          },
          {
            ...createDoughnutChartData(
              ['Category 1', 'Category 2', 'Category 3'],
              [30, 45, 25],
              ['#FF6B6B', '#4ECDC4', '#45B7D1']
            ),
            title: 'Test Doughnut Chart'
          }
        ],
        tables: [
          {
            title: 'Test Table',
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
              ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
              ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
              ['Row 3 Col 1', 'Row 3 Col 2', 'Row 3 Col 3']
            ]
          }
        ],
        summary: 'This is a test summary to verify that the PDF export functionality is working correctly with charts, tables, and statistics.'
      };

      await pdfExportService.generatePDF(testData);
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Test PDF export failed:', error);
      alert('PDF export failed. Check console for details.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">PDF Export Test</h3>
      <p className="text-gray-600 mb-4">
        Click the button below to test the PDF export functionality. This will generate a sample PDF with charts, tables, and statistics.
      </p>
      <button
        onClick={handleTestPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Test PDF Export
      </button>
    </div>
  );
};

export default PDFExportTest;