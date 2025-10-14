// Debug script to test profile loading
console.log('🔍 Testing Profile Loading Debug');

async function testProfileLoading() {
    try {
        console.log('\n1️⃣ Testing posts API...');
        const postsResponse = await fetch('/api/posts');
        console.log('Posts API status:', postsResponse.status);
        
        if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            console.log('✅ Posts data received:', postsData.length, 'posts');
            
            if (postsData.length > 0) {
                const firstPost = postsData[0];
                console.log('First post structure:', {
                    id: firstPost.id,
                    user: firstPost.user,
                    author: firstPost.author,
                    hasUser: !!firstPost.user,
                    hasAuthor: !!firstPost.author,
                    userHasId: !!firstPost.user?.id,
                    authorHasId: !!firstPost.author?.id
                });
                
                // Test profile loading for first post
                const targetUserId = firstPost.user?.id || firstPost.author?.id;
                if (targetUserId) {
                    console.log('\n2️⃣ Testing profile loading for userId:', targetUserId);
                    const profileResponse = await fetch(`/api/user/${targetUserId}/profile`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'user-id': localStorage.getItem('userId'),
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    console.log('Profile API status:', profileResponse.status);
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        console.log('✅ Profile data received:', profileData);
                    } else {
                        const errorText = await profileResponse.text();
                        console.log('❌ Profile API failed:', errorText);
                    }
                } else {
                    console.log('❌ No user ID found in post data');
                }
            }
        } else {
            console.log('❌ Posts API failed:', postsResponse.status);
        }
    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
}

// Run the test
testProfileLoading().then(() => {
    console.log('\n🎯 Profile Loading Debug Complete!');
    console.log('\n📋 This will help identify:');
    console.log('- If posts are being fetched correctly');
    console.log('- If post data contains proper user/author IDs');
    console.log('- If profile API is working');
    console.log('- Where the profile loading is failing');
});
