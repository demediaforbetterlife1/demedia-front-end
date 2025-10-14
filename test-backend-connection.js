// Test script to check backend connection and profile loading
console.log('🔍 Testing Backend Connection and Profile Loading');

async function testBackendConnection() {
    try {
        console.log('\n1️⃣ Testing backend health...');
        const healthResponse = await fetch('https://demedia-backend.fly.dev/api/health');
        console.log('Health check status:', healthResponse.status);
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend is healthy:', healthData);
        } else {
            console.log('❌ Backend health check failed');
        }
    } catch (error) {
        console.log('❌ Backend health check error:', error.message);
    }

    try {
        console.log('\n2️⃣ Testing profile API...');
        const testUserId = '1';
        const profileResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${testUserId}/profile`, {
            headers: {
                'Authorization': 'Bearer test-token',
                'user-id': '1',
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Profile API status:', profileResponse.status);
        console.log('Profile API ok:', profileResponse.ok);
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile data received:', profileData);
        } else {
            const errorText = await profileResponse.text();
            console.log('❌ Profile API failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Profile API error:', error.message);
    }

    try {
        console.log('\n3️⃣ Testing frontend API route...');
        const frontendResponse = await fetch(`/api/user/1/profile`, {
            headers: {
                'Authorization': 'Bearer test-token',
                'user-id': '1',
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Frontend API status:', frontendResponse.status);
        
        if (frontendResponse.ok) {
            const frontendData = await frontendResponse.json();
            console.log('✅ Frontend API data:', frontendData);
        } else {
            const errorText = await frontendResponse.text();
            console.log('❌ Frontend API failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Frontend API error:', error.message);
    }
}

// Run the test
testBackendConnection().then(() => {
    console.log('\n🎯 Backend Connection Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Check if backend is accessible');
    console.log('- Check if profile API is working');
    console.log('- Check if frontend API route is working');
    console.log('- This will help identify where the profile loading issue is occurring');
});
