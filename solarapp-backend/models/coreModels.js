const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 1. Audit Log Model
const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false }, // CREATE, UPDATE, DELETE
    modelName: { type: DataTypes.STRING, allowNull: false },
    recordId: { type: DataTypes.INTEGER, allowNull: true },
    changes: { type: DataTypes.TEXT, allowNull: true }
});

// 2. Role Master (RBAC)
const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roleName: { type: DataTypes.STRING, unique: true, allowNull: false } 
    // Super Admin, HOD, State Head, RSM, ASM, Executive, Service Engineer
});

// 3. Organization Master Structure
const Company = sequelize.define('Company', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
});

const Plant = sequelize.define('Plant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
});

const SalesOffice = sequelize.define('SalesOffice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
});

// 4. User Master Model
const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    contactNo: { type: DataTypes.STRING, allowNull: false },
    pincodeAccess: { type: DataTypes.STRING, allowNull: true }, // Comma separated list of pincodes
    parentId: { type: DataTypes.INTEGER, allowNull: true }, // Self-referencing reporting manager hierarchy
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 5. Group Master Model
const GroupMaster = sequelize.define('GroupMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupName: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., 3KW Standard On-Grid
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 6. Item Master Model (Shared Global SKU Repository)
const ItemMaster = sequelize.define('ItemMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    itemName: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g., Mono-Perc Solar Panel 400W
    capacityKW: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// 7. Junction Table: Group-Item Pricing Specification Matrix
const GroupItemSpecification = sequelize.define('GroupItemSpecification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupMasterId: { type: DataTypes.INTEGER, allowNull: false },
    itemMasterId: { type: DataTypes.INTEGER, allowNull: false },
    basePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false } // Component price specific to this group package
});

// 8. Price Master Model (Handles regional State Tax overlays per Group package context)
const PriceMaster = sequelize.define('PriceMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    groupMasterId: { type: DataTypes.INTEGER, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    taxPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Pin code mapping helper table for explicit employee branch access limits
const EmployeePincodeAccess = sequelize.define('EmployeePincodeAccess', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    pincode: { type: DataTypes.STRING(10), allowNull: false }
});

// Sales Office to Pincode Mapping (One sales office can serve multiple pincodes)
const SalesOfficePincode = sequelize.define('SalesOfficePincode', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    salesOfficeId: { type: DataTypes.INTEGER, allowNull: false },
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// User Sales Office Access (For ASM/RSM - multiple sales offices per user)
const UserSalesOfficeAccess = sequelize.define('UserSalesOfficeAccess', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    salesOfficeId: { type: DataTypes.INTEGER, allowNull: false }
});

// 9. Lead Master Model
// 9. Lead Master Model (Updated with Unique Sequential Custom LeadCode Hook)
const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadCode: { type: DataTypes.STRING(20), unique: true, allowNull: true }, // Auto-Generated Target Identifier
    customerCode: { type: DataTypes.STRING(30), unique: true, allowNull: true }, // ADDED HERE FOR GENERATED CUSTOMERS
    customerName: { type: DataTypes.STRING, allowNull: false },
    contactNo: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    unitCapacitySelection: { type: DataTypes.STRING, allowNull: false }, 
    createdById: { type: DataTypes.INTEGER, allowNull: false }, 
    status: { type: DataTypes.STRING, defaultValue: 'Lead Created' },
    latitude: { type: DataTypes.STRING, allowNull: true },
    longitude: { type: DataTypes.STRING, allowNull: true }
}, {
    hooks: {
        beforeCreate: async (lead, options) => {
            // Find the highest existing ID in the table to compute sequential offsets
            const maxIdRecord = await Lead.findOne({
                order: [['id', 'DESC']],
                attributes: ['id'],
                raw: true
            });
            
            const nextIdOffset = maxIdRecord ? maxIdRecord.id + 1 : 1;
            
            // Starts sequence precisely at L-100000 by adding base offset
            const customSerialSequence = 100000 + (nextIdOffset - 1);
            lead.leadCode = `L-${customSerialSequence}`;
        }
    }
});

// 10. Customer KYC Master (Converted Leads)
const CustomerKYC = sequelize.define('CustomerKYC', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    aadharNo: { type: DataTypes.STRING, allowNull: false },
    panNo: { type: DataTypes.STRING, allowNull: false },
    ebBillNo: { type: DataTypes.STRING, allowNull: false },
    bankAccountNo: { type: DataTypes.STRING, allowNull: false },
    ebApprovalStatus: { type: DataTypes.STRING, defaultValue: 'Pending Approval' }, 
    asmApprovalStatus: { type: DataTypes.STRING, defaultValue: 'Pending' }, 
    backOfficeStatus: { type: DataTypes.STRING, defaultValue: 'Under Review' } 
});

// 11. Order Master Model
const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false }, 
    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    loanRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    loanStatus: { type: DataTypes.STRING, defaultValue: 'Not Applicable' }, 
    orderStatus: { type: DataTypes.STRING, defaultValue: 'Order Received' }, 
    allocatedPincode: { type: DataTypes.STRING(10), allowNull: false }
});

// 12. Invoice Model
const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    basePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    taxAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    finalGrossAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
});

// 13. Payment Collections Model
const PaymentCollection = sequelize.define('PaymentCollection', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    amountCollected: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paymentMode: { type: DataTypes.STRING, allowNull: false }, // Cash, Online, Loan Disbursal
    transactionReference: { type: DataTypes.STRING, allowNull: true }
});

// 14. Product Installation Tracking Model
const Installation = sequelize.define('Installation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    assignedEngineerId: { type: DataTypes.INTEGER, allowNull: true }, 
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Assigned' }, 
    customerPhotoProof: { type: DataTypes.STRING, allowNull: true }, 
    customerSignatureName: { type: DataTypes.STRING, allowNull: true },
    installedAt: { type: DataTypes.DATE, allowNull: true }
});

// 15. Service Tickets Model
// 15. Service Tickets Model (Updated with Customer Tracking parameters)
const ServiceTicket = sequelize.define('ServiceTicket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerCode: { type: DataTypes.STRING(30), allowNull: false }, // ADDED: Direct alignment parameter map
    raisedByUserId: { type: DataTypes.INTEGER, allowNull: false }, 
    pincode: { type: DataTypes.STRING(10), allowNull: false },
    assignedEngineerId: { type: DataTypes.INTEGER, allowNull: true },
    issueDescription: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Open' }, // Open, Assigned, Travel Started, Completed, Spare Required
    spareDetailsRequired: { type: DataTypes.STRING, allowNull: true },
    nextAvailabilityDate: { type: DataTypes.DATEONLY, allowNull: true },
    resolutionPhotoProof: { type: DataTypes.STRING, allowNull: true }
});

// 16. Attendance Check-In / Check-Out Log Model
const AttendanceLog = sequelize.define('AttendanceLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    logDate: { type: DataTypes.STRING, allowNull: false },
    checkInTime: { type: DataTypes.DATE, allowNull: false },
    checkOutTime: { type: DataTypes.DATE, allowNull: true },
    startLatitude: { type: DataTypes.STRING, allowNull: true },
    startLongitude: { type: DataTypes.STRING, allowNull: true },
    endLatitude: { type: DataTypes.STRING, allowNull: true },
    endLongitude: { type: DataTypes.STRING, allowNull: true },
    totalKm: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000 },
    totalMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'Active' }
});

// 17. Leave & On-Duty Application Model
const LeaveApplication = sequelize.define('LeaveApplication', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // 'Leave' or 'On Duty'
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Pending Approval' } 
});

// 18. Expense Bills & Claims (TA / DA) Model
const ExpenseClaim = sequelize.define('ExpenseClaim', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    claimType: { type: DataTypes.STRING, allowNull: false }, // 'TA', 'DA', 'Other Bills'
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    attachmentUrl: { type: DataTypes.STRING, allowNull: true }, 
    status: { type: DataTypes.STRING, defaultValue: 'Pending' } 
});

 // 19. Field force route & territory execution tracking model
const FieldVisit = sequelize.define('FieldVisit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: { type: DataTypes.INTEGER, allowNull: false },
    visitedById: { type: DataTypes.INTEGER, allowNull: false },
    purpose: { type: DataTypes.STRING, allowNull: false },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    latitude: { type: DataTypes.STRING, allowNull: false },
    longitude: { type: DataTypes.STRING, allowNull: false },
    odometerKm: { type: DataTypes.DECIMAL(10, 3), allowNull: false }, // Stores the Gap Distance
    // NEW Audit Columns for deep analytics:
    totalKmAtVisit: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000 },
    gapMinutes: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Establish Relationships & Associations
Company.hasMany(Plant, { foreignKey: 'companyId' });
Plant.belongsTo(Company, { foreignKey: 'companyId' });

Plant.hasMany(SalesOffice, { foreignKey: 'plantId' });
SalesOffice.belongsTo(Plant, { foreignKey: 'plantId' });

SalesOffice.hasMany(User, { foreignKey: 'salesOfficeId' });
User.belongsTo(SalesOffice, { foreignKey: 'salesOfficeId' });

