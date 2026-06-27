const { Lead, CustomerKYC, ServiceTicket, User } = require('../models/coreModels');
const { Op } = require('sequelize');

// Helper function to extract starting points for Today and current Month-to-Date (MTD)
const getDateRanges = () => {
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return { todayStart, mtdStart };
};

// Unified Dashboard Analytics Engine
const getPerformanceMetrics = async (req, res) => {
    try {
        const { id: userId, roleId } = req.user;
        const currentRole = req.user.Role.roleName;
        const { todayStart, mtdStart } = getDateRanges();

        // 1. Build team visibility filter context based on organizational reporting hierarchy
        let userIdsToQuery = [userId];
        
        if (['ASM', 'RSM', 'HOD', 'Super Admin'].includes(currentRole)) {
            // Fetch directly reporting subordinates to compute aggregated group metrics
            const subordinates = await User.findAll({ where: { parentId: userId }, attributes: ['id'] });
            const subIds = subordinates.map(s => s.id);
            userIdsToQuery = [...userIdsToQuery, ...subIds];
        }

        // 2. Compute Executive & Managerial Pipeline Indicators
        const leadsToday = await Lead.count({
            where: { createdById: { [Op.in]: userIdsToQuery }, createdAt: { [Op.gte]: todayStart } }
        });

        const leadsMTD = await Lead.count({
            where: { createdById: { [Op.in]: userIdsToQuery }, createdAt: { [Op.gte]: mtdStart } }
        });

        const conversionsToday = await Lead.count({
            where: { createdById: { [Op.in]: userIdsToQuery }, status: 'Converted', updatedAt: { [Op.gte]: todayStart } }
        });

        const conversionsMTD = await Lead.count({
            where: { createdById: { [Op.in]: userIdsToQuery }, status: 'Converted', updatedAt: { [Op.gte]: mtdStart } }
        });

        // 3. Compute Technician/Field Service Indicators
        const assignedTicketsCount = await ServiceTicket.count({
            where: { assignedEngineerId: userId, status: { [Op.ne]: 'Completed' } }
        });

        const resolvedTicketsToday = await ServiceTicket.count({
            where: { assignedEngineerId: userId, status: 'Completed', updatedAt: { [Op.gte]: todayStart } }
        });

        // Mock Target calculation matrix (Target Vs Ach%)
        const targetVsAch = {
            targetCount: 20,
            achievementCount: leadsMTD,
            achievementPercentage: Math.min(Math.round((leadsMTD / 20) * 100), 100)
        };

        // Return structured dashboard responses matched to the client app context
        return res.status(200).json({
            roleContext: currentRole,
            metrics: {
                leads: { today: leadsToday, mtd: leadsMTD },
                conversions: { today: conversionsToday, mtd: conversionsMTD },
                fieldService: { activeAssignedTickets: assignedTicketsCount, resolvedToday: resolvedTicketsToday },
                performanceMatrix: targetVsAch
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Failed to aggregate dashboard intelligence matrix.', error: error.message });
    }
};

module.exports = {
    getPerformanceMetrics
};