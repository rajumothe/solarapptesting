/**
 * Email Service - Sends transactional emails
 * Supports multiple providers: SendGrid, AWS SES, Nodemailer
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'nodemailer';
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (this.provider === 'sendgrid') {
      // SendGrid configuration
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.mail = sgMail;
    } else if (this.provider === 'aws-ses') {
      // AWS SES configuration
      const AWS = require('aws-sdk');
      this.ses = new AWS.SES({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
    } else {
      // Nodemailer (default for development)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, fullName, resetToken) {
    const resetLink = `${process.env.WEB_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password. Click the button below to set a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          This link expires in 15 minutes.<br>
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">© 2026 SolarApp. All rights reserved.</p>
      </div>
    `;

    const textContent = `
      Password Reset Request
      
      Hi ${fullName},
      
      Reset your password here: ${resetLink}
      
      This link expires in 15 minutes.
      If you didn't request this, please ignore this email.
    `;

    return this.send({
      to: email,
      subject: 'Password Reset - SolarApp',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Send account verification email
   */
  async sendVerificationEmail(email, fullName, verificationToken) {
    const verificationLink = `${process.env.WEB_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SolarApp!</h2>
        <p>Hi ${fullName},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          This link expires in 24 hours.
        </p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'Email Verification - SolarApp',
      html: htmlContent
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(email, subject, title, message, actionUrl, actionText) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>${message}</p>
        ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              ${actionText || 'View Details'}
            </a>
          </div>
        ` : ''}
      </div>
    `;

    return this.send({
      to: email,
      subject: subject,
      html: htmlContent
    });
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, fullName, otp) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>One-Time Password (OTP)</h2>
        <p>Hi ${fullName},</p>
        <p>Your OTP is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #2563eb;">
            ${otp}
          </div>
        </div>
        <p style="color: #666; font-size: 12px;">
          This code expires in 10 minutes.<br>
          Do not share this code with anyone.
        </p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'Your OTP - SolarApp',
      html: htmlContent
    });
  }

  /**
   * Send lead assignment notification
   */
  async sendLeadAssignmentEmail(email, fullName, leadName, leadCode) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Lead Assigned</h2>
        <p>Hi ${fullName},</p>
        <p>A new lead has been assigned to you:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Lead Name:</strong> ${leadName}</p>
          <p><strong>Lead Code:</strong> ${leadCode}</p>
        </div>
        <p>Login to SolarApp to view more details and take action.</p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'New Lead Assigned - SolarApp',
      html: htmlContent
    });
  }

  /**
   * Send approval request email
   */
  async sendApprovalRequestEmail(email, fullName, itemType, itemId, actionUrl) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Approval Required</h2>
        <p>Hi ${fullName},</p>
        <p>A ${itemType} (ID: ${itemId}) requires your approval.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Review & Approve
          </a>
        </div>
      </div>
    `;

    return this.send({
      to: email,
      subject: `Approval Required - ${itemType} #${itemId}`,
      html: htmlContent
    });
  }

  /**
   * Core send method - dispatches to appropriate provider
   */
  async send(mailOptions) {
    try {
      if (this.provider === 'sendgrid') {
        return await this.sendViaSendGrid(mailOptions);
      } else if (this.provider === 'aws-ses') {
        return await this.sendViaSES(mailOptions);
      } else {
        return await this.sendViaNodemailer(mailOptions);
      }
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * SendGrid implementation
   */
  async sendViaSendGrid(mailOptions) {
    const msg = {
      to: mailOptions.to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@solarapp.com',
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text
    };
    return await this.mail.send(msg);
  }

  /**
   * AWS SES implementation
   */
  async sendViaSES(mailOptions) {
    const params = {
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@solarapp.com',
      Destination: {
        ToAddresses: [mailOptions.to]
      },
      Message: {
        Subject: { Data: mailOptions.subject },
        Body: {
          Html: { Data: mailOptions.html },
          Text: { Data: mailOptions.text }
        }
      }
    };
    return await this.ses.sendEmail(params).promise();
  }

  /**
   * Nodemailer implementation (default for development)
   */
  async sendViaNodemailer(mailOptions) {
    const mailConfig = {
      from: process.env.SMTP_FROM || 'noreply@solarapp.com',
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text
    };
    return await this.transporter.sendMail(mailConfig);
  }

  /**
   * Send bulk emails
   */
  async sendBulk(recipients, subject, template, templateVars) {
    const results = [];
    for (const email of recipients) {
      try {
        const result = await this.send({
          to: email,
          subject: subject,
          html: template(templateVars)
        });
        results.push({ email, status: 'sent', result });
      } catch (error) {
        results.push({ email, status: 'failed', error: error.message });
      }
    }
    return results;
  }
}

module.exports = new EmailService();
