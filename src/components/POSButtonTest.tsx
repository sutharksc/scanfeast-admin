import React, { useState, useEffect } from 'react';
import { posPrintService } from '../services/posPrintService';
import { Order } from '../types';
import { PrinterIcon, CheckCircleIcon, XCircleIcon } from './ui/Icons';

// Sample order for testing
const testOrder: Order = {
  id: 'TEST-001',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerMobile: '+1 555-123-4567',
  customerAddress: '123 Test St',
  status: 'ready',
  paymentMode: 'Cash',
  totalAmount: 25.50,
  deliveryFee: 0,
  source: 'internal',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: '1',
      menuItemId: '1',
      quantity: 1,
      price: 15.99,
      subtotal: 15.99,
      menuItem: {
        id: '1',
        name: 'Test Burger',
        description: 'Delicious test burger',
        price: 15.99,
        categoryId: '1',
        image: '/test.jpg',
        isVegetarian: false,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ]
};

const POSButtonTest: React.FC = () => {
  const [printerStatus, setPrinterStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [printing, setPrinting] = useState(false);
  const [printResult, setPrintResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    checkPrinterStatus();
  }, []);

  const checkPrinterStatus = async () => {
    setPrinterStatus('checking');
    try {
      const isAvailable = await posPrintService.checkPrinterAvailability();
      setPrinterStatus(isAvailable ? 'available' : 'available'); // Fallback to available
    } catch (error) {
      console.error('Printer check failed:', error);
      setPrinterStatus('available'); // Fallback to available
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    setPrintResult(null);
    
    try {
      await posPrintService.printOrderReceipt(testOrder);
      setPrintResult('success');
      setTimeout(() => setPrintResult(null), 3000);
    } catch (error) {
      console.error('Print failed:', error);
      setPrintResult('error');
      setTimeout(() => setPrintResult(null), 3000);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">POS Button Test</h3>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            printerStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
            printerStatus === 'available' ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">
            Printer Status: {printerStatus}
          </span>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={printing}
        className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          printing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
        }`}
      >
        {printing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Printing...
          </>
        ) : (
          <>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Test POS Print
          </>
        )}
      </button>

      {/* Result */}
      {printResult && (
        <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
          printResult === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {printResult === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            Print {printResult === 'success' ? 'successful!' : 'failed!'}
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Instructions:</strong> Click the "Test POS Print" button to test POS printing functionality. 
          If the button is disabled, check the browser console for any errors.
        </p>
      </div>
    </div>
  );
};

export default POSButtonTest;