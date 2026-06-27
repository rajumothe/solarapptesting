const { Installation, ServiceTicket, Order, User, Lead } = require('../models/coreModels');
const { Op } = require('sequelize');

// 1. Installation Workflows progress updater
const updateInstallationStatus = async (req, res) => {
    try {
        const { installationId, status, customerPhotoProof, customerSignatureName } = req.body;
        
        const installation = await Installation.findByPk(installationId);
        if (!installation) return res.status(404).json({ message: 'Installation record missing.' });

        installation.status = status;
        if (customerPhotoProof) installation.customerPhotoProof = customerPhotoProof;
        if (customerSignatureName) installation.customerSignatureName = customerSignatureName;
        if (status === 'Completed') installation.installedAt = new Date();

        await installation.save({ userId: req.user.id });
        return res.status(200).json({ message: `Installation status advanced to: ${status}`, installation });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update installation progress.', error: error.message });
    }
};

// Dispatch a technician to a specific installation job using route parameters
const assignInstallationCrew = async (req, res) => {
    try {
        const { id } = req.params;
        const { engineerId } = req.body;

        const install = await Installation.findByPk(id);
        if (!install) return res.status(404).json({ message: 'Installation log entry missing.' });

        install.assignedEngineerId = engineerId;
        install.status = 'Assigned';
        await install.save({ userId: req.user.id });

        return res.status(200).json({ message: 'Installation team dispatched to target site parameters.', install });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to complete crew dispatch allocation.', error: error.message });
    }
};

// Log customer emergency maintenance tickets linked to Customer Code
const raiseServiceTicket = async (req, res) => {
    try {
        const { customerCode, pincode, issueDescription } = req.body;

        if (!customerCode || !pincode || !issueDescription) {
            return res.status(400).json({ message: 'Validation Error: Customer code, pincode and issue parameters are mandatory.' });
        }

        const ticket = await ServiceTicket.create({
            customerCode,
            raisedByUserId: req.user.id,
            pincode,
            issueDescription,
            status: 'Open'
        }, { userId: req.user.id });

        return res.status(201).json({ message: 'Service ticket registered onto territory grid.', ticket });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to log service ticket.', error: error.message });
    }
};

// Fetch tickets raised by the current logged-in employee context profile
const getMyRaisedTickets = async (req, res) => {
    try {
        const tickets = await ServiceTicket.findAll({
            where: { raisedByUserId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        
        // Map matching customerName fields from Leads model table for UI representation
        const enrichedTickets = await Promise.all(tickets.map(async (ticket) => {
            const leadData = await Lead.findOne({ where: { customerCode: ticket.customerCode }, attributes: ['customerName'] });
            const ticketRaw = ticket.toJSON();
            ticketRaw.customerName = leadData ? leadData.customerName : 'Account Active';
            return ticketRaw;
        }));

        return res.status(200).json(enrichedTickets);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to extract personal raised tickets ledger.', error: error.message });
    }
};

// Engineer Tool: Pull up open unassigned tickets matching engineer pincodes
const getAvailableTicketsByLocation = async (req, res) => {
    try {
        const engineerPincodes = req.user.pincodeAccess ? req.user.pincodeAccess.split(',') : [];
        
        const openTickets = await ServiceTicket.findAll({
            where: {
                pincode: { [Op.in]: engineerPincodes },
                assignedEngineerId: null,
                status: 'Open'
            }
        });
        return res.status(200).json(openTickets);
    } catch (error) {
        return res.status(500).json({ message: 'Failed fetching location-based service grid.', error: error.message });
    }
};

// Assign/Route a specific support ticket to a field engineer via route parameters
const assignTicketToEngineer = async (req, res) => {
    try {
        const { id } = req.params;
        const { engineerId } = req.body;

        const ticket = await ServiceTicket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: 'Service ticket data row missing.' });

        ticket.assignedEngineerId = engineerId || req.user.id;
        ticket.status = 'Assigned';
        await ticket.save({ userId: req.user.id });

        return res.status(200).json({ message: 'Ticket assigned cleanly to targeted technician profile.', ticket });
    } catch (error) {
        return res.status(500).json({ message: 'Ticket route update failed.', error: error.message });
    }
};

// Step-by-Step Ticket Progress Tracker
const updateTicketProgress = async (req, res) => {
    try {
        const { ticketId, status, spareDetailsRequired, nextAvailabilityDate, resolutionPhotoProof } = req.body;
        
        const ticket = await ServiceTicket.findByPk(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket data row missing.' });

        ticket.status = status;
        if (status === 'Spare Required') {
            ticket.spareDetailsRequired = spareDetailsRequired;
            ticket.nextAvailabilityDate = nextAvailabilityDate;
        }
        if (resolutionPhotoProof) ticket.resolutionPhotoProof = resolutionPhotoProof;

        await ticket.save({ userId: req.user.id });
        return res.status(200).json({ message: `Ticket moved securely to state: [${status}]`, ticket });
    } catch (error) {
        return res.status(500).json({ message: 'Failed updating engineer status log.', error: error.message });
    }
};

// Fetch all installations queued across territories
const getInstallationsList = async (req, res) => {
    try {
        const installs = await Installation.findAll({
            include: [{ model: User, as: 'Engineer', attributes: ['fullName'] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(installs);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch installations ledger.', error: error.message });
    }
};

// Fetch all service help desk support tickets
const getTicketsList = async (req, res) => {
    try {
        const tickets = await ServiceTicket.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(tickets);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to extract support tickets queue.', error: error.message });
    }
};

module.exports = {
    updateInstallationStatus,
    assignInstallationCrew,
    raiseServiceTicket,
    getMyRaisedTickets, // Exported to provide support tracking visibility histories
    getAvailableTicketsByLocation,
    assignTicketToEngineer,
    updateTicketProgress,
    getInstallationsList,
    getTicketsList
};