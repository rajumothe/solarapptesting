const { GroupMaster, ItemMaster, PriceMaster, GroupItemSpecification, User, Plant, SalesOffice, Role, SalesOfficePincode, UserSalesOfficeAccess } = require('../models/coreModels');

// ==========================================
// 1. GLOBAL ITEM SKU REPOSITORY CRUD METHODS
// ==========================================

const createItemMaster = async (req, res) => {
    try {
        const item = await ItemMaster.create(req.body, { userId: req.user.id });
        return res.status(201).json({ message: 'SKU Item component added successfully.', item });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create item.', error: error.message });
    }
};

const getItems = async (req, res) => {
    try {
        const items = await ItemMaster.findAll({ order: [['itemName', 'ASC']] });
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve components repository.', error: error.message });
    }
};

const updateItemMaster = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemMaster.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Target SKU Item not found.' });

        await item.update(req.body, { userId: req.user.id });
        return res.status(200).json({ message: 'SKU Item modified successfully.', item });
    } catch (error) {
        return res.status(500).json({ message: 'Item update transaction failed.', error: error.message });
    }
};

const toggleItemStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ItemMaster.findByPk(id);
        if (!item) return res.status(404).json({ message: 'SKU Item not found.' });

        item.isActive = !item.isActive;
        await item.save({ userId: req.user.id });
        return res.status(200).json({ message: `Item status toggled successfully to: ${item.isActive ? 'Active' : 'Disabled'}` });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to shift item availability parameters.', error: error.message });
    }
};


// ==========================================
// 2. PRODUCT GROUP MASTER CRUD METHODS
// ==========================================

const createGroupMaster = async (req, res) => {
    try {
        const { groupName, selectedItems } = req.body; 
        // selectedItems expected format: [{ itemId: 1, basePrice: 45000 }, { itemId: 2, basePrice: 200 }]

        const group = await GroupMaster.create({ groupName }, { userId: req.user.id });

        if (selectedItems && selectedItems.length > 0) {
            const junctionRecords = selectedItems.map(item => ({
                groupMasterId: group.id,
                itemMasterId: item.itemId,
                basePrice: item.basePrice
            }));
            await GroupItemSpecification.bulkCreate(junctionRecords);
        }

        return res.status(201).json({ message: 'Group Package and dynamic pricing specifications initialized.', group });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to assemble package group.', error: error.message });
    }
};

const getGroups = async (req, res) => {
    try {
        const groups = await GroupMaster.findAll({
            include: [{ model: ItemMaster, through: { attributes: ['basePrice'] } }],
            order: [['groupName', 'ASC']]
        });
        return res.status(200).json(groups);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve groups.', error: error.message });
    }
};

const updateGroupMaster = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupName, selectedItems } = req.body;

        const group = await GroupMaster.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Target group package data row missing.' });

        if (groupName) {
            await group.update({ groupName }, { userId: req.user.id });
        }

        if (selectedItems) {
            // Drop old specification matrix rows and recreate them atomically
            await GroupItemSpecification.destroy({ where: { groupMasterId: id } });
            const junctionRecords = selectedItems.map(item => ({
                groupMasterId: id,
                itemMasterId: item.itemId,
                basePrice: item.basePrice
            }));
            await GroupItemSpecification.bulkCreate(junctionRecords);
        }

        return res.status(200).json({ message: 'Group package configuration updated successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Group update routine encountered an error.', error: error.message });
    }
};

const toggleGroupStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await GroupMaster.findByPk(id);
        if (!group) return res.status(404).json({ message: 'Target system group structure not found.' });

        group.isActive = !group.isActive;
        await group.save({ userId: req.user.id });
        return res.status(200).json({ message: `Group status changed to: ${group.isActive ? 'Active' : 'Disabled'}` });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update group availability.', error: error.message });
    }
};


// ==========================================
// 3. REGIONAL STATE PRICE MATRIX CRUD METHODS
// ==========================================

const createPriceMaster = async (req, res) => {
    try {
        const { groupMasterId, state, taxPercentage } = req.body;
        const pricing = await PriceMaster.create({ groupMasterId, state, taxPercentage }, { userId: req.user.id });
        return res.status(201).json({ message: 'State pricing tax combination active.', pricing });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to register pricing overlay rules.', error: error.message });
    }
};

const getPrices = async (req, res) => {
    try {
        const prices = await PriceMaster.findAll({
            include: [{ model: GroupMaster, attributes: ['groupName'] }]
        });
        return res.status(200).json(prices);
    } catch (error) {
        return res.status(500).json({ message: 'Failed fetching pricing rules dashboard ledger.', error: error.message });
    }
};

