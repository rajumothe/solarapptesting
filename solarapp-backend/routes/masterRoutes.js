const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/masterController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Lock down all configuration tools strictly to authenticated personnel
router.use(authenticateToken);

// ==========================================
// 1. GLOBAL ITEM SKU ROUTING (WAREHOUSE)
// ==========================================
router.post('/item', authorizeRoles('Super Admin', 'Department Admin'), createItemMaster);
router.get('/items', authorizeRoles('Super Admin', 'Department Admin'), getItems);
router.put('/item/:id', authorizeRoles('Super Admin', 'Department Admin'), updateItemMaster);
router.patch('/item/:id/toggle', authorizeRoles('Super Admin', 'Department Admin'), toggleItemStatus);

// ==========================================
// 2. PRODUCT GROUP PACKAGE ROUTING
// ==========================================
router.post('/group', authorizeRoles('Super Admin', 'Department Admin'), createGroupMaster);
router.get('/groups', authorizeRoles('Super Admin', 'Department Admin'), getGroups);

router.put('/group/:id', authorizeRoles('Super Admin', 'Department Admin'), updateGroupMaster);
router.patch('/group/:id/toggle', authorizeRoles('Super Admin', 'Department Admin'), toggleGroupStatus);

// ==========================================
// 3. REGIONAL STATE PRICE MATRIX ROUTING
// ==========================================
router.post('/price', authorizeRoles('Super Admin', 'Department Admin'), createPriceMaster);
router.get('/prices', authorizeRoles('Super Admin', 'Department Admin'), getPrices);
router.put('/price/:id', authorizeRoles('Super Admin', 'Department Admin'), updatePriceMaster);
router.patch('/price/:id/toggle', authorizeRoles('Super Admin', 'Department Admin'), togglePriceStatus);

// ==========================================
// 4. TERRITORY PINCODE ASSIGNMENTS
// ==========================================
router.post('/assign-pincodes', authorizeRoles('Super Admin', 'Department Admin'), assignPincodesToEmployee);

// ==========================================
// 5. PLANT MASTER ROUTING
// ==========================================
router.post('/plant', authorizeRoles('Super Admin'), createPlant);
router.get('/plants', authorizeRoles('Super Admin', 'HOD', 'Department Admin'), getPlants);
router.put('/plant/:id', authorizeRoles('Super Admin'), updatePlant);
router.patch('/plant/:id/toggle', authorizeRoles('Super Admin'), togglePlantStatus);

// ==========================================
// 6. SALES OFFICE MASTER ROUTING
// ==========================================
router.post('/sales-office', authorizeRoles('Super Admin', 'HOD'), createSalesOffice);
router.get('/sales-offices', authorizeRoles('Super Admin', 'HOD', 'Department Admin'), getSalesOffices);
router.put('/sales-office/:id', authorizeRoles('Super Admin', 'HOD'), updateSalesOffice);
router.patch('/sales-office/:id/toggle', authorizeRoles('Super Admin', 'HOD'), toggleSalesOfficeStatus);

// ==========================================
// 7. ROLES MASTER ROUTING
// ==========================================
router.get('/roles', authorizeRoles('Super Admin', 'HOD'), getRoles);

// ==========================================
// 8. SALES OFFICE PINCODE MAPPING
// ==========================================
router.post('/sales-office-pincodes', authorizeRoles('Super Admin', 'HOD'), mapSalesOfficePincodes);
router.get('/sales-office-pincodes/:salesOfficeId', authorizeRoles('Super Admin', 'HOD'), getSalesOfficePincodes);

// ==========================================
// 9. USER PINCODE ACCESS (EXECUTIVES/TECHNICIANS)
// ==========================================
router.post('/user-pincodes', authorizeRoles('Super Admin'), assignUserPincodes);
router.get('/user-pincodes/:userId', authorizeRoles('Super Admin', 'HOD'), getUserPincodes);

// ==========================================
// 10. USER SALES OFFICE ACCESS (ASM/RSM)
// ==========================================
router.post('/user-sales-offices', authorizeRoles('Super Admin', 'HOD'), assignUserSalesOffices);
router.get('/user-sales-offices/:userId', authorizeRoles('Super Admin', 'HOD'), getUserSalesOffices);

module.exports = router;