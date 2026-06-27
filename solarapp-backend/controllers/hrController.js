// Safely import whatever model names are exported by coreModels
const coreModels = require('../models/coreModels');
const LeaveApplication = coreModels.LeaveApplication;
const ExpenseClaim = coreModels.ExpenseClaim;

// Safe fallback check: use Attendance if it exists, otherwise fall back to AttendanceLog
const Attendance = coreModels.Attendance || coreModels.AttendanceLog;

const { Op } = require('sequelize');

// Mobile Feature: Daily Check-In Timestamp & Automated Coordinate Baseline Logger
const handleCheckIn = async (req, res) => {
    try {
        if (!Attendance) {
            return res.status(500).json({ message: 'Database Configuration Error: Attendance model is not defined.' });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Validation Error: Check-In requires initial GPS telemetry coordinates.' });
        }
        
        // Find if an active row exists for this user today 
        const existingLog = await Attendance.findOne({ 
            where: { 
                userId: req.user.id, 
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                }
            } 
        });

        // Self-Healing session recovery block
        if (existingLog) {
            return res.status(200).json({ 
                message: 'Attendance session restored successfully.', 
                log: existingLog,
                alreadyMarked: true 
            });
        }

        // If fresh session
        const log = await Attendance.create({
            userId: req.user.id,
            checkInTime: new Date(),
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            accumulatedKm: "0.000",
            status: 'Active'
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Check-In log recorded successfully. Distance engine running.', log });
    } catch (error) {
        console.error("💥 Attendance Check-In Crash Log:", error);
        return res.status(500).json({ message: 'Attendance logging engine failed.', error: error.message });
    }
};

// Mobile Feature: Daily Check-Out & Final Automated Summary Ledger Calculation
const handleCheckOut = async (req, res) => {
    try {
        if (!Attendance) {
            return res.status(500).json({ message: 'Database Configuration Error: Attendance model is not defined.' });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { latitude, longitude, accumulatedKm } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Validation Error: Check-Out requires ending GPS coordinates.' });
        }
        
        const log = await Attendance.findOne({ 
            where: { 
                userId: req.user.id, 
                createdAt: {
                    [Op.between]: [todayStart, todayEnd]
                },
                status: 'Active'
            } 
        });
        if (!log) return res.status(404).json({ message: 'No active check-in log found for today. Check-in first.' });

        const currentCheckOutTime = new Date();
        const elapsedDurationMs = currentCheckOutTime - new Date(log.checkInTime || log.createdAt);
        const dynamicDutyMinutes = Math.round(elapsedDurationMs / 1000 / 60);

        log.checkOutTime = currentCheckOutTime;
        log.latitude = latitude.toString();
        log.longitude = longitude.toString();
        log.accumulatedKm = parseFloat(accumulatedKm || 0.000).toFixed(3);
        log.status = 'Completed';

        await log.save({ userId: req.user.id });

        return res.status(200).json({ 
            message: 'Check-Out tracking completed cleanly.', 
            summary: { totalKm: log.accumulatedKm, totalMinutes: dynamicDutyMinutes },
            log 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Attendance logging engine failed.', error: error.message });
    }
};

// Leave and OD Management Pipeline
const applyLeaveOrOD = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body; 
        const application = await LeaveApplication.create({
            userId: req.user.id,
            type,
            startDate,
            endDate,
            reason
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Leave/OD request routed to your manager.', application });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to process leave application.', error: error.message });
    }
};

// Expense & Travel Claims Management Pipeline
const submitExpenseClaim = async (req, res) => {
    try {
        const { claimType, amount, description, attachmentUrl } = req.body; 
        const claim = await ExpenseClaim.create({
            userId: req.user.id,
            claimType,
            amount,
            description,
            attachmentUrl
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Expense reimbursement claim filed successfully.', claim });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to file expense claim.', error: error.message });
    }
};

// Management Approval Workflows
// Management Approval Workflows
const evaluateLeaveRequest = async (req, res) => {
    try {
        // Extract parameters safely from request body
        const { applicationId, approvalDecision } = req.body; 
        
        if (!applicationId || !approvalDecision) {
            return res.status(400).json({ message: 'Validation Error: Both applicationId and approvalDecision fields are mandatory.' });
        }

        // Find the record entry using the Primary Key ID index
        const application = await LeaveApplication.findByPk(applicationId);
        if (!application) {
            return res.status(404).json({ message: `Application request row missing for ID: #${applicationId}` });
        }

        // IMPORTANT FIX: Map the decision safely to match the text fields expected by the database layout
        let finalStatusText = approvalDecision; 
        if (approvalDecision === 'Approved') finalStatusText = 'Approved';
        if (approvalDecision === 'Rejected') finalStatusText = 'Rejected';

        // Update the status column string directly
        application.status = finalStatusText;
        
        // Save changes permanently to the database ledger table
        await application.save({ userId: req.user.id });

        console.log(`✨ Leave request ID #${applicationId} updated successfully to status: [${finalStatusText}]`);

        return res.status(200).json({ 
            message: `Leave/OD request evaluated and marked successfully as: [${finalStatusText}].`,
            application 
        });
    } catch (error) {
        console.error("💥 Evaluate Leave Request Engine Crash:", error);
        return res.status(500).json({ message: 'Failed to execute management validation update.', error: error.message });
    }
};

const evaluateExpenseClaim = async (req, res) => {
    try {
        const { claimId, approvalDecision } = req.body; 
        const claim = await ExpenseClaim.findByPk(claimId);
        if (!claim) return res.status(404).json({ message: 'Expense claim file missing.' });

        claim.status = approvalDecision;
        await claim.save({ userId: req.user.id });

        return res.status(200).json({ message: `Expense claim evaluated as: [${approvalDecision}].` });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to evaluate financial expense line.', error: error.message });
    }
};

// Backend Controller: Check active attendance status for today
const checkTodayAttendanceStatus = async (req, res) => {
    try {
        if (!Attendance) return res.status(200).json({ hasCheckedIn: false });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const activeAttendance = await Attendance.findOne({
            where: {
                userId: req.user.id,
                createdAt: { [Op.between]: [todayStart, todayEnd] },
                status: 'Active'
            }
        });

        if (activeAttendance) {
            return res.status(200).json({
                hasCheckedIn: true,
                latitude: activeAttendance.latitude || "17.4583",
                longitude: activeAttendance.longitude || "78.3988",
                accumulatedKm: activeAttendance.accumulatedKm || "0.000",
                createdAt: activeAttendance.checkInTime || activeAttendance.createdAt
            });
        }

        return res.status(200).json({ hasCheckedIn: false });
    } catch (error) {
        return res.status(500).json({ message: 'Error checking attendance lifecycle.', error: error.message });
    }
};

// Fetch leave applications filed by the logged-in user
// Fetch leave applications filed by the logged-in user
const getMyLeaveApplications = async (req, res) => {
    try {
        const applications = await LeaveApplication.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        // Map column variables data properties cleanly before transferring down stream
        const normalizedApplications = applications.map(app => {
            let appStatus = app.status;
            // FIX: If database stores 'Pending Approval', translate it safely to 'Pending' for mobile CSS matching hooks
            if (appStatus === 'Pending Approval') {
                appStatus = 'Pending';
            }
            return {
                id: app.id,
                type: app.type,
                startDate: app.startDate,
                endDate: app.endDate,
                reason: app.reason,
                status: appStatus
            };
        });

        return res.status(200).json(normalizedApplications);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to extract requests log histories.', error: error.message });
    }
};

// Fetch user's summary metrics
const getMyMonthlySummaryGrid = async (req, res) => {
    try {
        if (!Attendance) return res.status(200).json([]);

        const records = await Attendance.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 31
        });

        const calendarMatrix = records.map(row => {
            let totalHoursStr = '--';
            const punchIn = row.checkInTime || row.createdAt;
            
            if (punchIn && row.checkOutTime) {
                const diffMs = new Date(row.checkOutTime) - new Date(punchIn);
                const totalMins = Math.floor(diffMs / 1000 / 60);
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                totalHoursStr = `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
            } else if (punchIn && row.status === 'Active') {
                totalHoursStr = 'Shift Open';
            }

            let displayTag = 'Present';
            if (row.leaveRefId) displayTag = 'Absent / Leave';
            if (row.isOnDutyField) displayTag = 'On Duty';

            return {
                date: new Date(row.createdAt).toISOString().split('T')[0],
                tag: displayTag,
                hours: totalHoursStr,
                km: row.accumulatedKm ? parseFloat(row.accumulatedKm).toFixed(3) : '0.000'
            };
        });

        return res.status(200).json(calendarMatrix);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to compute monthly metrics overview.', error: error.message });
    }
};

module.exports = {
    handleCheckIn,
    handleCheckOut,
    applyLeaveOrOD,
    submitExpenseClaim,
    evaluateLeaveRequest,
    evaluateExpenseClaim,
    checkTodayAttendanceStatus,
    getMyLeaveApplications,
    getMyMonthlySummaryGrid
};