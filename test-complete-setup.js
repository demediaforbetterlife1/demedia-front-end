// Simple test to verify the complete-setup API works
async function testCompleteSetup() {
  try {
    console.log('Testing complete-setup API...');
    
    const response = await fetch('http://localhost:3000/api/auth/complete-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dob: '1990-01-01' })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Complete-setup API is working correctly!');
    } else {
      console.log('❌ Complete-setup API failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCompleteSetup();
}

module.exports = testCompleteSetup;