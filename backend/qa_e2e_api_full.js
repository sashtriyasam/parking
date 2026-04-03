const BASE_URL = 'http://localhost:5006/api/v1';

async function runTests() {
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

  let CUSTOMER_TOKEN, PROVIDER_TOKEN, FACILITY_ID, SLOT_ID, VEHICLE_ID, TICKET_ID;
  const unique_id = Math.random().toString(36).substring(7);
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
    
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  console.log('--- STARTING ParkEasy FULL E2E API TESTS (PRODUCTION) ---');

  // PHASE 2: AUTHENTICATION
  // 2A - Register Customer
  try {
    const res = await api('/auth/register', 'POST', { 
        email: C_EMAIL, 
        password: "QATest@1234", 
        full_name: "QA Customer", 
        phone_number: `+91999${Math.floor(Math.random()*999999)}`, 
        role: "CUSTOMER" 
    });
    if (res.status === 201) logPass('2A: Customer Reg');
    else logFail('2A: Customer Reg', 201, res.status, res.data.message);
  } catch (err) { logFail('2A: Customer Reg', 201, 'ERR', err.message); }

  // 2B - Register Provider
  try {
    const res = await api('/auth/register', 'POST', { 
        email: P_EMAIL, 
        password: "QATest@1234", 
        full_name: "QA Provider", 
        role: "PROVIDER" 
    });
    if (res.status === 201) logPass('2B: Provider Reg');
    else logFail('2B: Provider Reg', 201, res.status, res.data.message);
  } catch (err) { logFail('2B: Provider Reg', 201, 'ERR', err.message); }

  // 2C - Login Customer
  try {
    const res = await api('/auth/login', 'POST', { email: C_EMAIL, password: "QATest@1234" });
    if (res.status === 200) {
      CUSTOMER_TOKEN = res.data.data.accessToken;
      logPass('2C: Customer Login');
    } else logFail('2C: Customer Login', 200, res.status, res.data.message);
  } catch (err) { logFail('2C: Customer Login', 200, 'ERR', err.message); }

  // PHASE 3: CUSTOMER FLOWS
  if (CUSTOMER_TOKEN) {
    // 3A - Search Facilities
    try {
      const res = await api('/customer/search?latitude=19.0662&longitude=72.8659&radius=50', 'GET', null, CUSTOMER_TOKEN);
      if (res.status === 200 && res.data.data.length > 0) {
        FACILITY_ID = res.data.data[0].id;
        console.log(`DEBUG: Found Facility ID: ${FACILITY_ID}`);
        logPass('3A: Facility Search');
      } else logFail('3A: Facility Search', 200, res.status, 'No facilities found nearby');
    } catch (err) { logFail('3A: Facility Search', 200, 'ERR', err.message); }

    // 3B - Add Vehicle
    try {
      const res = await api('/customer/vehicles', 'POST', { 
          vehicle_number: `MH01QA${Math.floor(Math.random()*9999)}`, 
          vehicle_type: "CAR", 
          nickname: "QA Mobile" 
      }, CUSTOMER_TOKEN);
      if (res.status === 201) {
        VEHICLE_ID = res.data.data.id;
        logPass('3B: Add Vehicle');
      } else logFail('3B: Add Vehicle', 201, res.status, res.data.message);
    } catch (err) { logFail('3B: Add Vehicle', 201, 'ERR', err.message); }

    // 3C - Get Slots
    if (FACILITY_ID) {
      try {
        const res = await api(`/customer/facility/${FACILITY_ID}/slots`, 'GET', null, CUSTOMER_TOKEN);
        if (res.status === 200) {
          const floors = res.data.data;
          let foundSlot = null;
          
          // The response is grouped by floor: { "Floor 1": [slots] }
          for (const floorName in floors) {
            const slot = floors[floorName].find(s => s.status === 'FREE' && s.vehicle_type === 'CAR');
            if (slot) {
              foundSlot = slot;
              break;
            }
          }

          if (foundSlot) {
            SLOT_ID = foundSlot.id;
            logPass('3C: Get Free Slots');
          } else {
            logFail('3C: Get Free Slots', 200, 200, 'No FREE CAR slots available in any floor');
          }
        } else {
          logFail('3C: Get Free Slots', 200, res.status, 'Failed to fetch slots');
        }
      } catch (err) { logFail('3C: Get Free Slots', 200, 'ERR', err.message); }
    }

    // 3D - Create Booking with Payment
    if (SLOT_ID && VEHICLE_ID && FACILITY_ID) {
      try {
        const res = await api('/customer/booking/confirm', 'POST', {
            slot_id: SLOT_ID,
            vehicle_type: "CAR",
            vehicle_number: "MH01QA1234",
            entry_time: new Date().toISOString(),
            duration: 2,
            payment_method: "PAY_AT_EXIT",
            payment_details: {}
        }, CUSTOMER_TOKEN);
        if (res.status === 201) {
          TICKET_ID = res.data.data.id;
          logPass('3D: Create Booking');
        } else {
          logFail('3D: Create Booking', 201, res.status, res.data.message || 'Booking failed');
        }
      } catch (err) { logFail('3D: Create Booking', 201, 'ERR', err.message); }
    }
  }

  // PHASE 5: PAYMENT FLOW (SIMULATION)
  if (SLOT_ID && FACILITY_ID && CUSTOMER_TOKEN) {
    try {
      const res = await api('/payments/create-order', 'POST', { 
          amount: 100,
          facility_id: FACILITY_ID,
          slot_id: SLOT_ID
      }, CUSTOMER_TOKEN);
      
      if (res.status === 200 || res.status === 201) {
        logPass('5A: Create Payment Order');
      } else if (res.status === 503) {
        logWarn('5A: Payment skipped (Razorpay keys missing or test demo mode)');
      } else {
        logFail('5A: Create Payment Order', '200/503', res.status, res.data.message || 'Payment order failed');
      }
    } catch (err) { logFail('5A: Create Payment Order', 200, 'ERR', err.message); }
  }

  console.log('\n--- FINAL E2E REPORT (PRODUCTION) ---');
  console.log(JSON.stringify(report, null, 2));
}

runTests();
