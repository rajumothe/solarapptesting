/**
 * Two-Factor Authentication (2FA) Service
 * Supports: TOTP, SMS OTP, Email OTP
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('./emailService');
const smsService = require('./smsService');

class TwoFactorService {
  /**
   * Generate TOTP secret and QR code for user
   */
  async generateTOTPSecret(email, fullName) {
    const secret = speakeasy.generateSecret({
      name: `SolarApp (${email})`,
      issuer: 'SolarApp',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      backupCodes: this.generateBackupCodes(),
      qrCode: qrCode,
      manualEntryKey: secret.base32
    };
  }

  /**
   * Verify TOTP token
   */
  verifyTOTP(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  /**
   * Generate SMS OTP
   */
  async generateSMSOTP(phoneNumber, fullName) {
    const otp = smsService.generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via SMS
    await smsService.send(
      phoneNumber,
      `Your SolarApp OTP is ${otp}. Valid for 10 minutes. Do not share.`
    );

    return {
      expiresAt,
      method: 'sms'
    };
  }

  /**
   * Generate Email OTP
   */
  async generateEmailOTP(email, fullName) {
    const otp = this.generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await emailService.sendOTPEmail(email, fullName, otp);

    return {
      expiresAt,
      method: 'email'
    };
  }

  /**
   * Verify OTP
   */
  verifyOTP(providedOTP, actualOTP) {
    return providedOTP === actualOTP;
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateRandomCode());
    }
    return codes;
  }

  /**
   * Generate random backup code
   */
  generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(code, backupCodes) {
    return backupCodes.includes(code);
  }

  /**
   * Generate OTP (generic)
   */
  generateOTP(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }
}

module.exports = new TwoFactorService();
