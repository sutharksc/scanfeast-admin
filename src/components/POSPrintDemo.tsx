import React, { useState } from 'react';
import { posPrintService } from '../services/posPrintService';
import { Order } from '../types';
import { PrinterIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from './ui/Icons';

interface POSPrintDemoProps {
  order: Order;
}

const POSPrintDemo: React.FC<POSPrintDemoProps> = ({ order }) => {
  const [printing, setPrinting] = useState<'receipt' | 'kitchen' | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [lastPrintResult, setLastPrintResult] = useState<'success' | 'error' | null>(null);

  React.useEffect(() => {
    checkPrinterStatus();
  }, []);

  const checkPrinterStatus = async () => {
    setPrinterStatus('checking');
    try {
      const isAvailable = await posPrintService.checkPrinterAvailability();
      setPrinterStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Printer status check failed:', error);
      setPrinterStatus('unavailable');
    }
  };

  const handlePrintReceipt = async () => {
    if (!order) return;
    
    setPrinting('receipt');
    setLastPrintResult(null);
    
    try {
      await posPrintService.printOrderReceipt(order, {
        copies: 1,
        includeHeader: true,
        includeFooter: true,
        paperWidth: 80,
        fontSize: 12,
        printLogo: true
      });
      
      setLastPrintResult('success');
      setTimeout(() => setLastPrintResult(null), 3000);
    } catch (error) {
      console.error('Receipt printing failed:', error);
      setLastPrintResult('error');
      setTimeout(() => setLastPrintResult(null), 3000);
    } finally {
      setPrinting(null);
    }
  };

  const handlePrintKitchenTicket = async () => {
    if (!order) return;
    
    setPrinting('kitchen');
    setLastPrintResult(null);
    
    try {
      await posPrintService.printKitchenTicket(order, {
        copies: 1,
        paperWidth: 80,
        fontSize: 10
      });
      
      setLastPrintResult('success');
      setTimeout(() => setLastPrintResult(null), 3000);
    } catch (error) {
      console.error('Kitchen ticket printing failed:', error);
      setLastPrintResult('error');
      setTimeout(() => setLastPrintResult(null), 3000);
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <PrinterIcon className="w-5 h-5 mr-2 text-orange-500" />
        POS Printing Demo
      </h3>
      
      {/* Printer Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              printerStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
              printerStatus === 'available' ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              Printer Status: {printerStatus === 'checking' ? 'Checking...' : 
                            printerStatus === 'available' ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <button
            onClick={checkPrinterStatus}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Print Result */}
      {lastPrintResult && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          lastPrintResult === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {lastPrintResult === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <XCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {lastPrintResult === 'success' ? 'Print successful!' : 'Print failed!'}
          </span>
        </div>
      )}

      {/* Print Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handlePrintReceipt}
          disabled={printing !== null || printerStatus !== 'available'}
          className={`flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            printing === 'receipt'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : printerStatus === 'available'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {printing === 'receipt' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Printing Receipt...
            </>
          ) : (
            <>
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print Receipt
            </>
          )}
        </button>

        <button
          onClick={handlePrintKitchenTicket}
          disabled={printing !== null || printerStatus !== 'available'}
          className={`flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            printing === 'kitchen'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : printerStatus === 'available'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {printing === 'kitchen' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Printing KOT...
            </>
          ) : (
            <>
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Print KOT
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> This demo uses browser print API. In production, you would connect to actual POS thermal printers for automatic printing.
        </p>
      </div>
    </div>
  );
};

export default POSPrintDemo;