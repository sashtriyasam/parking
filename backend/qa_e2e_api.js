require('dotenv').config();
const axios = require('axios');
const api = axios.create({ timeout: 10000 });

const BASE_URL = process.env.API_URL || 'https://parkeasy-backend-uy3x.onrender.com/api/v1';

async function registerCustomer(customerEmail, testPassword, results) {
  try {
    const res = await api.post(`${BASE_URL}/auth/register`, {
      email: customerEmail,
      password: testPassword,
      full_name: "QA Customer",
      phone_number: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      role: "CUSTOMER"
    });
    console.log('TEST 2A PASSED: Customer Registered');
    results.passing.push('TEST 2A');
    return res.data.data.accessToken;
  } catch (err) {
    console.error('TEST 2A FAILED:', err.response?.data?.message || err.message);
    results.failing.push({ id: 'TEST 2A', actual: err.response?.status, error: err.response?.data?.message });
    return null;
  }
}

async function registerProvider(providerEmail, testPassword, results) {
  try {
    const res = await api.post(`${BASE_URL}/auth/register`, {
      email: providerEmail,
      password: testPassword,
      full_name: "QA Provider",
      phone_number: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      role: "PROVIDER"
    });
    console.log('TEST 2B PASSED: Provider Registered');
    results.passing.push('TEST 2B');
    return res.data.data.accessToken;
  } catch (err) {
    console.error('TEST 2B FAILED:', err.response?.data?.message || err.message);
    results.failing.push({ id: 'TEST 2B', actual: err.response?.status, error: err.response?.data?.message });
    return null;
  }
}

async function loginUser(email, password, testId, testLabel, results) {
  try {
    await api.post(`${BASE_URL}/auth/login`, { email, password });
    console.log(`TEST ${testId} PASSED: ${testLabel} Login Verified`);
    results.passing.push(`TEST ${testId}`);
  } catch (err) {
    console.error(`TEST ${testId} FAILED: ${testLabel} login failed`, err.response?.data?.message || err.message);
    results.failing.push({ id: `TEST ${testId}`, actual: err.response?.status, error: err.response?.data?.message });
  }
}

async function runValidationGuard(results) {
  try {
    await api.post(`${BASE_URL}/auth/register`, { email: "bademail", password: "short", role: "ADMIN" });
    results.failing.push({ id: 'TEST 2D', actual: '201', error: 'Validation broken - accepted invalid data' });
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 422) {
      console.log('TEST 2D PASSED: Validation Guard Active');
      results.passing.push('TEST 2D');
    } else {
      console.error(`TEST 2D FAILED: Unexpected status ${status || 'N/A'}`);
      results.failing.push({ 
        id: 'TEST 2D', 
        actual: status, 
        error: err.response?.data?.message || err.message || 'Expected validation rejection (400/422)' 
      });
    }
  }
}

async function verifyGetMe(token, results) {
  if (token) {
    try {
      const res = await api.get(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.data.user.role === 'CUSTOMER') {
        console.log('TEST 2E PASSED: Get Me returns correct user info');
        results.passing.push('TEST 2E');
      } else {
        results.failing.push({ id: 'TEST 2E', actual: res.data.data.user.role, error: 'Incorrect role returned' });
      }
    } catch (err) {
      console.error('TEST 2E FAILED:', err.message);
      results.failing.push({ id: 'TEST 2E', error: err.message });
    }
  } else {
    console.warn('SKIPPING TEST 2E: Missing CUSTOMER_TOKEN - prerequisite test failed');
    results.failing.push({ id: 'TEST 2E', error: 'Missing CUSTOMER_TOKEN - prerequisite test failed' });
  }
}

async function cleanup(customerToken, providerToken) {
  console.log('--- STARTING TEARDOWN (Cleanup) ---');
  if (customerToken) {
    try {
      await api.delete(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${customerToken}` } });
      console.log('TEARDOWN: Test Customer Deleted');
    } catch (err) {
      console.error('TEARDOWN FAILED: Could not delete customers', err.message);
    }
  }
  if (providerToken) {
    try {
      await api.delete(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${providerToken}` } });
      console.log('TEARDOWN: Test Provider Deleted');
    } catch (err) {
      console.error('TEARDOWN FAILED: Could not delete provider', err.message);
    }
  }
}

async function runTests() {
  const results = { passing: [], failing: [], warnings: [] };

  const baseEmailPrefix = process.env.TEST_USER_EMAIL_PREFIX || 'qatest';
  const testPassword = process.env.TEST_USER_PASSWORD || 'QATest@1234';
  const timestamp = Date.now();
  const customerEmail = `${baseEmailPrefix}_cust_${timestamp}@parkeasy.in`;
  const providerEmail = `${baseEmailPrefix}_prov_${timestamp}@parkeasy.in`;

  console.log('--- STARTING ParkEasy E2E API TESTS ---');

  const customerToken = await registerCustomer(customerEmail, testPassword, results);
  const providerToken = await registerProvider(providerEmail, testPassword, results);

  if (customerToken) {
    await loginUser(customerEmail, testPassword, '2C', 'Customer', results);
  }
  if (providerToken) {
    await loginUser(providerEmail, testPassword, '2F', 'Provider', results);
  }

  await runValidationGuard(results);
  await verifyGetMe(customerToken, results);

  await cleanup(customerToken, providerToken);
  
  console.log('--- API E2E SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));
  
  if (results.failing.length > 0) process.exit(1);
}

runTests();
