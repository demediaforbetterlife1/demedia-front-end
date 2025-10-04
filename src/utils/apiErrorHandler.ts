// API Error Handler for better error management
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any, endpoint: string): APIError => {
  console.error(`API Error for ${endpoint}:`, error);
  
  if (error instanceof APIError) {
    return error;
  }
  
  if (error.response) {
    // Axios error
    return new APIError(
      error.response.data?.error || error.response.data?.message || 'API request failed',
      error.response.status,
      endpoint
    );
  }
  
  if (error.request) {
    // Network error
    return new APIError(
      'Network error - please check your connection',
      0,
      endpoint
    );
  }
  
  // Generic error
  return new APIError(
    error.message || 'An unexpected error occurred',
    500,
    endpoint
  );
};

export const isAPIError = (error: any): error is APIError => {
  return error instanceof APIError;
};

// Global fetch wrapper with error handling
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || errorData.message || `HTTP ${response.status}`,
        response.status,
        url
      );
    }
    
    return response;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw handleAPIError(error, url);
  }
};
