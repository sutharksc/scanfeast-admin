import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addQRCode } from '../store/slices/qrCodesSlice';
import QRCode from 'react-qr-code';
import { QRDesign, QRCode as QRCodeType } from '../types';

const QRCodes: React.FC = () => {
  const dispatch = useDispatch();
  const { tables, qrCodes } = useSelector((state: RootState) => state);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<QRDesign | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleGenerateQR = () => {
    if (!selectedTable || !selectedDesign) return;
    
    const table = tables.tables.find(t => t.id === selectedTable);
    if (!table) return;
    
    const url = `https://example.com/123/${table.number}`;
    setGeneratedQR(url);
    
    // Add to history
    const newQRCode: Omit<QRCodeType, 'id' | 'generatedAt'> = {
      tableId: selectedTable,
      table,
      design: selectedDesign,
      url,
    };
    
    dispatch(addQRCode(newQRCode));
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${selectedTable}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .print-container { text-align: center; }
                .qr-container { margin: 20px 0; }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const renderQRDesign = (design: QRDesign, url: string, tableNumber: string) => {
    const table = tables.tables.find(t => t.number === tableNumber);
    
    switch (design.template) {
      case 'minimal':
        return (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <QRCode value={url} size={200} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Table {tableNumber}</h3>
            <p className="text-gray-600 mt-2">Scan to Order</p>
          </div>
        );
      
      case 'branded':
        return (
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-8 rounded-lg shadow-lg text-center text-white">
            <div className="bg-white p-4 rounded-lg mb-4 inline-block">
              <QRCode value={url} size={180} />
            </div>
            <div className="mb-2">
              <div className="w-16 h-16 bg-white/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-bold">R</span>
              </div>
            </div>
            <h3 className="text-xl font-bold">Restaurant Admin</h3>
            <p className="text-orange-100 mt-2">Table {tableNumber}</p>
            <p className="text-orange-100">Scan to Order</p>
          </div>
        );
      
      case 'elegant':
        return (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-lg shadow-lg text-center">
            <div className="bg-white p-6 rounded-xl shadow-md mb-4 inline-block">
              <QRCode value={url} size={180} />
            </div>
            <h3 className="text-2xl font-light text-gray-800 mb-2">Table {tableNumber}</h3>
            <p className="text-gray-600 italic">Welcome to our restaurant</p>
            <p className="text-orange-600 font-medium mt-2">Scan to view menu & order</p>
          </div>
        );
      
      case 'fun':
        return (
          <div className="bg-gradient-to-br from-yellow-300 to-orange-400 p-8 rounded-lg shadow-lg text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <div className="bg-white p-4 rounded-lg mb-4 inline-block">
              <QRCode value={url} size={160} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Table {tableNumber}</h3>
            <p className="text-gray-700 font-medium">🍴 Scan for delicious food! 🍴</p>
          </div>
        );
      
      case 'compact':
        return (
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <div className="flex items-center justify-center space-x-4">
              <div>
                <QRCode value={url} size={120} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-800">Table {tableNumber}</h3>
                <p className="text-sm text-gray-600 mt-1">Scan to Order</p>
                <p className="text-xs text-orange-600 mt-2 font-mono break-all">{url}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Code Design</h1>
        <p className="text-gray-600 mt-2">Generate QR codes for your tables with custom designs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Table
                </label>
                <select
                  className="input-field"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  <option value="">Choose a table...</option>
                  {tables.tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.number} - {table.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Design
                </label>
                <div className="space-y-2">
                  {qrCodes.designs.map(design => (
                    <label
                      key={design.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDesign?.id === design.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="design"
                        value={design.id}
                        checked={selectedDesign?.id === design.id}
                        onChange={() => setSelectedDesign(design)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{design.name}</p>
                        <p className="text-sm text-gray-500">{design.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateQR}
                disabled={!selectedTable || !selectedDesign}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate QR Code
              </button>

              {generatedQR && selectedDesign && selectedTable && (
                <button
                  onClick={handlePrint}
                  className="w-full btn-secondary"
                >
                  Print QR Code
                </button>
              )}
            </div>
          </div>

          {/* QR History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">QR History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {qrCodes.qrCodes.length === 0 ? (
                <p className="text-gray-500 text-sm">No QR codes generated yet</p>
              ) : (
                qrCodes.qrCodes.map(qr => (
                  <div key={qr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{qr.table.number}</p>
                      <p className="text-xs text-gray-500">{qr.design.name}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(qr.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            
            {!selectedTable || !selectedDesign ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">📱</span>
                </div>
                <p className="text-gray-500">Select a table and design to preview QR code</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Design Previews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {qrCodes.designs.map(design => (
                    <div
                      key={design.id}
                      className={`cursor-pointer transition-transform hover:scale-105 ${
                        selectedDesign?.id === design.id ? 'ring-2 ring-orange-500 rounded-lg' : ''
                      }`}
                      onClick={() => setSelectedDesign(design)}
                    >
                      <div className="text-sm font-medium text-gray-700 mb-2 text-center">
                        {design.name}
                      </div>
                      {generatedQR && renderQRDesign(design, generatedQR, tables.tables.find(t => t.id === selectedTable)?.number || '')}
                    </div>
                  ))}
                </div>

                {/* Selected Design Details */}
                {selectedDesign && generatedQR && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Design Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Table</p>
                          <p className="text-gray-900">{tables.tables.find(t => t.id === selectedTable)?.number}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Design</p>
                          <p className="text-gray-900">{selectedDesign.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">URL</p>
                          <p className="text-gray-900 font-mono text-sm break-all">{generatedQR}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Generated</p>
                          <p className="text-gray-900">{new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview (Hidden) */}
      <div ref={printRef} className="hidden">
        {generatedQR && selectedDesign && selectedTable && (
          <div className="print-container">
            {renderQRDesign(selectedDesign, generatedQR, tables.tables.find(t => t.id === selectedTable)?.number || '')}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodes;