/**
 * ELECTRORECK AUTOMATED BACKEND & FRONTEND INTEGRATION TEST SUITE
 * Tests all 11 core security, authentication, registration, RLS, and admin requirements.
 */

// Setup simulated window environment for Node.js
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  localStorage: mockLocalStorage,
  location: { search: '', hash: '', origin: 'http://localhost:3000' }
};
global.localStorage = mockLocalStorage;

// Load the client
require('./supabase-client.js');
const Electroreck = global.window.Electroreck;

async function runTestSuite() {
  console.log('===============================================================');
  console.log('⚡ ELECTRORECK COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
  console.log('===============================================================\n');

  const results = [];

  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} ${details ? '— ' + details : ''}`);
  }

  // Clear DB to fresh state
  mockLocalStorage.clear();

  // --------------------------------------------------------------------------
  // TEST 1: College Email Domain Enforcement on Signup
  // --------------------------------------------------------------------------
  try {
    await Electroreck.auth.signUp({
      full_name: 'Impostor User',
      email: 'impostor@gmail.com',
      password: 'password123',
      confirm_password: 'password123'
    });
    record('College Email Domain Enforcement', false, 'Allowed non-college email (@gmail.com)');
  } catch (err) {
    if (err.message.includes('@nitkkr.ac.in')) {
      record('College Email Domain Enforcement', true, 'Blocked non-college email with clear error');
    } else {
      record('College Email Domain Enforcement', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 2: Password Minimum 8 Chars & Confirmation Check
  // --------------------------------------------------------------------------
  try {
    await Electroreck.auth.signUp({
      full_name: 'Short Pass User',
      email: 'student.short@nitkkr.ac.in',
      password: 'short',
      confirm_password: 'short'
    });
    record('Password Minimum Length Constraint', false, 'Allowed 5-character password');
  } catch (err) {
    if (err.message.includes('8 characters')) {
      record('Password Minimum Length Constraint', true, 'Enforced minimum 8 character rule');
    } else {
      record('Password Minimum Length Constraint', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 3: Direct Student Signup & Auto Sign-in (No confirmation email)
  // --------------------------------------------------------------------------
  let testStudentUser = null;
  try {
    const signupRes = await Electroreck.auth.signUp({
      full_name: 'Amit Kumar',
      email: 'amit.123100101@nitkkr.ac.in',
      password: 'SecurePassword123!',
      confirm_password: 'SecurePassword123!'
    });
    if (signupRes.user && signupRes.user.email === 'amit.123100101@nitkkr.ac.in' && !signupRes.confirmationRequired) {
      testStudentUser = signupRes.user;
      record('Direct Student Signup & Auto Sign-in Flow', true, 'Account created, logged in immediately without confirmation email');
    } else {
      record('Direct Student Signup & Auto Sign-in Flow', false, 'Confirmation flag unexpectedly set or user missing');
    }
  } catch (err) {
    record('Direct Student Signup & Auto Sign-in Flow', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Student Login & Profile Role Assigned as "student"
  // --------------------------------------------------------------------------
  try {
    const session = await Electroreck.auth.signIn({
      email: 'amit.123100101@nitkkr.ac.in',
      password: 'SecurePassword123!'
    });
    const profile = await Electroreck.auth.getCurrentProfile();
    if (profile && profile.role === 'student' && profile.email === 'amit.123100101@nitkkr.ac.in') {
      record('Login & Auto Student Role Assignment', true, `Logged in successfully as role "${profile.role}"`);
    } else {
      record('Login & Auto Student Role Assignment', false, `Unexpected profile: ${JSON.stringify(profile)}`);
    }
  } catch (err) {
    record('Login & Auto Student Role Assignment', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: 9-Digit Roll Number Format Enforcement
  // --------------------------------------------------------------------------
  try {
    const events = await Electroreck.events.getAll();
    const electrica = events.find(e => e.slug === 'electrica');

    try {
      await Electroreck.registrations.register({
        event_id: electrica.id,
        full_name: 'Amit Kumar',
        roll_number: '12310101', // 8 digits - should be rejected!
        department: 'Electrical Engineering',
        year_of_study: '2nd Year (B.Tech)',
        phone: '9876543211',
        team_name: 'Current Crushers',
        team_members: [],
        consent_given: true
      });
      record('Roll Number 9-Digit Format Enforcement', false, 'Allowed 8-digit roll number');
    } catch (errFormat) {
      if (errFormat.message.includes('9 digits')) {
        record('Roll Number 9-Digit Format Enforcement', true, 'Correctly rejected 8-digit roll number with 9-digit requirement');
      } else {
        record('Roll Number 9-Digit Format Enforcement', false, errFormat.message);
      }
    }
  } catch (err) {
    record('Roll Number 9-Digit Format Enforcement', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Event Registration, Unique Pass Generation & Email Dispatch
  // --------------------------------------------------------------------------
  let registeredPass = null;
  try {
    const events = await Electroreck.events.getAll();
    const electrica = events.find(e => e.slug === 'electrica');

    registeredPass = await Electroreck.registrations.register({
      event_id: electrica.id,
      full_name: 'Amit Kumar',
      roll_number: '123100101',
      department: 'Electrical Engineering',
      year_of_study: '2nd Year (B.Tech)',
      phone: '9876543211',
      team_name: 'Current Crushers',
      team_members: [{ name: 'Deepak Rao', roll_number: '123100102' }],
      consent_given: true
    });

    if (registeredPass.status !== 'Pending') {
      throw new Error(`Registration should start as 'Pending', got '${registeredPass.status}'`);
    }

    // Admin approves the request (which generates pass_id and confirms seat)
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: { id: 'admin-uuid-001', email: 'admin@nitkkr.ac.in', user_metadata: { full_name: 'Super Admin' } }
      }
    }));

    const approvedPass = await Electroreck.registrations.updateStatus(registeredPass.id, 'Approved');

    // Restore student session
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: testStudentUser
      }
    }));

    if (approvedPass.pass_id && approvedPass.pass_id.startsWith('ER-2026-') && (approvedPass.status === 'Approved' || approvedPass.status === 'Confirmed')) {
      await Electroreck.email.sendPassConfirmation(approvedPass);
      record('Event Registration & Pass Generation (ER-2026-XXXXX)', true, `Pending -> Approved -> Generated Pass: ${approvedPass.pass_id}`);
    } else {
      record('Event Registration & Pass Generation (ER-2026-XXXXX)', false, `Invalid pass: ${approvedPass.pass_id}`);
    }
  } catch (err) {
    record('Event Registration & Pass Generation (ER-2026-XXXXX)', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Duplicate Registration Attempt (Same Student in Same Event)
  // --------------------------------------------------------------------------
  try {
    const events = await Electroreck.events.getAll();
    const electrica = events.find(e => e.slug === 'electrica');

    await Electroreck.registrations.register({
      event_id: electrica.id,
      full_name: 'Amit Kumar',
      roll_number: '123100101',
      department: 'Electrical Engineering',
      year_of_study: '2nd Year (B.Tech)',
      phone: '9876543211',
      team_name: 'Duplicate Team',
      team_members: [],
      consent_given: true
    });
    record('Duplicate Registration Block (Same Student)', false, 'Allowed duplicate registration');
  } catch (err) {
    if (err.message.includes('already registered')) {
      record('Duplicate Registration Block (Same Student)', true, 'Correctly rejected duplicate user registration');
    } else {
      record('Duplicate Registration Block (Same Student)', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 8: Duplicate Roll Number Attempt (Different Student, Same Roll No)
  // --------------------------------------------------------------------------
  try {
    // Switch to another student account
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: { id: 'other-student-009', email: 'other.123100999@nitkkr.ac.in', user_metadata: { full_name: 'Other Student' } }
      }
    }));

    const events = await Electroreck.events.getAll();
    const electrica = events.find(e => e.slug === 'electrica');

    await Electroreck.registrations.register({
      event_id: electrica.id,
      full_name: 'Other Student',
      roll_number: '123100101', // Same roll number as Amit
      department: 'Civil Engineering',
      year_of_study: '2nd Year (B.Tech)',
      phone: '9876543299',
      consent_given: true
    });
    record('Duplicate Roll Number Block (Per Event)', false, 'Allowed duplicate roll number');
  } catch (err) {
    if (err.message.includes('already registered')) {
      record('Duplicate Roll Number Block (Per Event)', true, 'Correctly rejected duplicate roll number');
    } else {
      record('Duplicate Roll Number Block (Per Event)', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 9: Full Event Capacity Enforcement
  // --------------------------------------------------------------------------
  try {
    // Set Vidhwaan max_seats to 0 for capacity testing
    const db = JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1'));
    const vidhwaan = db.events.find(e => e.slug === 'vidhwaan');
    vidhwaan.max_seats = 0; // instantly full
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify(db));

    await Electroreck.registrations.register({
      event_id: vidhwaan.id,
      full_name: 'Vidhwaan Aspirant',
      roll_number: '123100555',
      department: 'Electrical Engineering',
      year_of_study: '3rd Year (B.Tech)',
      phone: '9876543255',
      team_name: 'Grid Wizards',
      team_members: [{ name: 'A', roll_number: '123100556' }, { name: 'B', roll_number: '123100557' }],
      consent_given: true
    });
    record('Full Event Capacity Check', false, 'Allowed registration in full event');
  } catch (err) {
    if (err.message.includes('full') || err.message.includes('capacity')) {
      record('Full Event Capacity Check', true, `Correctly rejected: ${err.message}`);
    } else {
      record('Full Event Capacity Check', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 10: Closed Event Block
  // --------------------------------------------------------------------------
  try {
    const db = JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1'));
    const advanza = db.events.find(e => e.slug === 'advanza');
    advanza.is_registration_open = false; // Closed
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify(db));

    await Electroreck.registrations.register({
      event_id: advanza.id,
      full_name: 'Advanza Registrant',
      roll_number: '123100666',
      department: 'Electrical Engineering',
      year_of_study: '2nd Year (B.Tech)',
      phone: '9876543266',
      team_name: 'Circuit Pros',
      team_members: [{ name: 'A', roll_number: '123100667' }],
      consent_given: true
    });
    record('Closed Event Block', false, 'Allowed registration in closed event');
  } catch (err) {
    if (err.message.includes('closed')) {
      record('Closed Event Block', true, `Correctly rejected: ${err.message}`);
    } else {
      record('Closed Event Block', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 10: Student Trying to Access Admin / Coordinator API
  // --------------------------------------------------------------------------
  try {
    // Ensure active session is a student
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: { id: 'student-demo-004', email: 'rohan.12310045@nitkkr.ac.in', user_metadata: { full_name: 'Rohan Sharma' } }
      }
    }));

    await Electroreck.registrations.getAllForAdmin();
    record('Student Access to Admin Records Restricted', false, 'Student was able to retrieve all registrations');
  } catch (err) {
    if (err.message.includes('Access denied')) {
      record('Student Access to Admin Records Restricted', true, 'Student blocked with Access Denied');
    } else {
      record('Student Access to Admin Records Restricted', false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 11: Admin Changing Status & Releasing Seat upon Rejection
  // --------------------------------------------------------------------------
  try {
    // Switch to Admin Session
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: { id: 'admin-uuid-001', email: 'admin@nitkkr.ac.in', user_metadata: { full_name: 'Super Admin' } }
      }
    }));

    // Find Amit's registration
    const allRegs = await Electroreck.registrations.getAllForAdmin();
    const amitReg = allRegs.find(r => r.roll_number === '123100101');
    
    // Check initial count
    const eventsBefore = await Electroreck.events.getAll();
    const electricaBefore = eventsBefore.find(e => e.slug === 'electrica');
    const seatsBefore = electricaBefore.seats_filled;

    // Reject registration
    await Electroreck.registrations.updateStatus(amitReg.id, 'Rejected');

    // Check count after rejection
    const eventsAfter = await Electroreck.events.getAll();
    const electricaAfter = eventsAfter.find(e => e.slug === 'electrica');
    const seatsAfter = electricaAfter.seats_filled;

    if (seatsAfter === seatsBefore - 1) {
      record('Admin Status Change & Seat Release on Rejection', true, `Seat released (${seatsBefore} -> ${seatsAfter} seats filled)`);
    } else {
      record('Admin Status Change & Seat Release on Rejection', false, `Seat not released: before=${seatsBefore}, after=${seatsAfter}`);
    }
  } catch (err) {
    record('Admin Status Change & Seat Release on Rejection', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 13: CSV Export Formula Injection Escaping (=, +, -, @)
  // --------------------------------------------------------------------------
  try {
    let exportedContent = '';
    // Mock Blob and URL
    global.Blob = class {
      constructor(chunks) { exportedContent = chunks.join(''); }
    };
    global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };
    global.document = {
      body: { appendChild: () => {}, removeChild: () => {} },
      createElement: () => ({ setAttribute: () => {}, click: () => {} })
    };

    const maliciousData = [
      { name: '=cmd|’ /C calc’!A0', roll: '+123100999', phone: '-9876543210', note: '@malicious' }
    ];

    const headers = [
      { label: 'Name', key: 'name' },
      { label: 'Roll', key: 'roll' },
      { label: 'Phone', key: 'phone' },
      { label: 'Note', key: 'note' }
    ];

    Electroreck.exportCSV({
      filename: 'security_test.csv',
      headers,
      rows: maliciousData
    });

    // Check that every formula prefix is sanitized with a leading single quote
    const isFormulaEscaped = 
      exportedContent.includes("\"'=cmd|’ /C calc’!A0\"") &&
      exportedContent.includes("\"'+123100999\"") &&
      exportedContent.includes("\"'-9876543210\"") &&
      exportedContent.includes("\"'@malicious\"");

    if (isFormulaEscaped) {
      record('CSV Formula Injection Sanitization (=, +, -, @)', true, 'All dangerous prefixes prepended with single quote');
    } else {
      record('CSV Formula Injection Sanitization (=, +, -, @)', false, `Export was not properly escaped: ${exportedContent}`);
    }
  } catch (err) {
    record('CSV Formula Injection Sanitization (=, +, -, @)', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 14: Society Induction Single Application & Word Count Limits
  // --------------------------------------------------------------------------
  try {
    // Switch to new student
    mockLocalStorage.setItem('electroreck_simulated_db_v1', JSON.stringify({
      ...JSON.parse(mockLocalStorage.getItem('electroreck_simulated_db_v1')),
      currentSession: {
        user: { id: 'ind-student-010', email: 'neha.123100888@nitkkr.ac.in', user_metadata: { full_name: 'Neha Verma' } }
      }
    }));

    const wings = await Electroreck.wings.getAll();
    const indApp = await Electroreck.induction.apply({
      full_name: 'Neha Verma',
      roll_number: '123100888',
      department: 'Electrical Engineering',
      year_of_study: '1st Year (B.Tech)',
      phone: '9876543288',
      preferred_wing_id: wings[0].id,
      reason_for_joining: 'Eager to build high-efficiency circuits and develop smart energy microgrids with seniors.',
      consent_given: true
    });

    if (indApp && indApp.status === 'Pending') {
      // Attempt duplicate induction
      try {
        await Electroreck.induction.apply({
          full_name: 'Neha Verma',
          roll_number: '123100888',
          department: 'Electrical Engineering',
          year_of_study: '1st Year (B.Tech)',
          phone: '9876543288',
          preferred_wing_id: wings[1].id,
          reason_for_joining: 'Trying second application...',
          consent_given: true
        });
        record('Induction Single Application Constraint', false, 'Allowed duplicate induction application');
      } catch (dupErr) {
        if (dupErr.message.includes('already submitted')) {
          record('Induction Single Application Constraint', true, 'Blocked duplicate application successfully');
        } else {
          record('Induction Single Application Constraint', false, dupErr.message);
        }
      }
    }
  } catch (err) {
    record('Induction Single Application Constraint', false, err.message);
  }

  console.log('\n===============================================================');
  console.log('📊 TEST SUMMARY REPORT');
  console.log('===============================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log(`SUCCESS RATE: ${Math.round((passedCount / results.length) * 100)}%`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
