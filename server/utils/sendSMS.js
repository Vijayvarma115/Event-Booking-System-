// Twilio SMS utilities
let client = null;

// Debug: Check environment variables
console.log('🔍 Debug Twilio Setup:');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Loaded' : '❌ Missing');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Loaded' : '❌ Missing');
console.log('  TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? '✅ Loaded' : '❌ Missing');
console.log('  TWILIO_VERIFY_SERVICE_SID:', process.env.TWILIO_VERIFY_SERVICE_SID ? '✅ Loaded' : '❌ Missing');

// Initialize Twilio client only if credentials are available
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client initialized successfully');
  } else {
    console.warn('⚠️ Twilio credentials missing - client not initialized');
  }
} catch (error) {
  console.error('❌ Twilio initialization error:', error.message);
}

/**
 * Send SMS using Twilio
 * @param {string} to - Phone number in E.164 format (e.g., +1234567890)
 * @param {string} message - SMS message content
 */
const sendSMS = async (to, message) => {
  try {
    // Check if Twilio is initialized
    if (!client) {
      console.warn('⚠️ Twilio not configured. Skipping SMS.');
      return { success: false, error: 'Twilio not configured' };
    }

    // Check if Twilio phone number is configured
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️ Twilio phone number not configured. Skipping SMS.');
      return { success: false, error: 'Twilio phone number not configured' };
    }

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`✅ SMS sent successfully to ${to}. SID: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP verification code via SMS
 * @param {string} phoneNumber - Phone number in E.164 format
 * @returns {Promise<Object>}
 */
const sendVerificationCode = async (phoneNumber) => {
  try {
    // Check if Twilio is initialized
    if (!client) {
      console.warn('⚠️ Twilio not configured. Skipping verification.');
      return { success: false, error: 'Twilio not configured. Please install: npm install twilio' };
    }

    // Check if Twilio Verify is configured
    if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.warn('⚠️ Twilio Verify Service not configured. Skipping verification.');
      return { success: false, error: 'Twilio Verify Service not configured' };
    }

    console.log(`📱 Attempting to send verification code to: ${phoneNumber}`);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    console.log(`✅ Verification code sent to ${phoneNumber}. Status: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (error) {
    console.error('❌ Error sending verification code to', phoneNumber);
    console.error('   Error:', error.message);
    console.error('   Full error:', JSON.stringify(error, null, 2));

    // Check for trial account restriction
    if (error.code === 21608 || error.message.includes('Trial')) {
      const trialError = '⚠️ TRIAL ACCOUNT RESTRICTION: You can only send SMS to verified phone numbers. Go to Twilio Console → Phone Numbers → Verified Caller IDs to add your phone number.';
      console.error(trialError);
      return { success: false, error: trialError };
    }

    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP code
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} code - Verification code
 * @returns {Promise<Object>}
 */
const verifyCode = async (phoneNumber, code) => {
  try {
    // Check if Twilio is initialized
    if (!client) {
      console.warn('⚠️ Twilio not configured. Skipping verification.');
      return { success: false, error: 'Twilio not configured. Please install: npm install twilio' };
    }

    // Check if Twilio Verify is configured
    if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
      console.warn('⚠️ Twilio Verify Service not configured. Skipping verification.');
      return { success: false, error: 'Twilio Verify Service not configured' };
    }

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phoneNumber, code: code });

    console.log(`✅ Verification status: ${verificationCheck.status}`);
    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status
    };
  } catch (error) {
    console.error('❌ Error verifying code:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSMS,
  sendVerificationCode,
  verifyCode
};
