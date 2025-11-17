import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🎉 Application is Working!
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        The Vite development server is running correctly.
      </p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px 20px', 
        backgroundColor: '#4CAF50', 
        color: 'white', 
        borderRadius: '5px',
        fontSize: '16px'
      }}>
        Status: OK
      </div>
    </div>
  );
};

export default TestApp;