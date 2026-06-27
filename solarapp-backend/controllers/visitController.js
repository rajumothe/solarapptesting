const { FieldVisit, Lead } = require('../models/coreModels');

const logFieldVisit = async (req, res) => {
    try {
        const { leadId, purpose, remarks, latitude, longitude, odometerKm } = req.body;
        const operatorId = (req.user && req.user.id) ? req.user.id : 1;

        if (!leadId || !purpose || latitude === undefined || longitude === undefined || odometerKm === undefined) {
            return res.status(400).json({ message: 'Validation Error: Required fields are missing.' });
        }

        const currentTotalKm = parseFloat(odometerKm || 0);

        // 1. Find the user's last recorded visit for today to calculate the GAP metrics
        const lastVisit = await FieldVisit.findOne({
            where: { visitedById: operatorId },
            order: [['createdAt', 'DESC']]
        });

        let gapKm = currentTotalKm;
        let gapMinutes = 0;

        if (lastVisit) {
            // Calculate distance gap since the last visit stop
            gapKm = Math.max(0, currentTotalKm - parseFloat(lastVisit.totalKmAtVisit || 0));
            
            // Calculate time gap (duration) since the last visit stop
            const timeDiffMs = new Date() - new Date(lastVisit.createdAt);
            gapMinutes = Math.round(timeDiffMs / 1000 / 60);
        }

        // 2. Commit the visit record with explicit gap breakdowns
        const visit = await FieldVisit.create({
            leadId: parseInt(leadId),
            purpose,
            remarks: remarks || '',
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            
            // Core audit fields
            odometerKm: gapKm,                    // Changes column to store the dynamic GAP Distance
            totalKmAtVisit: currentTotalKm,       // Stores the snapshot of overall KM at this exact moment
            gapMinutes: gapMinutes,               // Minutes elapsed since last stop
            
            visitedById: operatorId
        });

        return res.status(201).json({ 
            message: `Visit logged. Traveled ${gapKm.toFixed(3)} KM in last ${gapMinutes} mins since last stop.`, 
            visit 
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed writing visit log.', error: error.message });
    }
};

module.exports = { logFieldVisit };