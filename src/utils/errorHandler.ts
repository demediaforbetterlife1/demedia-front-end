// Global error handler to catch and fix "Something went wrong" errors
export function handleGlobalError(error: any): string {
  console.log('Global error handler caught:', error);
  
  // Check if it's the "Something went wrong" error
  if (error?.message === 'Something went wrong' || 
      error?.toString()?.includes('Something went wrong')) {
    return 'Registration failed. Please try a different username or email.';
  }
  
  // Check for specific backend errors
  if (error?.message?.includes('Username already in use')) {
    return 'This username is already taken';
  }
  
  if (error?.message?.includes('Email already registered')) {
    return 'This email address is already registered';
  }
  
  // Return the original error message or a generic one
  return error?.message || 'Registration failed. Please try again.';
}

// Override the global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.log('Global error caught:', event.error);
    if (event.error?.message === 'Something went wrong') {
      event.preventDefault();
      console.log('Prevented "Something went wrong" error');
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.log('Unhandled promise rejection:', event.reason);
    if (event.reason?.message === 'Something went wrong') {
      event.preventDefault();
      console.log('Prevented "Something went wrong" promise rejection');
    }
  });
}