// Sales Office to Pincode mapping
SalesOffice.hasMany(SalesOfficePincode, { foreignKey: 'salesOfficeId' });
SalesOfficePincode.belongsTo(SalesOffice, { foreignKey: 'salesOfficeId' });

// User to Sales Office mapping (for ASM/RSM multiple access)
User.hasMany(UserSalesOfficeAccess, { foreignKey: 'userId' });
UserSalesOfficeAccess.belongsTo(User, { foreignKey: 'userId' });
SalesOffice.hasMany(UserSalesOfficeAccess, { foreignKey: 'salesOfficeId' });
UserSalesOfficeAccess.belongsTo(SalesOffice, { foreignKey: 'salesOfficeId' });

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

User.hasMany(User, { as: 'Subordinates', foreignKey: 'parentId' });
User.belongsTo(User, { as: 'Manager', foreignKey: 'parentId' });

User.hasMany(Lead, { foreignKey: 'createdById' });
Lead.belongsTo(User, { foreignKey: 'createdById' });

Lead.hasOne(CustomerKYC, { foreignKey: 'leadId' });
CustomerKYC.belongsTo(Lead, { foreignKey: 'leadId' });

// Many-to-Many Shared Components Allocation Matrix Configuration
GroupMaster.belongsToMany(ItemMaster, { through: GroupItemSpecification, foreignKey: 'groupMasterId' });
ItemMaster.belongsToMany(GroupMaster, { through: GroupItemSpecification, foreignKey: 'itemMasterId' });

GroupMaster.hasMany(GroupItemSpecification, { foreignKey: 'groupMasterId' });
GroupItemSpecification.belongsTo(GroupMaster, { foreignKey: 'groupMasterId' });

ItemMaster.hasMany(GroupItemSpecification, { foreignKey: 'itemMasterId' });
GroupItemSpecification.belongsTo(ItemMaster, { foreignKey: 'itemMasterId' });

GroupMaster.hasMany(PriceMaster, { foreignKey: 'groupMasterId' });
PriceMaster.belongsTo(GroupMaster, { foreignKey: 'groupMasterId' });

Lead.hasMany(Order, { foreignKey: 'leadId' });
Order.belongsTo(Lead, { foreignKey: 'leadId' });

Order.hasOne(Invoice, { foreignKey: 'orderId' });
Invoice.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(PaymentCollection, { foreignKey: 'orderId' });
PaymentCollection.belongsTo(Order, { foreignKey: 'orderId' });

// Hook up field service assignments inside models/coreModels.js
Order.hasOne(Installation, { foreignKey: 'orderId' });
Installation.belongsTo(Order, { foreignKey: 'orderId' });

// Ensure the installation model uses 'Engineer' alias
User.hasMany(Installation, { foreignKey: 'assignedEngineerId', as: 'EngineerInstallations' });
Installation.belongsTo(User, { foreignKey: 'assignedEngineerId', as: 'Engineer' });

// Ensure the service ticket model uses 'AssignedEngineer' alias
User.hasMany(ServiceTicket, { foreignKey: 'assignedEngineerId', as: 'EngineerTickets' });
ServiceTicket.belongsTo(User, { foreignKey: 'assignedEngineerId', as: 'AssignedEngineer' });

User.hasMany(AttendanceLog, { foreignKey: 'userId' });
AttendanceLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(LeaveApplication, { foreignKey: 'userId' });
LeaveApplication.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ExpenseClaim, { foreignKey: 'userId' });
ExpenseClaim.belongsTo(User, { foreignKey: 'userId' });


// Setup relationships mapping configurations loop links
Lead.hasMany(FieldVisit, { foreignKey: 'leadId' });
FieldVisit.belongsTo(Lead, { foreignKey: 'leadId' });
User.hasMany(FieldVisit, { foreignKey: 'visitedById' });
FieldVisit.belongsTo(User, { foreignKey: 'visitedById', as: 'VisitedBy' });



module.exports = {
    sequelize,
    AuditLog,
    Role,
    Company,
    Plant,
    SalesOffice,
    User,
    GroupMaster,
    ItemMaster,
    GroupItemSpecification,
    PriceMaster,
    EmployeePincodeAccess,
    SalesOfficePincode,
    UserSalesOfficeAccess,
    Lead,
    CustomerKYC,
    Order,
    Invoice,
    PaymentCollection,
    Installation,
    ServiceTicket,
    AttendanceLog,
    LeaveApplication,
    ExpenseClaim,
    FieldVisit

};