const updatePriceMaster = async (req, res) => {
    try {
        const { id } = req.params;
        const pricing = await PriceMaster.findByPk(id);
        if (!pricing) return res.status(404).json({ message: 'Target tax matrix specification profile missing.' });

        await pricing.update(req.body, { userId: req.user.id });
        return res.status(200).json({ message: 'State regional pricing details updated.', pricing });
    } catch (error) {
        return res.status(500).json({ message: 'Failed pricing parameter execution update.', error: error.message });
    }
};

const togglePriceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const pricing = await PriceMaster.findByPk(id);
        if (!pricing) return res.status(404).json({ message: 'Pricing row missing.' });

        pricing.isActive = !pricing.isActive;
        await pricing.save({ userId: req.user.id });
        return res.status(200).json({ message: `Pricing overlay rule active state flipped to: ${pricing.isActive}` });
    } catch (error) {
        return res.status(500).json({ message: 'Failed status matrix alternation.', error: error.message });
    }
};


// ==========================================
// 4. TERRITORY PINCODE ASSIGNMENT OPERATION
// ==========================================

const assignPincodesToEmployee = async (req, res) => {
    try {
        const { userId, pincodes } = req.body; 
        
        const records = pincodes.map(pin => ({ userId, pincode: pin }));
        await EmployeePincodeAccess.bulkCreate(records);

        const user = await User.findByPk(userId);
        if (user) {
            user.pincodeAccess = pincodes.join(',');
            await user.save({ userId: req.user.id });
        }

        return res.status(200).json({ message: 'Branch territory pincodes mapped cleanly to employee record.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed assigning pincodes configuration parameters.', error: error.message });
    }
};


// ==========================================
// 5. PLANT MASTER CRUD OPERATIONS
// ==========================================

const createPlant = async (req, res) => {
    try {
        const { plantName, location, state, contactNo, companyId } = req.body;
        
        const plant = await Plant.create({
            plantName,
            location,
            state,
            contactNo,
            companyId: companyId || 1
        }, { userId: req.user.id });
        
        return res.status(201).json({ message: 'Manufacturing plant registered successfully.', plant });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create plant.', error: error.message });
    }
};

const getPlants = async (req, res) => {
    try {
        const plants = await Plant.findAll({ order: [['plantName', 'ASC']] });
        return res.status(200).json(plants);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve plants.', error: error.message });
    }
};

const updatePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const plant = await Plant.findByPk(id);
        if (!plant) return res.status(404).json({ message: 'Plant not found.' });

        await plant.update(req.body, { userId: req.user.id });
        return res.status(200).json({ message: 'Plant details updated successfully.', plant });
    } catch (error) {
        return res.status(500).json({ message: 'Plant update failed.', error: error.message });
    }
};

const togglePlantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const plant = await Plant.findByPk(id);
        if (!plant) return res.status(404).json({ message: 'Plant not found.' });

        plant.isActive = !plant.isActive;
        await plant.save({ userId: req.user.id });
        return res.status(200).json({ message: `Plant status toggled to: ${plant.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        return res.status(500).json({ message: 'Plant status toggle failed.', error: error.message });
    }
};


// ==========================================
// 6. SALES OFFICE MASTER CRUD OPERATIONS
// ==========================================

const createSalesOffice = async (req, res) => {
    try {
        const { officeCode, officeName, location, state, plantId, headOfOffice, contactNo } = req.body;
        
        const salesOffice = await SalesOffice.create({
            officeCode,
            officeName,
            location,
            state,
            plantId,
            headOfOffice,
            contactNo
        }, { userId: req.user.id });
        
        return res.status(201).json({ message: 'Sales office created successfully.', salesOffice });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create sales office.', error: error.message });
    }
};

const getSalesOffices = async (req, res) => {
    try {
        const salesOffices = await SalesOffice.findAll({ 
            include: [{ model: Plant, attributes: ['plantName'] }],
            order: [['officeName', 'ASC']] 
        });
        return res.status(200).json(salesOffices);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve sales offices.', error: error.message });
    }
};

const updateSalesOffice = async (req, res) => {
    try {
        const { id } = req.params;
        const salesOffice = await SalesOffice.findByPk(id);
        if (!salesOffice) return res.status(404).json({ message: 'Sales office not found.' });

        await salesOffice.update(req.body, { userId: req.user.id });
        return res.status(200).json({ message: 'Sales office updated successfully.', salesOffice });
    } catch (error) {
        return res.status(500).json({ message: 'Sales office update failed.', error: error.message });
    }
};

const toggleSalesOfficeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const salesOffice = await SalesOffice.findByPk(id);
        if (!salesOffice) return res.status(404).json({ message: 'Sales office not found.' });

        salesOffice.isActive = !salesOffice.isActive;
        await salesOffice.save({ userId: req.user.id });
        return res.status(200).json({ message: `Sales office status toggled to: ${salesOffice.isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        return res.status(500).json({ message: 'Sales office status toggle failed.', error: error.message });
    }
};


// ==========================================
// 7. ROLES MASTER CRUD OPERATIONS
// ==========================================

const getRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({ order: [['roleName', 'ASC']] });
        return res.status(200).json(roles);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve roles.', error: error.message });
    }
};


