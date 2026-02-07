'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AuthDebugger() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runAuthTests = async () => {
    setTesting(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      clientSide: {},
      apiTests: {}
    };

    // Client-side checks
    results.clientSide = {
      user: user ? { id: user.id, name: user.name, isSetupComplete: user.isSetupComplete } : null,
      isAuthenticated,
      isLoading,
      cookieToken: document.cookie.includes('token'),
      localStorageToken: !!localStorage.getItem('token'),
      cookieValue: document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1]?.substring(0, 20) + '...',
      localStorageValue: localStorage.getItem('token')?.substring(0, 20) + '...'
    };

    // Test /api/auth/me
    try {
      const meResponse = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.apiTests.authMe = {
        status: meResponse.status,
        ok: meResponse.ok,
        data: meResponse.ok ? await meResponse.json() : await meResponse.text()
      };
    } catch (error) {
      results.apiTests.authMe = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test /api/posts (GET)
    try {
      const postsResponse = await fetch('/api/posts', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || ''
        }
      });
      
      results.apiTests.postsGet = {
        status: postsResponse.status,
        ok: postsResponse.ok,
        data: postsResponse.ok ? 'Success' : await postsResponse.text()
      };
    } catch (error) {
      results.apiTests.postsGet = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test /api/posts (POST) with minimal data
    if (user?.id) {
      try {
        const postData = {
          content: 'Test post from auth debugger',
          userId: typeof user.id === 'string' ? parseInt(user.id) : user.id,
          imageUrls: [],
          videoUrls: []
        };

        const createResponse = await fetch('/api/posts', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id.toString()
          },
          body: JSON.stringify(postData)
        });
        
        results.apiTests.postsCreate = {
          status: createResponse.status,
          ok: createResponse.ok,
          data: createResponse.ok ? 'Success' : await createResponse.text()
        };
      } catch (error) {
        results.apiTests.postsCreate = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const clearResults = () => {
    setTestResults(null);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border max-w-md">
      <h3 className="font-bold text-sm mb-2">Auth Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div>User: {user ? `${user.name} (${user.id})` : 'Not logged in'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button 
          onClick={runAuthTests} 
          disabled={testing}
          size="sm"
          className="text-xs"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </Button>
        
        {testResults && (
          <Button 
            onClick={clearResults} 
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {testResults && (
        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-60">
          <pre>{JSON.stringify(testResults, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}