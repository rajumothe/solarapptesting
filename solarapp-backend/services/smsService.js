/**
 * SMS Service - Send OTP and notifications via SMS
 * Supports: Twilio, AWS SNS, Nexmo, Exotel
 */

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    this.initializeProvider();
  }

  initializeProvider() {
    if (this.provider === 'twilio') {
      this.twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else if (this.provider === 'aws-sns') {
      const AWS = require('aws-sdk');
      this.sns = new AWS.SNS({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
    } else if (this.provider === 'exotel') {
      // Exotel initialization
      this.exotelApiKey = process.env.EXOTEL_API_KEY;
      this.exotelApiToken = process.env.EXOTEL_API_TOKEN;
    }
  }

  /**
   * Generate OTP (4-6 digits)
   */
  generateOTP(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Send OTP
   */
  async sendOTP(phoneNumber, fullName) {
    const otp = this.generateOTP(6);
    
    const message = `Hi ${fullName}, your OTP for SolarApp is ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    
    try {
      await this.send(phoneNumber, message);
      return { success: true, otp };
    } catch (error) {
      console.error('OTP send error:', error);
      throw error;
    }
  }

  /**
   * Send lead assignment notification
   */
  async sendLeadNotification(phoneNumber, leadCode, leadName) {
    const message = `New lead assigned: ${leadName} (${leadCode}). Login to SolarApp for details.`;
    return this.send(phoneNumber, message);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(phoneNumber, appointmentTime) {
    const message = `Reminder: You have an appointment at ${appointmentTime}. Please confirm.`;
    return this.send(phoneNumber, message);
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(phoneNumber, orderId, orderAmount) {
    const message = `Order #${orderId} confirmed. Amount: ₹${orderAmount}. Thank you for your business!`;
    return this.send(phoneNumber, message);
  }

  /**
   * Send service ticket update
   */
  async sendTicketUpdate(phoneNumber, ticketId, status) {
    const message = `Service Ticket #${ticketId} status: ${status}. Track your ticket in SolarApp.`;
    return this.send(phoneNumber, message);
  }

  /**
   * Core send method
   */
  async send(phoneNumber, message) {
    // Validate phone number format
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Validate message length
    if (message.length > 160) {
      throw new Error('Message exceeds 160 characters');
    }

    try {
      if (this.provider === 'twilio') {
        return await this.sendViaTwilio(phoneNumber, message);
      } else if (this.provider === 'aws-sns') {
        return await this.sendViaSNS(phoneNumber, message);
      } else if (this.provider === 'exotel') {
        return await this.sendViaExotel(phoneNumber, message);
      } else {
        console.log(`[DEV MODE] SMS to ${phoneNumber}: ${message}`);
        return { success: true, messageId: 'dev-' + Date.now() };
      }
    } catch (error) {
      console.error('SMS send error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Twilio implementation
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      const result = await this.twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, messageId: result.sid };
    } catch (error) {
      throw error;
    }
  }

  /**
   * AWS SNS implementation
   */
  async sendViaSNS(phoneNumber, message) {
    const params = {
      Message: message,
      PhoneNumber: phoneNumber
    };
    
    try {
      const result = await this.sns.publish(params).promise();
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exotel implementation (for India)
   */
  async sendViaExotel(phoneNumber, message) {
    const axios = require('axios');
    const url = `https://api.exotel.com/v1/Accounts/${this.exotelApiKey}/Sms/send.json`;
    
    try {
      const response = await axios.post(
        url,
        {
          From: process.env.EXOTEL_SENDER_ID || 'SOLARAPP',
          To: phoneNumber,
          Body: message
        },
        {
          auth: {
            username: this.exotelApiKey,
            password: this.exotelApiToken
          }
        }
      );
      
      return { 
        success: true, 
        messageId: response.data.SMSMessage[0].Sid 
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate phone number (Indian format)
   */
  validatePhoneNumber(phoneNumber) {
    // Accept formats: +919876543210, 9876543210, +91-9876543210
    const regex = /^(\+91[-\s]?)?[0-9]{10}$/;
    return regex.test(phoneNumber.toString());
  }

  /**
   * Format phone number to standard format
   */
  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.toString().replace(/\D/g, '');
    
    // If Indian number without country code, add it
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(recipients, message) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.send(recipient, message);
        results.push({ 
          phoneNumber: recipient, 
          status: 'sent', 
          ...result 
        });
      } catch (error) {
        results.push({ 
          phoneNumber: recipient, 
          status: 'failed', 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Get SMS delivery status
   */
  async getStatus(messageId) {
    if (this.provider === 'twilio') {
      try {
        const message = await this.twilio.messages(messageId).fetch();
        return {
          messageId: message.sid,
          status: message.status,
          deliveredAt: message.date_sent
        };
      } catch (error) {
        throw error;
      }
    }
    
    throw new Error('Status check not supported for this provider');
  }
}

module.exports = new SMSService();