// ==========================================
// 8. SALES OFFICE PINCODE MAPPING OPERATIONS
// ==========================================

const mapSalesOfficePincodes = async (req, res) => {
    try {
        const { salesOfficeId, pincodes } = req.body; // pincodes is array

        // Remove old mappings
        await SalesOfficePincode.destroy({ where: { salesOfficeId } });

        // Create new mappings
        const mappings = pincodes.map(pincode => ({
            salesOfficeId,
            pincode,
            isActive: true
        }));
        
        await SalesOfficePincode.bulkCreate(mappings);

        return res.status(201).json({ message: 'Sales office pincode mappings updated successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to map pincodes.', error: error.message });
    }
};

const getSalesOfficePincodes = async (req, res) => {
    try {
        const { salesOfficeId } = req.params;

        const pincodes = await SalesOfficePincode.findAll({
            where: { salesOfficeId, isActive: true },
            attributes: ['id', 'pincode', 'isActive'],
            raw: true
        });

        return res.status(200).json(pincodes);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve pincodes.', error: error.message });
    }
};


// ==========================================
// 9. USER PINCODE ACCESS (EXECUTIVES & TECHNICIANS)
// ==========================================

const assignUserPincodes = async (req, res) => {
    try {
        const { userId, pincodes } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Update user's pincode access as comma-separated string
        user.pincodeAccess = pincodes.join(',');
        await user.save({ userId: req.user.id });

        return res.status(200).json({ message: 'User pincode access assigned successfully.', user });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to assign pincodes.', error: error.message });
    }
};

const getUserPincodes = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'fullName', 'email', 'pincodeAccess']
        });

        if (!user) return res.status(404).json({ message: 'User not found.' });

        const pincodes = user.pincodeAccess ? user.pincodeAccess.split(',') : [];

        return res.status(200).json({ userId, pincodes });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve user pincodes.', error: error.message });
    }
};


// ==========================================
// 10. USER SALES OFFICE ACCESS (ASM & RSM)
// ==========================================

const assignUserSalesOffices = async (req, res) => {
    try {
        const { userId, salesOfficeIds } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Remove old mappings
        await UserSalesOfficeAccess.destroy({ where: { userId } });

        // Create new mappings
        const mappings = salesOfficeIds.map(salesOfficeId => ({
            userId,
            salesOfficeId
        }));

        await UserSalesOfficeAccess.bulkCreate(mappings);

        return res.status(201).json({ message: 'User sales office access assigned successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to assign sales offices.', error: error.message });
    }
};

const getUserSalesOffices = async (req, res) => {
    try {
        const { userId } = req.params;

        const salesOffices = await UserSalesOfficeAccess.findAll({
            where: { userId },
            include: [{ model: SalesOffice, attributes: ['id', 'officeCode', 'officeName', 'location'] }],
            attributes: ['id', 'salesOfficeId']
        });

        return res.status(200).json(salesOffices);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve user sales offices.', error: error.message });
    }
};

module.exports = {
    createItemMaster,
    getItems,
    updateItemMaster,
    toggleItemStatus,
    createGroupMaster,
    getGroups,
    updateGroupMaster,
    toggleGroupStatus,
    createPriceMaster,
    getPrices,
    updatePriceMaster,
    togglePriceStatus,
    assignPincodesToEmployee,
    createPlant,
    getPlants,
    updatePlant,
    togglePlantStatus,
    createSalesOffice,
    getSalesOffices,
    updateSalesOffice,
    toggleSalesOfficeStatus,
    getRoles,
    mapSalesOfficePincodes,
    getSalesOfficePincodes,
    assignUserPincodes,
    getUserPincodes,
    assignUserSalesOffices,
    getUserSalesOffices
};