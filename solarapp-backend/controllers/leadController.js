const { Lead, CustomerKYC, User } = require('../models/coreModels');
const { Op } = require('sequelize');

// Executive Tool: Create a fresh pipeline target lead
const createLead = async (req, res) => {
    try {
        const { customerName, contactNo, address, pincode, unitCapacitySelection, latitude, longitude } = req.body;
        const operatorId = (req.user && req.user.id) ? req.user.id : 1;

        const lead = await Lead.create({
            customerName,
            contactNo,
            address,
            pincode,
            unitCapacitySelection,
            latitude: latitude || "0.0000",
            longitude: longitude || "0.0000",
            createdById: operatorId,
            status: 'Lead Created' // Starts explicitly at base phase
        }, { userId: operatorId });

        return res.status(201).json({ 
            message: `Lead ${lead.leadCode} added cleanly to local territory database tracking.`, 
            lead 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed creating pipeline target record.', error: error.message });
    }
};

// Executive Tool: Convert an existing Lead into KYC verification pipeline
const convertLeadToCustomer = async (req, res) => {
    try {
        const { leadId, aadharNo, panNo, ebBillNo, bankAccountNo } = req.body;

        const lead = await Lead.findByPk(leadId);
        if (!lead) return res.status(404).json({ message: 'Target lead data record not found.' });

        // Update status flag to route the lead straight into the ASM clearance work queue
        lead.status = 'Pending ASM';
        await lead.save({ userId: req.user.id });

        const kyc = await CustomerKYC.create({
            leadId: parseInt(leadId),
            aadharNo,
            panNo,
            ebBillNo,
            bankAccountNo,
            asmApprovalStatus: 'Pending',
            backOfficeStatus: 'Pending'
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'KYC records filed successfully. Sent to ASM queue.', kyc });
    } catch (error) {
        return res.status(500).json({ message: 'Failed initializing KYC baseline conversion profile.', error: error.message });
    }
};

// 1. Management/ASM Tool: Evaluate compliance risk workflows
const asmEvaluateVerification = async (req, res) => {
    try {
        const { leadId, approvalDecision } = req.body; 
        
        if (!leadId || !approvalDecision) {
            return res.status(400).json({ message: "Validation Error: leadId and approvalDecision parameters are mandatory." });
        }

        const lead = await Lead.findByPk(leadId);
        if (!lead) return res.status(404).json({ message: 'Target lead profile unavailable.' });

        const kyc = await CustomerKYC.findOne({ where: { leadId } });
        // Optional creation guard if entry doesn't exist yet
        if (!kyc) return res.status(404).json({ message: 'Associated KYC document profile data row missing.' });

        if (approvalDecision === 'Approved') {
            kyc.asmApprovalStatus = 'Approved';
            lead.status = 'Pending Back Office'; // Forward to final back-office loop
        } else {
            kyc.asmApprovalStatus = 'Rejected';
            lead.status = 'Rejected';
        }

        await kyc.save({ userId: req.user.id });
        await lead.save({ userId: req.user.id });

        return res.status(200).json({ message: `ASM checkpoint resolved as: [${approvalDecision}]. Moving to Back Office loop.` });
    } catch (error) {
        return res.status(500).json({ message: 'ASM compliance verification update failed.', error: error.message });
    }
};

// 2. Back Office Tool: Ultimate authority for profile execution approval


// Back Office Tool: Ultimate authority for profile execution approval
const backOfficeFinalVerification = async (req, res) => {
    try {
        const { leadId, approvalDecision } = req.body; 

        if (!leadId || !approvalDecision) {
            return res.status(400).json({ message: "Validation Error: leadId and approvalDecision parameters are mandatory." });
        }
        
        const lead = await Lead.findByPk(leadId);
        if (!lead) return res.status(404).json({ message: 'Target lead reference entry not found.' });

        const kyc = await CustomerKYC.findOne({ where: { leadId } });
        if (!kyc) return res.status(404).json({ message: 'Compliance tracking record missing.' });

        if (approvalDecision === 'Approved') {
            kyc.backOfficeStatus = 'Verified';
            lead.status = 'Converted'; 

            // FIX: Query the highest customerCode string value currently in use
            const highestCodeRecord = await Lead.findOne({
                where: {
                    customerCode: {
                        [Op.ne]: null
                    }
                },
                order: [['customerCode', 'DESC']],
                attributes: ['customerCode'],
                raw: true
            });

            let nextSequenceNumber = 200000;

            if (highestCodeRecord && highestCodeRecord.customerCode) {
                // Extracts the number part from "SSS-200008" -> 200008, then increments it cleanly
                const numericPart = parseInt(highestCodeRecord.customerCode.replace('SSS-', ''), 10);
                if (!isNaN(numericPart)) {
                    nextSequenceNumber = numericPart + 1;
                }
            } else {
                // If this is the absolute first customer conversion on the platform
                nextSequenceNumber = 200001;
            }
            
            // Assign the non-clashing custom master tracking code
            lead.customerCode = `SSS-${nextSequenceNumber}`;
        } else {
            kyc.backOfficeStatus = 'Rejected';
            lead.status = 'Rejected';
        }

        await kyc.save({ userId: req.user.id });
        await lead.save({ userId: req.user.id });

        return res.status(200).json({ 
            message: `Back Office verification completed. Resolved status: [${lead.status}]`, 
            customerCode: lead.customerCode 
        });
    } catch (error) {
        console.error("💥 Back Office Error Log:", error);
        return res.status(500).json({ message: 'Back office terminal processing error occurred.', error: error.message });
    }
};



// Fetch all leads including their KYC profiles for administrative review desks
const getLeadsWithKYC = async (req, res) => {
    try {
        const list = await Lead.findAll({
            include: [{ model: CustomerKYC }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(list);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve workflow records pipeline.', error: error.message });
    }
};

module.exports = {
    createLead,
    convertLeadToCustomer,
    asmEvaluateVerification,
    backOfficeFinalVerification,
    getLeadsWithKYC
};