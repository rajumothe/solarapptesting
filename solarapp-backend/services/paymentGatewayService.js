/**
 * Payment Gateway Service - Razorpay Integration
 * Handles payment processing, webhook verification
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentGatewayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  /**
   * Create payment order
   */
  async createOrder(orderId, amount, customerEmail, customerName) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `order_${orderId}_${Date.now()}`,
        customer_id: orderId,
        notes: {
          orderId: orderId,
          customerEmail: customerEmail,
          customerName: customerName
        }
      };

      const order = await this.razorpay.orders.create(options);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        receipt: order.receipt
      };
    } catch (error) {
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      const text = `${orderId}|${paymentId}`;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      return generated_signature === signature;
    } catch (error) {
      throw new Error('Signature verification failed');
    }
  }

  /**
   * Fetch payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return {
        id: payment.id,
        amount: payment.amount / 100, // Convert from paise
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
        createdAt: new Date(payment.created_at * 1000)
      };
    } catch (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount, notes) {
    try {
      const refundData = {
        amount: amount * 100, // Convert to paise
        notes: notes || {}
      };

      const refund = await this.razorpay.payments.refund(paymentId, refundData);

      return {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000)
      };
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookBody, webhookSignature) {
    try {
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(webhookBody)
        .digest('hex');

      return generated_signature === webhookSignature;
    } catch (error) {
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Handle payment success webhook
   */
  async handlePaymentSuccess(paymentData) {
    return {
      orderId: paymentData.notes?.orderId,
      paymentId: paymentData.id,
      amount: paymentData.amount / 100,
      status: 'success',
      method: paymentData.method
    };
  }

  /**
   * Handle payment failure webhook
   */
  async handlePaymentFailure(paymentData) {
    return {
      orderId: paymentData.notes?.orderId,
      paymentId: paymentData.id,
      status: 'failed',
      errorCode: paymentData.error_code,
      errorDescription: paymentData.error_description
    };
  }

  /**
   * Create subscription (for recurring payments)
   */
  async createSubscription(planId, customerId, totalCount, quantity = 1) {
    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity: quantity,
        total_count: totalCount,
        notes: {
          customerId: customerId
        }
      });

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        nextPaymentDate: new Date(subscription.current_start * 1000)
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Verify EMI eligibility
   */
  async getEMIOptions(amount) {
    try {
      // This would typically call Razorpay API or your backend logic
      // For now, returning sample EMI options
      const emiOptions = [
        { months: 3, rate: 0, emi: Math.round(amount / 3) },
        { months: 6, rate: 1.5, emi: Math.round((amount * 1.015) / 6) },
        { months: 9, rate: 2, emi: Math.round((amount * 1.02) / 9) },
        { months: 12, rate: 2.5, emi: Math.round((amount * 1.025) / 12) }
      ];

      return emiOptions;
    } catch (error) {
      throw new Error(`Failed to fetch EMI options: ${error.message}`);
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(email, orderId, amount) {
    const emailService = require('./emailService');
    const paymentUrl = `${process.env.WEB_URL}/checkout?orderId=${orderId}`;

    await emailService.send({
      to: email,
      subject: 'Payment Reminder - SolarApp Order',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Payment Reminder</h2>
          <p>Your order #${orderId} is pending payment.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Amount Due:</strong> ₹${amount}</p>
          </div>
          <a href="${paymentUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">
            Complete Payment
          </a>
        </div>
      `
    });
  }
}

module.exports = new PaymentGatewayService();
