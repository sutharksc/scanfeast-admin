import React, { useState, useEffect } from 'react';
import { Order, ORDER_STATUS } from '../types';
import { posPrintService } from '../services/posPrintService';
import { advancedPOSService } from '../services/advancedPOSService';
import { 
  PrinterIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  ReceiptIcon,
  DocumentTextIcon
} from './ui/Icons';

// Sample order for testing
const sampleOrder: Order = {
  id: 'ORD-001',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerMobile: '+1 555-123-4567',
  customerAddress: '123 Main St, City, State 12345',
  status: ORDER_STATUS.PREPARING,
  paymentMode: 'Card',
  totalAmount: 45.99,
  deliveryFee: 5.00,
  source: 'internal',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: '1',
      menuItemId: '1',
      quantity: 2,
      price: 15.99,
      subtotal: 31.98,
      menuItem: {
        id: '1',
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 15.99,
        categoryId: '1',
        image: '/burger.jpg',
        isVegetarian: false,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: '2',
      menuItemId: '2',
      quantity: 1,
      price: 8.99,
      subtotal: 8.99,
      menuItem: {
        id: '2',
        name: 'French Fries',
        description: 'Crispy golden fries with sea salt',
        price: 8.99,
        categoryId: '2',
        image: '/fries.jpg',
        isVegetarian: true,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ]
};

const POSTestPage: React.FC = () => {
  const [basicPrinterStatus, setBasicPrinterStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [advancedPrinters, setAdvancedPrinters] = useState<any[]>([]);
  const [printing, setPrinting] = useState<string | null>(null);
  const [printResults, setPrintResults] = useState<{[key: string]: 'success' | 'error'}>({});

  useEffect(() => {
    checkBasicPrinterStatus();
    discoverAdvancedPrinters();
  }, []);

  const checkBasicPrinterStatus = async () => {
    setBasicPrinterStatus('checking');
    try {
      const isAvailable = await posPrintService.checkPrinterAvailability();
      setBasicPrinterStatus(isAvailable ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Basic printer check failed:', error);
      setBasicPrinterStatus('unavailable');
    }
  };

  const discoverAdvancedPrinters = async () => {
    try {
      const printers = await advancedPOSService.discoverPrinters();
      setAdvancedPrinters(printers);
    } catch (error) {
      console.error('Advanced printer discovery failed:', error);
    }
  };

  const handleBasicPrint = async (type: 'receipt' | 'kitchen') => {
    setPrinting(type);
    setPrintResults(prev => ({ ...prev, [type]: undefined }));
    
    try {
      if (type === 'receipt') {
        await posPrintService.printOrderReceipt(sampleOrder);
      } else {
        await posPrintService.printKitchenTicket(sampleOrder);
      }
      
      setPrintResults(prev => ({ ...prev, [type]: 'success' }));
      setTimeout(() => {
        setPrintResults(prev => ({ ...prev, [type]: undefined }));
      }, 3000);
    } catch (error) {
      console.error(`${type} printing failed:`, error);
      setPrintResults(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setPrintResults(prev => ({ ...prev, [type]: undefined }));
      }, 3000);
    } finally {
      setPrinting(null);
    }
  };

  const handleAdvancedPrint = async (type: 'receipt' | 'kitchen' | 'label') => {
    setPrinting(`advanced-${type}`);
    setPrintResults(prev => ({ ...prev, [`advanced-${type}`]: undefined }));
    
    try {
      // Connect to first available printer
      if (advancedPrinters.length > 0) {
        const printer = advancedPrinters[0];
        await advancedPOSService.connectPrinter(printer.name);
        
        if (type === 'receipt') {
          await advancedPOSService.printOrderReceipt(sampleOrder, {
            includeBarcode: true,
            autoCut: true,
            printLogo: true
          });
        } else if (type === 'kitchen') {
          await advancedPOSService.printKitchenTicket(sampleOrder, {
            autoCut: true
          });
        } else if (type === 'label') {
          await advancedPOSService.printProductLabel('Classic Burger', 15.99, {
            autoCut: true
          });
        }
        
        setPrintResults(prev => ({ ...prev, [`advanced-${type}`]: 'success' }));
      } else {
        throw new Error('No printers available');
      }
      
      setTimeout(() => {
        setPrintResults(prev => ({ ...prev, [`advanced-${type}`]: undefined }));
      }, 3000);
    } catch (error) {
      console.error(`Advanced ${type} printing failed:`, error);
      setPrintResults(prev => ({ ...prev, [`advanced-${type}`]: 'error' }));
      setTimeout(() => {
        setPrintResults(prev => ({ ...prev, [`advanced-${type}`]: undefined }));
      }, 3000);
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Printing Test Suite</h1>
          <p className="text-gray-600">Test and validate POS printer functionality</p>
        </div>

        {/* Sample Order Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ReceiptIcon className="w-5 h-5 mr-2 text-orange-500" />
            Sample Order Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Order ID</label>
              <p className="text-gray-900 font-medium">{sampleOrder.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
              <p className="text-gray-900 font-medium">{sampleOrder.customerName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Total</label>
              <p className="text-gray-900 font-medium">${sampleOrder.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <p className="text-gray-900 font-medium">{sampleOrder.status}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic POS Service */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PrinterIcon className="w-5 h-5 mr-2 text-blue-500" />
              Basic POS Service
            </h2>
            
            {/* Printer Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    basicPrinterStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                    basicPrinterStatus === 'available' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    Status: {basicPrinterStatus === 'checking' ? 'Checking...' : 
                            basicPrinterStatus === 'available' ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <button
                  onClick={checkBasicPrinterStatus}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => handleBasicPrint('receipt')}
                disabled={printing !== null || basicPrinterStatus !== 'available'}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  printing === 'receipt'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : basicPrinterStatus === 'available'
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
                onClick={() => handleBasicPrint('kitchen')}
                disabled={printing !== null || basicPrinterStatus !== 'available'}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  printing === 'kitchen'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : basicPrinterStatus === 'available'
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
                    <ReceiptIcon className="w-4 h-4 mr-2" />
                    Print Kitchen Ticket
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            {printResults.receipt && (
              <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                printResults.receipt === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {printResults.receipt === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  Receipt printing {printResults.receipt === 'success' ? 'successful!' : 'failed!'}
                </span>
              </div>
            )}

            {printResults.kitchen && (
              <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                printResults.kitchen === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {printResults.kitchen === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  Kitchen ticket printing {printResults.kitchen === 'success' ? 'successful!' : 'failed!'}
                </span>
              </div>
            )}
          </div>

          {/* Advanced POS Service */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <WrenchScrewdriverIcon className="w-5 h-5 mr-2 text-purple-500" />
              Advanced POS Service
            </h2>
            
            {/* Available Printers */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    advancedPrinters.length > 0 ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {advancedPrinters.length} Printers Found
                  </span>
                </div>
                <button
                  onClick={discoverAdvancedPrinters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Discover
                </button>
              </div>
              {advancedPrinters.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {advancedPrinters.map(p => p.name).join(', ')}
                </div>
              )}
            </div>

            {/* Print Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => handleAdvancedPrint('receipt')}
                disabled={printing !== null || advancedPrinters.length === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  printing === 'advanced-receipt'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : advancedPrinters.length > 0
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {printing === 'advanced-receipt' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Printing Advanced Receipt...
                  </>
                ) : (
                  <>
                    <PrinterIcon className="w-4 h-4 mr-2" />
                    Advanced Receipt (with Barcode)
                  </>
                )}
              </button>

              <button
                onClick={() => handleAdvancedPrint('kitchen')}
                disabled={printing !== null || advancedPrinters.length === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  printing === 'advanced-kitchen'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : advancedPrinters.length > 0
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {printing === 'advanced-kitchen' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Printing Advanced KOT...
                  </>
                ) : (
                  <>
                    <ReceiptIcon className="w-4 h-4 mr-2" />
                    Advanced Kitchen Ticket
                  </>
                )}
              </button>

              <button
                onClick={() => handleAdvancedPrint('label')}
                disabled={printing !== null || advancedPrinters.length === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  printing === 'advanced-label'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : advancedPrinters.length > 0
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {printing === 'advanced-label' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Printing Label...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-5 mr-2" />
                    Print Product Label
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {Object.entries(printResults).map(([key, result]) => {
              if (!key.startsWith('advanced-')) return null;
              return (
                <div key={key} className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                  result === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {result === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">
                    {key.replace('advanced-', '').replace('-', ' ')} printing {result === 'success' ? 'successful!' : 'failed!'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Implementation Notes
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Basic Service:</strong> Uses browser print API with POS formatting. Good for testing and basic functionality.</p>
            <p>• <strong>Advanced Service:</strong> Simulates professional POS printer features like barcode printing, auto-cut, and cash drawer control.</p>
            <p>• <strong>Production:</strong> In production, you would connect to actual thermal printers using USB, Bluetooth, or network connections.</p>
            <p>• <strong>Printers:</strong> Common POS printers include EPSON TM-T88V, Star TSP650II, and Citizen CT-S310II.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSTestPage;