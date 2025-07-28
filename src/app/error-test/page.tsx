'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function ErrorTestPage() {
  const [errorType, setErrorType] = useState<string>('none');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const triggerClientError = () => {
    try {
      // Intentionally throw an error
      throw new Error('This is a test client-side error');
    } catch (error) {
      if (error instanceof Error) {
        // Capture the error with Sentry
        Sentry.captureException(error);
        setErrorType('client');
        setErrorMessage(error.message);
      }
    }
  };

  const triggerApiError = async () => {
    try {
      // Simulate an API error
      const response = await fetch('/api/non-existent-endpoint');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        // Capture the error with Sentry
        Sentry.captureException(error);
        setErrorType('api');
        setErrorMessage(error.message);
      }
    }
  };

  const triggerUnhandledError = () => {
    // This will cause an unhandled error
    const obj: any = null;
    obj.nonExistentMethod();
  };

  const addBreadcrumb = () => {
    // Add a breadcrumb
    Sentry.addBreadcrumb({
      category: 'ui',
      message: 'User clicked breadcrumb button',
      level: 'info',
    });
    setErrorType('breadcrumb');
    setErrorMessage('Breadcrumb added - now trigger an error to see it in Sentry');
  };

  const setUserContext = () => {
    // Set user context
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser',
    });
    setErrorType('user');
    setErrorMessage('User context set - now trigger an error to see it in Sentry');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sentry Error Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button 
          onClick={triggerClientError}
          className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Trigger Client Error
        </button>
        
        <button 
          onClick={triggerApiError}
          className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Trigger API Error
        </button>
        
        <button 
          onClick={triggerUnhandledError}
          className="p-4 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Unhandled Error
        </button>
        
        <button 
          onClick={addBreadcrumb}
          className="p-4 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Breadcrumb
        </button>
        
        <button 
          onClick={setUserContext}
          className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Set User Context
        </button>
      </div>
      
      {errorType !== 'none' && (
        <div className={`p-4 rounded mb-4 ${
          errorType === 'client' ? 'bg-blue-100 border border-blue-500' :
          errorType === 'api' ? 'bg-purple-100 border border-purple-500' :
          errorType === 'breadcrumb' ? 'bg-green-100 border border-green-500' :
          errorType === 'user' ? 'bg-yellow-100 border border-yellow-500' :
          'bg-red-100 border border-red-500'
        }`}>
          <h2 className="text-xl font-semibold mb-2">
            {errorType === 'client' ? 'Client Error Triggered' :
             errorType === 'api' ? 'API Error Triggered' :
             errorType === 'breadcrumb' ? 'Breadcrumb Added' :
             errorType === 'user' ? 'User Context Set' :
             'Unhandled Error Triggered'}
          </h2>
          <p className="text-gray-700">{errorMessage}</p>
          <p className="mt-2 text-sm text-gray-500">
            Check your Sentry dashboard to see the captured error and context.
          </p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">About Sentry Integration</h2>
        <p className="mb-2">
          This page demonstrates how Sentry captures different types of errors and context in a Next.js application.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Client errors are captured with full stack traces</li>
          <li>API errors show network request details</li>
          <li>Unhandled errors are automatically captured</li>
          <li>Breadcrumbs help trace user actions before an error</li>
          <li>User context associates errors with specific users</li>
        </ul>
      </div>
    </div>
  );
}
