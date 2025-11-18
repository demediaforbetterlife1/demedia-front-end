import { NextRequest, NextResponse } from "next/server";

/**
 * Health Check API - Tests backend connectivity and service status
 * This endpoint helps diagnose backend connectivity issues
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    
    // Test basic connectivity to backend
    const healthCheckUrl = `${backendUrl}/api/health`;
    
    console.log('🔍 Testing backend connectivity:', healthCheckUrl);
    
    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 10 second timeout for health check
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        let backendData = null;
        try {
          backendData = await response.json();
        } catch (e) {
          // Backend might return plain text
          backendData = await response.text();
        }
        
        console.log('✅ Backend health check successful:', response.status);
        
        return NextResponse.json({
          status: 'healthy',
          backend: {
            url: backendUrl,
            status: response.status,
            responseTime: `${responseTime}ms`,
            data: backendData
          },
          frontend: {
            status: 'healthy',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Backend health check failed:', response.status, errorText);
        
        return NextResponse.json({
          status: 'degraded',
          backend: {
            url: backendUrl,
            status: response.status,
            responseTime: `${responseTime}ms`,
            error: errorText
          },
          frontend: {
            status: 'healthy',
            timestamp: new Date().toISOString()
          }
        }, { status: 503 });
      }
    } catch (backendError) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Backend connection failed:', backendError);
      
      return NextResponse.json({
        status: 'unhealthy',
        backend: {
          url: backendUrl,
          status: 'unreachable',
          responseTime: `${responseTime}ms`,
          error: backendError instanceof Error ? backendError.message : 'Connection failed'
        },
        frontend: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      }, { status: 503 });
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      frontend: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
