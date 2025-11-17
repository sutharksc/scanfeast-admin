import React from 'react';
import POSButtonTest from '../components/POSButtonTest';
import POSDebugInfo from '../components/POSDebugInfo';
import { ArrowLeftIcon } from '../components/ui/Icons';
import { Link } from 'react-router-dom';

const POSTroubleshooting: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">POS Printing Troubleshooting</h1>
          <p className="text-gray-600 mt-2">Test and debug POS printing functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Component */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">POS Button Test</h2>
            <POSButtonTest />
          </div>

          {/* Debug Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h2>
            <POSDebugInfo />
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting Guide</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Button is Disabled</h3>
              <p className="text-sm text-gray-600">
                If the POS button is disabled, check the printer status indicator. It should show green (available) 
                or yellow (checking). If it shows red, there might be an issue with the printer detection.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Popup Blocker Issues</h3>
              <p className="text-sm text-gray-600">
                POS printing uses browser popups to display the print preview. Make sure your browser allows popups 
                from this website. Check the address bar for a popup blocker icon and click "Allow".
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Browser Compatibility</h3>
              <p className="text-sm text-gray-600">
                POS printing works best in modern browsers (Chrome, Firefox, Safari, Edge). 
                Make sure your browser is up to date.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Print Dialog Not Appearing</h3>
              <p className="text-sm text-gray-600">
                If the print dialog doesn't appear, check the browser console for error messages. 
                The issue might be related to popup blockers or browser security settings.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">5. Console Errors</h3>
              <p className="text-sm text-gray-600">
                Open the browser developer tools (F12) and check the Console tab for any error messages. 
                This will help identify the specific issue.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fixes */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Quick Fixes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Allow Popups</h3>
              <p className="text-sm text-blue-800">
                Click the popup blocker icon in your browser's address bar and select "Always allow popups from this site".
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Refresh Page</h3>
              <p className="text-sm text-blue-800">
                Sometimes a simple page refresh can resolve temporary issues.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Clear Cache</h3>
              <p className="text-sm text-blue-800">
                Clear your browser cache and cookies to resolve any caching issues.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Try Different Browser</h3>
              <p className="text-sm text-blue-800">
                If the issue persists, try using a different browser to test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSTroubleshooting;