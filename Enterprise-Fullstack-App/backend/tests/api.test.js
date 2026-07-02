// Quick Node.js API Verification Script
// This script validates that the backend endpoints are up and working.
const assert = require('assert');

console.log('--- RUNNING MEDICONSENSUS BACKEND UNIT & INTEGRATION TESTS ---');

async function testAuthEndpoints() {
  const PORT = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${PORT}/api`;
  
  console.log(`[Test] Connecting to backend at: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Doctor',
        email: `test_doc_${Date.now()}@test.com`,
        password: 'password123',
        hospital: 'Test Hospital'
      })
    });

    const data = await response.json();
    
    assert.strictEqual(response.status, 201, 'Signup API should return status code 201');
    assert.ok(data.token, 'Signup API should return JWT Auth token');
    assert.strictEqual(data.user.name, 'Test Doctor', 'Signed up user name matches input');
    
    console.log('✅ Signup & JWT Issuance Integration Test: PASSED');
  } catch (err) {
    console.warn('❌ Auth Integration Test: FAILED. Ensure the backend server is running in another shell.', err.message);
  }
}

testAuthEndpoints();
