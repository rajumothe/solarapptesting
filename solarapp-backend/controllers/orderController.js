const { Order, Invoice, PaymentCollection, Lead } = require('../models/coreModels');

// Create Fresh Order Receipt
const createOrderReceipt = async (req, res) => {
    try {
        const { leadId, customerId, totalAmount, loanRequired, allocatedPincode } = req.body;

        // Advance the Lead status row safely to Converted
        const lead = await Lead.findByPk(leadId);
        if (lead) {
            lead.status = 'Converted';
            await lead.save({ userId: req.user.id });
        }

        const order = await Order.create({
            leadId,
            customerId,
            totalAmount,
            loanRequired,
            loanStatus: loanRequired ? 'Applied' : 'Not Applicable',
            orderStatus: 'Order Received',
            allocatedPincode
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Order receipt successfully ingested.', order });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to ingest order receipt.', error: error.message });
    }
};

// Fetch All Registered Corporate Orders (Resolves the 404 listing bug)
const getOrdersList = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{ model: Lead, attributes: ['customerName'] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to extract orders log matrix.', error: error.message });
    }
};

// Back Office Tool: Update Bank Loan Status Workflow
const manageLoanStatus = async (req, res) => {
    try {
        const { orderId, targetLoanStatus } = req.body; // Applied, Approved, Disbursed
        
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ message: 'Target order record missing.' });

        order.loanStatus = targetLoanStatus;
        if (targetLoanStatus === 'Approved') {
            order.orderStatus = 'Processing';
        }
        await order.save({ userId: req.user.id });

        return res.status(200).json({ message: `Loan tracking parameter shifted to: [${targetLoanStatus}].`, order });
    } catch (error) {
        return res.status(500).json({ message: 'Loan status configuration failure.', error: error.message });
    }
};

// Generate Commercial Invoice (Automated Math Setup)
const generateInvoice = async (req, res) => {
    try {
        const { orderId, basePrice, taxPercentage } = req.body;

        const calculatedTax = parseFloat(basePrice) * (parseFloat(taxPercentage) / 100);
        const finalGross = parseFloat(basePrice) + calculatedTax;
        const generatedNum = `INV-${Date.now()}`;

        const invoice = await Invoice.create({
            orderId,
            invoiceNumber: generatedNum,
            basePrice,
            taxAmount: calculatedTax,
            finalGrossAmount: finalGross
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Commercial invoice locked and finalized.', invoice });
    } catch (error) {
        return res.status(500).json({ message: 'Invoice formulation routine failed.', error: error.message });
    }
};

// Collection Tool: Register incoming cash, online, or finance payments
const recordPaymentCollection = async (req, res) => {
    try {
        const { orderId, amountCollected, paymentMode, transactionReference } = req.body;

        const collection = await PaymentCollection.create({
            orderId,
            amountCollected,
            paymentMode,
            transactionReference
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Payment collection logged successfully.', collection });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to record payment entry.', error: error.message });
    }
};

module.exports = {
    createOrderReceipt,
    getOrdersList,
    manageLoanStatus,
    generateInvoice,
    recordPaymentCollection
};