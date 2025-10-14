// Debug script to test posts API and profile loading
console.log('🔍 Debug Posts API and Profile Loading');

async function debugPostsAPI() {
    try {
        console.log('\n1️⃣ Testing posts API...');
        const postsResponse = await fetch('/api/posts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'user-id': localStorage.getItem('userId'),
                'Content-Type': 'application/json',
            }
        });
        
        console.log('Posts API status:', postsResponse.status);
        console.log('Posts API ok:', postsResponse.ok);
        
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
                    console.log('Full post object:', JSON.stringify(firstPost, null, 2));
                }
            } else {
                console.log('❌ No posts found');
            }
        } else {
            const errorText = await postsResponse.text();
            console.log('❌ Posts API failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Debug error:', error.message);
    }
}

// Run the debug
debugPostsAPI().then(() => {
    console.log('\n🎯 Posts API Debug Complete!');
    console.log('\n📋 This will help identify:');
    console.log('- If posts API is working');
    console.log('- If post data contains proper user/author IDs');
    console.log('- If profile API is working');
    console.log('- Where the profile loading is failing');
});
