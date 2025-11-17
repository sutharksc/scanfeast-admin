import React, { useState } from 'react';
import { orderAPIService, ExternalOrderData } from '../../services/orderAPIService';
import { PlusIcon, BellIcon } from '../ui/Icons';

const ExternalOrderDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Sample external order data
  const sampleOrder: ExternalOrderData = {
    customerName: 'Alice Johnson',
    customerMobile: '+1234567890',
    customerEmail: 'alice@example.com',
    customerAddress: '123 Main St, City, State',
    items: [
      {
        menuItemId: '1',
        quantity: 2,
        price: 8.99
      },
      {
        menuItemId: '4',
        quantity: 1,
        price: 18.99
      }
    ],
    paymentMode: 'Online',
    deliveryTime: 30,
    deliveryFee: 5.00,
    notes: 'Extra napkins please, no onions'
  };

  const handleSimulateOrder = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await orderAPIService.handleWebhook(sampleOrder);
      
      if (result.success) {
        setMessage(`✅ Order ${result.orderId} created successfully!`);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await orderAPIService.requestNotificationPermission();
    setMessage(granted ? '🔔 Notifications enabled!' : '❌ Notifications denied');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BellIcon className="w-5 h-5 mr-2 text-orange-600" />
          External Order Demo
        </h3>
        <button
          onClick={handleRequestNotificationPermission}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Enable Notifications
        </button>
      </div>
      
      <p className="text-gray-600 mb-4">
        Simulate receiving an order from an external application (like a food delivery app).
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Sample Order:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Customer:</strong> {sampleOrder.customerName}</p>
          <p><strong>Items:</strong> {sampleOrder.items.length} items</p>
          <p><strong>Total:</strong> ${sampleOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
          <p><strong>Payment:</strong> {sampleOrder.paymentMode}</p>
          <p><strong>Delivery:</strong> {sampleOrder.deliveryTime} minutes</p>
        </div>
      </div>
      
      <button
        onClick={handleSimulateOrder}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <PlusIcon className="w-4 h-4 mr-2" />
            Simulate External Order
          </>
        )}
      </button>
      
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 This simulates orders coming from external apps like:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Food delivery platforms (Uber Eats, DoorDash)</li>
          <li>Restaurant websites</li>
          <li>Mobile ordering apps</li>
          <li>Third-party ordering systems</li>
        </ul>
      </div>
    </div>
  );
};

export default ExternalOrderDemo;