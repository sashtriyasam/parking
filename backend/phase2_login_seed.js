require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'https://parkeasy-backend-uy3x.onrender.com/api/v1';

async function testLoginSeed() {
  console.log('--- TESTING LOGIN WITH SEED CREDENTIALS ---');

  const customerEmail = process.env.CUSTOMER_EMAIL;
  const customerPassword = process.env.CUSTOMER_PASSWORD;
  const providerEmail = process.env.PROVIDER_EMAIL;
  const providerPassword = process.env.PROVIDER_PASSWORD;

  if (!customerEmail || !customerPassword || !providerEmail || !providerPassword) {
    console.error('Infrastructure Failure: Missing required environment variables (CUSTOMER_EMAIL, CUSTOMER_PASSWORD, PROVIDER_EMAIL, PROVIDER_PASSWORD).');
    process.exit(1);
  }

  // Login as Customer
  let customerTokens;
  try {
    const loginCust = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: customerPassword
    });
    console.log('CUSTOMER LOGIN SUCCESS:', loginCust.status);
    
    if (loginCust.data && loginCust.data.data) {
      customerTokens = loginCust.data.data;
      if (typeof customerTokens.accessToken === 'string' && customerTokens.accessToken.length > 20) {
        const maskedCustToken = `${customerTokens.accessToken.substring(0, 10)}...${customerTokens.accessToken.slice(-10)}`;
        console.log(`CUSTOMER_ACCESS_TOKEN_MASKED=${maskedCustToken}`);
      } else {
        console.warn('WARNING: Customer access token is missing or too short to mask.');
        console.log('CUSTOMER_ACCESS_TOKEN_MASKED=<missing>');
      }
    } else {
      console.warn('WARNING: Customer login response payload does not contain data structure.');
      console.log('CUSTOMER_ACCESS_TOKEN_MASKED=<missing>');
    }
  } catch (error) {
    console.log('CUSTOMER LOGIN FAILED:', error.response?.status, error.response?.data?.message || error.message);
  }

  // Login as Provider
  try {
    const loginProv = await axios.post(`${BASE_URL}/auth/login`, {
      email: providerEmail,
      password: providerPassword
    });
    console.log('PROVIDER LOGIN SUCCESS:', loginProv.status);
    let maskedProvToken = '<missing>';
    if (loginProv.data && loginProv.data.data && typeof loginProv.data.data.accessToken === 'string' && loginProv.data.data.accessToken.length > 20) {
      maskedProvToken = `${loginProv.data.data.accessToken.substring(0, 10)}...${loginProv.data.data.accessToken.slice(-10)}`;
    } else {
      console.warn('WARNING: Provider access token is missing or too short to mask.');
    }
    console.log(`PROVIDER_ACCESS_TOKEN_MASKED=${maskedProvToken}`);
  } catch (error) {
    console.log('PROVIDER LOGIN FAILED:', error.response?.status, error.response?.data?.message || error.message);
  }
}

if (require.main === module) {
  testLoginSeed();
}
