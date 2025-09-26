// Test script to verify backend connection
const backendUrl = "https://demedia-back-end-b8ouzq.fly.dev";

console.log("Testing backend connection...");
console.log("Backend URL:", backendUrl);

// Test the backend health endpoint
fetch(`${backendUrl}/`)
  .then(response => {
    console.log("Status:", response.status);
    return response.text();
  })
  .then(data => {
    console.log("Response:", data);
    console.log("✅ Backend is working!");
  })
  .catch(error => {
    console.log("❌ Backend connection failed:", error.message);
  });

// Test an API endpoint
fetch(`${backendUrl}/api/auth`)
  .then(response => {
    console.log("API Status:", response.status);
    return response.text();
  })
  .then(data => {
    console.log("API Response:", data);
  })
  .catch(error => {
    console.log("❌ API connection failed:", error.message);
  });
