import React, { useState, useEffect } from 'react';
import { posPrintService } from '../services/posPrintService';

const POSDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    gatherDebugInfo();
  }, []);

  const gatherDebugInfo = async () => {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      windowPrint: typeof window.print,
      windowOpen: typeof window.open,
      document: typeof document,
      printerCheck: 'checking...'
    };

    try {
      const isAvailable = await posPrintService.checkPrinterAvailability();
      info.printerCheck = isAvailable ? 'available' : 'unavailable';
    } catch (error) {
      info.printerCheck = `error: ${error}`;
    }

    setDebugInfo(info);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-xl text-xs font-mono">
      <h4 className="font-bold mb-2">POS Debug Information</h4>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <button
        onClick={gatherDebugInfo}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Debug Info
      </button>
    </div>
  );
};

export default POSDebugInfo;