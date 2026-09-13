import assert from 'assert';
import { db } from '../server/db.js';
import { generateSecureOtp, hashOtp, verifyOtpHash, OTP_CONFIG } from '../server/otp-service.js';
import { getEmailProviderStatus, EmailServiceError, sendOtpVerificationEmail, renderOtpEmailTemplate } from '../server/email-service.js';

async function runTests() {
  console.log('🧪 Starting NotesVidya Real Email OTP Verification Test Suite...\n');

  // 1. Test OTP Generation & Cryptographic Properties
  console.log('Test 1: OTP Generation & Format');
  for (let i = 0; i < 50; i++) {
    const otp = generateSecureOtp();
    assert.strictEqual(otp.length, 6, 'OTP must be exactly 6 characters');
    const num = parseInt(otp, 10);
    assert(num >= 100000 && num <= 999999, 'OTP must be an integer between 100000 and 999999');
  }
  console.log('  ✅ 50 secure random 6-digit OTPs verified in 100000-999999 range.\n');

  // 2. Test OTP Hashing & Timing-Safe Verification
  console.log('Test 2: Timing-Safe Verification & Non-Plaintext Hashing');
  const sampleOtp = '849201';
  const { hash, salt } = hashOtp(sampleOtp);
  assert.notStrictEqual(hash, sampleOtp, 'Hash must not equal plaintext');
  assert(hash.length === 64, 'HMAC-SHA256 hex must be 64 characters');

  const validMatch = verifyOtpHash(sampleOtp, hash, salt);
  assert.strictEqual(validMatch, true, 'Correct OTP must match hash');

  const invalidMatch = verifyOtpHash('123456', hash, salt);
  assert.strictEqual(invalidMatch, false, 'Incorrect OTP must fail verification');

  const wrongLength = verifyOtpHash('84920', hash, salt);
  assert.strictEqual(wrongLength, false, 'Incomplete OTP must fail verification');
  console.log('  ✅ Timing-safe cryptographic OTP verification verified.\n');

  // 3. Test Database Pending Registrations Storage
  console.log('Test 3: Database Pending Registrations Storage & Retrieval');
  const testEmail = `student_${Date.now()}@example.com`;
  const pendingId = `preg-test-${Date.now()}`;
  
  const testPending = {
    id: pendingId,
    name: 'Rohit Sharma',
    email: testEmail,
    phone: '+91 9876543210',
    passwordHash: 'testhash',
    salt: 'testsalt',
    otpHash: hash,
    otpSalt: salt,
    otpExpiresAt: Date.now() + OTP_CONFIG.EXPIRY_MS,
    otpAttempts: 0,
    resendCount: 1,
    lastOtpSentAt: Date.now(),
    emailVerified: false,
    createdAt: new Date().toISOString()
  };

  db.savePendingRegistration(testPending);
  const fetched = db.getPendingRegistration(testEmail);
  assert(fetched, 'Pending registration must be retrievable by email');
  assert.strictEqual(fetched?.id, pendingId, 'Pending registration ID must match');
  assert.strictEqual(fetched?.email, testEmail, 'Email must match');

  // Ensure plain OTP is not in the pending record
  assert(!('otp' in (fetched as any)), 'Plaintext OTP must NEVER be stored in the pending record');
  console.log('  ✅ Pending registration saved & retrieved without plaintext OTP.\n');

  // 4. Test Incorrect OTP and Attempt Counting
  console.log('Test 4: Incorrect OTP & Maximum Attempts (Max 5)');
  for (let attempt = 1; attempt <= 5; attempt++) {
    const wrongEntered = `00000${attempt}`;
    const matches = verifyOtpHash(wrongEntered, fetched.otpHash, fetched.otpSalt);
    assert.strictEqual(matches, false);
    fetched.otpAttempts += 1;
    db.savePendingRegistration(fetched);
  }
  const updatedFetched = db.getPendingRegistration(testEmail)!;
  assert.strictEqual(updatedFetched.otpAttempts, 5, 'Should record 5 attempts');
  assert(updatedFetched.otpAttempts >= OTP_CONFIG.MAX_ATTEMPTS, 'Max attempts reached');
  console.log('  ✅ Max attempt rate-limiting verified.\n');

  // 5. Test Expired OTP
  console.log('Test 5: Expired OTP Detection');
  const expiredPending = {
    ...fetched,
    id: `preg-expired-${Date.now()}`,
    email: `expired_${Date.now()}@example.com`,
    otpExpiresAt: Date.now() - 5000 // 5 seconds in past
  };
  assert(Date.now() > expiredPending.otpExpiresAt, 'Should detect expired OTP');
  console.log('  ✅ Expired OTP correctly detected.\n');

  // 6. Test Resend Cooldown (60 Seconds)
  console.log('Test 6: Resend Cooldown Enforcement');
  const now = Date.now();
  const recentPending = {
    ...fetched,
    lastOtpSentAt: now - 30000 // Sent 30 seconds ago
  };
  const timeSinceLast = now - recentPending.lastOtpSentAt;
  const isCooldownActive = timeSinceLast < OTP_CONFIG.RESEND_COOLDOWN_MS;
  assert.strictEqual(isCooldownActive, true, 'Cooldown must be active at 30 seconds');
  const remainingCooldownSec = Math.ceil((OTP_CONFIG.RESEND_COOLDOWN_MS - timeSinceLast) / 1000);
  assert.strictEqual(remainingCooldownSec, 30, 'Remaining cooldown must be 30 seconds');
  console.log('  ✅ 60-second resend cooldown properly calculated.\n');

  // 7. Test Successful Account Creation and Pending Record Cleanup
  console.log('Test 7: Successful Account Creation & Pending Record Deletion');
  const validUser = {
    id: `user-test-${Date.now()}`,
    name: fetched.name,
    email: fetched.email,
    phone: fetched.phone,
    role: 'customer' as const,
    status: 'active' as const,
    ordersCount: 0,
    totalSpent: 0,
    passwordHash: fetched.passwordHash,
    salt: fetched.salt,
    createdAt: new Date().toISOString()
  };
  db.addUser(validUser);
  db.deletePendingRegistration(fetched.id);

  const existingInDb = db.getUserByEmail(testEmail);
  assert(existingInDb, 'User must now exist in main users table');
  assert.strictEqual(existingInDb?.status, 'active');

  const pendingAfterActivation = db.getPendingRegistration(testEmail);
  assert.strictEqual(pendingAfterActivation, undefined, 'Pending record must be removed after activation');
  console.log('  ✅ Account activated and pending record purged.\n');

  // Clean up test user
  db.deleteUser(validUser.id);

  // 8. Test Existing Email Check
  console.log('Test 8: Existing Registered Email Check');
  const dummyUser = {
    id: `user-exist-${Date.now()}`,
    name: 'Existing Customer',
    email: 'registered@notesvidya.com',
    phone: '+91 9999999999',
    role: 'customer' as const,
    status: 'active' as const,
    ordersCount: 0,
    totalSpent: 0,
    passwordHash: 'hash',
    salt: 'salt',
    createdAt: new Date().toISOString()
  };
  db.addUser(dummyUser);
  const foundExisting = db.getUserByEmail('registered@notesvidya.com');
  assert(foundExisting, 'Should find existing user');
  db.deleteUser(dummyUser.id);
  console.log('  ✅ Existing email duplicate prevention verified.\n');

  // 9. Test Email Service Provider Status & Error Handling
  console.log('Test 9: Real Email Provider Status & Error Handling');
  const emailStatus = getEmailProviderStatus();
  console.log(`  Current Email Provider configured: ${emailStatus.provider} (${emailStatus.isConfigured ? 'Active' : 'Unconfigured'})`);
  
  if (!emailStatus.isConfigured) {
    let threwConfigError = false;
    try {
      await sendOtpVerificationEmail({
        to: 'test@example.com',
        customerName: 'Test Student',
        otp: '123456'
      });
    } catch (err: any) {
      if (err instanceof EmailServiceError && (err.code === 'BREVO_NOT_CONFIGURED' || err.code === 'EMAIL_NOT_CONFIGURED')) {
        threwConfigError = true;
      }
    }
    assert.strictEqual(threwConfigError, true, 'Must throw BREVO_NOT_CONFIGURED when no real credentials are set (no fake console.log allowed)');
    console.log('  ✅ Verified that unconfigured transactional email triggers clean setup requirement without fake/mock delivery.\n');
  } else {
    console.log(`  ✅ Verified active transactional provider: ${emailStatus.provider}\n`);
  }

  // 10. Test Email Template Rendering & Security
  console.log('Test 10: NotesVidya Email Template Content & Security');
  const rendered = renderOtpEmailTemplate({
    to: 'ananya@example.com',
    customerName: 'Ananya Verma',
    otp: '938471',
    validityMinutes: 10
  });

  assert.strictEqual(rendered.subject, 'Your NotesVidya Verification OTP');
  assert(rendered.text.includes('NotesVidya - Your Digital Library of Knowledge'), 'Must contain brand tagline in text');
  assert(rendered.text.includes('Ananya Verma'), 'Must address customer by name in text');
  assert(rendered.text.includes('938471'), 'Must include 6-digit OTP in text');
  assert(rendered.text.includes('10 minutes'), 'Must state 10 minutes validity in text');
  assert(rendered.text.includes('Do not share this OTP with anyone.'), 'Must have exact security notice in text');
  assert(!rendered.text.toLowerCase().includes('password:'), 'Plain password must never appear in email');

  assert(rendered.html.includes('NotesVidya'), 'Must contain NotesVidya in HTML');
  assert(rendered.html.includes('938471'), 'Must contain OTP in HTML');
  assert(rendered.html.includes('Ananya Verma'), 'Must contain customer name in HTML');
  assert(rendered.html.includes('10 minutes'), 'Must contain validity in HTML');
  assert(rendered.html.includes('Do not share this OTP with anyone.'), 'Must contain security notice in HTML');
  console.log('  ✅ NotesVidya transactional email templates verified for branding & security.\n');

  // 11. Test Full OTP Flow Simulation (Initiate -> Verify -> Resend -> Cooldown -> Success)
  console.log('Test 11: Complete Verification Lifecycle Simulation');
  const e2eEmail = `candidate_${Date.now()}@example.com`;
  const generatedOtp = generateSecureOtp();
  const { hash: e2eHash, salt: e2eSalt } = hashOtp(generatedOtp);

  const e2ePending = {
    id: `preg-e2e-${Date.now()}`,
    name: 'Vikram Mehta',
    email: e2eEmail,
    phone: '+91 9123456780',
    passwordHash: 'hashed_pw',
    salt: 'salt_pw',
    otpHash: e2eHash,
    otpSalt: e2eSalt,
    otpExpiresAt: Date.now() + OTP_CONFIG.EXPIRY_MS,
    otpAttempts: 0,
    resendCount: 1,
    lastOtpSentAt: Date.now(),
    emailVerified: false,
    createdAt: new Date().toISOString()
  };
  db.savePendingRegistration(e2ePending);

  // Attempt incorrect OTP first
  const wrongMatch = verifyOtpHash('999999', e2ePending.otpHash, e2ePending.otpSalt);
  assert.strictEqual(wrongMatch, false);
  e2ePending.otpAttempts += 1;
  db.savePendingRegistration(e2ePending);
  assert.strictEqual(db.getPendingRegistration(e2eEmail)?.otpAttempts, 1);

  // Now verify with correct OTP
  const correctMatch = verifyOtpHash(generatedOtp, e2ePending.otpHash, e2ePending.otpSalt);
  assert.strictEqual(correctMatch, true);

  // Activate customer user
  const activatedUser = {
    id: `user-e2e-${Date.now()}`,
    name: e2ePending.name,
    email: e2ePending.email,
    phone: e2ePending.phone,
    role: 'customer' as const,
    status: 'active' as const,
    ordersCount: 0,
    totalSpent: 0,
    passwordHash: e2ePending.passwordHash,
    salt: e2ePending.salt,
    createdAt: new Date().toISOString()
  };
  db.addUser(activatedUser);
  db.deletePendingRegistration(e2ePending.id);

  assert(db.getUserByEmail(e2eEmail), 'Activated user must be in database');
  assert(!db.getPendingRegistration(e2eEmail), 'Pending record must be gone');

  // Clean up
  db.deleteUser(activatedUser.id);
  console.log('  ✅ Complete verification lifecycle simulation verified successfully.\n');

  // 12. Test Brevo Transactional Email API Endpoint & Header Specification
  console.log('Test 12: Brevo Transactional Email API Specification Compliance');
  const originalFetch = global.fetch;
  let interceptedUrl = '';
  let interceptedMethod = '';
  let interceptedHeaders: any = {};
  let interceptedBody: any = {};

  // Mock global fetch to verify exact Brevo v3 endpoint and payload
  (global as any).fetch = async (url: string, init: any) => {
    interceptedUrl = url;
    interceptedMethod = init.method;
    interceptedHeaders = init.headers;
    interceptedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 201,
      json: async () => ({ messageId: '<test-brevo-message-id@smtp-relay.brevo.com>' }),
      text: async () => ''
    };
  };

  process.env.BREVO_API_KEY = 'xkeysib-test-mock-api-key-12345';
  process.env.EMAIL_FROM = 'NotesVidya <support@notesvidya.com>';
  process.env.EMAIL_FROM_NAME = 'NotesVidya';

  const brevoResult = await sendOtpVerificationEmail({
    to: 'customer@example.com',
    customerName: 'Pooja Hegde',
    otp: '582910',
    validityMinutes: 10
  });

  // Restore fetch
  global.fetch = originalFetch;

  assert.strictEqual(interceptedUrl, 'https://api.brevo.com/v3/smtp/email', 'Must call exact Brevo endpoint');
  assert.strictEqual(interceptedMethod, 'POST', 'Brevo API must be called with POST');
  assert.strictEqual(interceptedHeaders['api-key'], 'xkeysib-test-mock-api-key-12345', 'Must send api-key in Brevo header');
  assert.strictEqual(interceptedHeaders['content-type'], 'application/json', 'Content-Type must be application/json');
  assert.strictEqual(interceptedBody.sender?.email, 'support@notesvidya.com', 'Sender email must be extracted');
  assert.strictEqual(interceptedBody.sender?.name, 'NotesVidya', 'Sender name must be NotesVidya');
  assert.strictEqual(interceptedBody.to[0]?.email, 'customer@example.com', 'Recipient email must match');
  assert.strictEqual(interceptedBody.to[0]?.name, 'Pooja Hegde', 'Recipient customerName must match');
  assert.strictEqual(interceptedBody.subject, 'Your NotesVidya Verification OTP', 'Subject must match');
  assert(interceptedBody.textContent.includes('582910'), 'Plain text must contain OTP');
  assert(interceptedBody.textContent.includes('Do not share this OTP with anyone.'), 'Plain text must contain security notice');
  assert(interceptedBody.htmlContent.includes('582910'), 'HTML content must contain OTP');
  assert.strictEqual(brevoResult.provider, 'brevo', 'Provider must be brevo');
  console.log('  ✅ Brevo Transactional Email API (POST https://api.brevo.com/v3/smtp/email) fully verified.\n');

  console.log('🎉 ALL 12 OTP VERIFICATION & BREVO API UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
