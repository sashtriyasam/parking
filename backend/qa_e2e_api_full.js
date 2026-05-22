const BASE_URL = 'http://localhost:5006/api/v1';

const report = {
  passing: [],
  failing: [],
  warnings: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

const logPass = (id) => {
  console.log(`✅ ${id} PASSED`);
  report.passing.push(id);
  report.summary.passed++;
  report.summary.total++;
};

const logFail = (id, expected, actual, error, severity = 'HIGH') => {
  console.log(`❌ ${id} FAILED: ${error}`);
  report.failing.push({ id, expected, actual, error, severity });
  report.summary.failed++;
  report.summary.total++;
};

const logWarn = (msg) => {
  console.log(`⚠️ WARNING: ${msg}`);
  report.warnings.push(msg);
};

const unique_id = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
const C_EMAIL = `qa_c_${unique_id}@test.com`;
const P_EMAIL = `qa_p_${unique_id}@test.com`;

async function api(path, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ParkEasy-QA-Agent/1.0'
    }
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, options).catch(err => {
      throw err;
  });
  
  const clone = res.clone();
  let data;
  try {
    data = await res.json();
  } catch (err) {
    const rawBody = await clone.text().catch(() => '<< Body consumed or unreadable >>');
    console.error(`🚨 JSON_PARSE_ERROR [Path: ${path} | Status: ${res.status}]`);
    console.error(`🚨 Message: ${err.message}`);
    console.error(`🚨 Raw response: ${rawBody.substring(0, 500)}${rawBody.length > 500 ? '...' : ''}`);
    data = { message: 'Incomplete or malformed JSON from server' };
  }
  return { status: res.status, data };
}

async function runAuthPhase() {
  let customerToken = null;
  let providerToken = null;

  // 1A - Register Customer
  try {
    const res = await api('/auth/register', 'POST', { 
        email: C_EMAIL, 
        password: "QATest@1234", 
        full_name: "QA Customer", 
        phone_number: `+91999${Math.floor(Math.random() * 900000) + 100000}`, 
        role: "CUSTOMER" 
    });
    if (res.status === 201) logPass('1A: Customer Reg');
    else logFail('1A: Customer Reg', 201, res.status, res.data.message);
  } catch (err) { logFail('1A: Customer Reg', 201, 'ERR', err.message); }

  // 1B - Register Provider
  try {
    const res = await api('/auth/register', 'POST', { 
        email: P_EMAIL, 
        password: "QATest@1234", 
        full_name: "QA Provider", 
        role: "PROVIDER" 
    });
    if (res.status === 201) {
      logPass('1B: Provider Reg');
      // Login to get provider token
      const loginRes = await api('/auth/login', 'POST', { email: P_EMAIL, password: "QATest@1234" });
      if (loginRes.status === 200) {
        providerToken = loginRes.data.data.accessToken;
        console.log('DEBUG: Captured Provider Token');
      } else {
        logFail('1B: Provider Login (Post-Reg)', 200, loginRes.status, loginRes.data.message);
      }
    } else logFail('1B: Provider Reg', 201, res.status, res.data.message);
  } catch (err) { logFail('1B: Provider Reg', 201, 'ERR', err.message); }

  // 1C - Login Customer
  try {
    const res = await api('/auth/login', 'POST', { email: C_EMAIL, password: "QATest@1234" });
    if (res.status === 200) {
      customerToken = res.data.data.accessToken;
      logPass('1C: Customer Login');
    } else logFail('1C: Customer Login', 200, res.status, res.data.message);
  } catch (err) { logFail('1C: Customer Login', 200, 'ERR', err.message); }

  return { customerToken, providerToken };
}

async function runCustomerPhase(customerToken) {
  let facilityId = null;
  let slotId = null;
  let vehicleId = null;
  let vehicleNumber = null;
  let ticketId = null;

  if (!customerToken) return { facilityId, slotId, vehicleId, vehicleNumber, ticketId };

  // 2A - Search Facilities
  try {
    const res = await api('/customer/search?latitude=19.0662&longitude=72.8659&radius=50', 'GET', null, customerToken);
    if (res.status === 200 && Array.isArray(res.data.data) && res.data.data.length > 0) {
      facilityId = res.data.data[0].id;
      if (process.env.VERBOSE) console.log(`DEBUG: Found Facility ID: ${facilityId}`);
      logPass('2A: Facility Search');
    } else logFail('2A: Facility Search', 200, res.status, 'No facilities found nearby');
  } catch (err) { logFail('2A: Facility Search', 200, 'ERR', err.message); }

  // 2B - Add Vehicle
  try {
    const vNum = `MH01QA${Math.floor(1000 + Math.random() * 8999)}`;
    const res = await api('/customer/vehicles', 'POST', { 
        vehicle_number: vNum, 
        vehicle_type: "CAR", 
        nickname: "QA Mobile" 
    }, customerToken);
    if (res.status === 201) {
      vehicleId = res.data.data.id;
      vehicleNumber = vNum;
      logPass('2B: Add Vehicle');
    } else logFail('2B: Add Vehicle', 201, res.status, res.data.message);
  } catch (err) { logFail('2B: Add Vehicle', 201, 'ERR', err.message); }

  // 2C - Get Slots
  if (facilityId) {
    try {
      const res = await api(`/customer/facility/${facilityId}/slots`, 'GET', null, customerToken);
      if (res.status === 200) {
        const floors = res.data.data;
        let foundSlot = null;
        for (const floorName in floors) {
          const slot = floors[floorName].find(s => s.status === 'FREE' && s.vehicle_type === 'CAR');
          if (slot) {
            foundSlot = slot;
            break;
          }
        }
        if (foundSlot) {
          slotId = foundSlot.id;
          logPass('2C: Get Free Slots');
        } else {
          logFail('2C: Get Free Slots', 200, 200, 'No FREE CAR slots available in any floor');
        }
      } else {
        logFail('2C: Get Free Slots', 200, res.status, 'Failed to fetch slots');
      }
    } catch (err) { logFail('2C: Get Free Slots', 200, 'ERR', err.message); }
  }

  // 2D - Create Booking
  if (slotId && vehicleId && facilityId && vehicleNumber) {
    try {
      const res = await api('/customer/booking/confirm', 'POST', {
          slot_id: slotId,
          vehicle_type: "CAR",
          vehicle_number: vehicleNumber,
          entry_time: new Date().toISOString(),
          duration: 2,
          payment_method: "PAY_AT_EXIT",
          payment_details: {}
      }, customerToken);
      if (res.status === 201) {
        ticketId = res.data.data.id;
        logPass('2D: Create Booking');
      } else {
        logFail('2D: Create Booking', 201, res.status, res.data.message || 'Booking failed');
      }
    } catch (err) { logFail('2D: Create Booking', 201, 'ERR', err.message); }
  }

  return { facilityId, slotId, vehicleId, vehicleNumber, ticketId };
}

async function runPaymentPhase(facilityId, slotId, customerToken) {
  if (slotId && facilityId && customerToken) {
    try {
      const res = await api('/payments/create-order', 'POST', { 
          amount: 100,
          facility_id: facilityId,
          slot_id: slotId
      }, customerToken);
      
      if (res.status === 200 || res.status === 201) {
        logPass('3A: Create Payment Order');
      } else if (res.status === 503) {
        logWarn('3A: Payment skipped (Razorpay keys missing or test demo mode)');
      } else {
        logFail('3A: Create Payment Order', '200/503', res.status, res.data.message || 'Payment order failed');
      }
    } catch (err) { logFail('3A: Create Payment Order', 200, 'ERR', err.message); }
  }
}

async function runTests() {
  console.log('--- STARTING ParkEasy FULL E2E API TESTS (PRODUCTION) ---');

  const { customerToken, providerToken } = await runAuthPhase();
  const { facilityId, slotId } = await runCustomerPhase(customerToken);
  await runPaymentPhase(facilityId, slotId, customerToken);

  console.log('\n--- FINAL E2E REPORT ---');
  console.log(JSON.stringify(report, null, 2));
  return report;
}

runTests().then(report => {
  if (report.summary.failed > 0) {
    console.error(`\n🏁 Test suite failed with ${report.summary.failed} failures.`);
    process.exit(1);
  }
  console.log('\n🏁 All tests completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('\n🚨 Test runner crashed unexpectedly:', err);
  process.exit(1);
});
