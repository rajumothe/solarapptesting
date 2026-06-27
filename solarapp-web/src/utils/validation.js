import { z } from 'zod';

// Reusable validation schemas
export const validationSchemas = {
  // Authentication schemas
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    role: z.enum(['Super Admin', 'HOD', 'State Head', 'RSM', 'ASM', 'Executive', 'Service Engineer']),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  resetPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  updatePassword: z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  // Lead schemas
  leadCreation: z.object({
    name: z.string().min(2, 'Name required').max(50, 'Name too long'),
    email: z.string().email('Invalid email'),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    location: z.string().min(2, 'Location required'),
    state: z.string().min(2, 'State required'),
    district: z.string().min(2, 'District required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    powerConsumption: z.number().min(100, 'Min 100 kWh').max(50000, 'Max 50000 kWh'),
    roofType: z.enum(['RCC', 'Metal', 'Tile', 'Asbestos', 'Other']),
    budget: z.number().min(50000, 'Min budget ₹50,000'),
    source: z.enum(['Website', 'Facebook', 'Google Ads', 'Referral', 'Field Team', 'Other']),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  leadUpdate: z.object({
    name: z.string().min(2, 'Name required').max(50, 'Name too long').optional(),
    email: z.string().email('Invalid email').optional(),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
    status: z.enum(['New', 'Contacted', 'Site Survey', 'Quotation', 'Negotiation', 'Converted', 'Rejected']).optional(),
    assignedTo: z.string().uuid('Invalid user').optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  // Order schemas
  orderCreation: z.object({
    leadId: z.string().uuid('Invalid lead'),
    systemCapacity: z.number().min(1, 'Min 1 kW').max(100, 'Max 100 kW'),
    estimatedCost: z.number().min(100000, 'Min ₹100,000'),
    discount: z.number().min(0, 'Cannot be negative').max(100, 'Max 100%').optional(),
    downpayment: z.number().min(10000, 'Min ₹10,000'),
    paymentTerms: z.enum(['Full', 'Advance + EMI', 'Advance + Installments']),
    emiMonths: z.number().min(3, 'Min 3 months').max(60, 'Max 60 months').optional(),
    installationDate: z.string().datetime('Invalid date').optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  orderUpdate: z.object({
    status: z.enum(['Quotation', 'Order Placed', 'Under Installation', 'Completed', 'Cancelled']).optional(),
    installationDate: z.string().datetime('Invalid date').optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  // Service ticket schemas
  serviceTicketCreation: z.object({
    customerId: z.string().uuid('Invalid customer'),
    orderId: z.string().uuid('Invalid order').optional(),
    issueType: z.enum(['Maintenance', 'Repair', 'Installation', 'Other']),
    description: z.string().min(10, 'Min 10 characters').max(500, 'Max 500 characters'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
    scheduledDate: z.string().datetime('Invalid date'),
    photos: z.array(z.string().url()).optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  serviceTicketUpdate: z.object({
    status: z.enum(['Open', 'Assigned', 'In Progress', 'Completed', 'Closed']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    engineerId: z.string().uuid('Invalid engineer').optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  // Leave application schemas
  leaveApplication: z.object({
    leaveType: z.enum(['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity', 'Other']),
    fromDate: z.string().date('Invalid from date'),
    toDate: z.string().date('Invalid to date'),
    reason: z.string().min(10, 'Min 10 characters').max(500, 'Max 500 characters'),
    attachments: z.array(z.string().url()).optional(),
  }).refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: 'To date must be after from date',
    path: ['toDate'],
  }),

  // Expense claim schemas
  expenseClaim: z.object({
    category: z.enum(['Travel', 'Meals', 'Accommodation', 'Materials', 'Other']),
    amount: z.number().min(1, 'Amount required').max(500000, 'Max ₹500,000'),
    description: z.string().min(5, 'Min 5 characters').max(500, 'Max 500 characters'),
    date: z.string().date('Invalid date'),
    billAttachment: z.string().url('Invalid URL'),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  // Master data schemas
  itemMaster: z.object({
    itemCode: z.string().min(3, 'Min 3 characters').max(20, 'Max 20 characters').regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, numbers, hyphens'),
    itemName: z.string().min(3, 'Min 3 characters').max(100, 'Max 100 characters'),
    category: z.string().min(2, 'Category required'),
    unit: z.enum(['Piece', 'Box', 'KG', 'Liter', 'Meter', 'Pack']),
    quantity: z.number().min(0, 'Cannot be negative'),
    reorderLevel: z.number().min(1, 'Min 1 unit'),
    costPrice: z.number().min(0, 'Cannot be negative'),
    sellingPrice: z.number().min(0, 'Cannot be negative'),
    gstRate: z.number().min(0, 'Min 0%').max(28, 'Max 28%'),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  groupMaster: z.object({
    groupCode: z.string().min(3, 'Min 3 characters').max(20, 'Max 20 characters'),
    groupName: z.string().min(3, 'Min 3 characters').max(100, 'Max 100 characters'),
    description: z.string().max(500, 'Max 500 characters').optional(),
    remarks: z.string().max(500, 'Max 500 characters').optional(),
  }),

  priceMaster: z.object({
    itemId: z.string().uuid('Invalid item'),
    validFrom: z.string().date('Invalid date'),
    validTo: z.string().date('Invalid date').optional(),
    price: z.number().min(1, 'Price required'),
    discountPercentage: z.number().min(0, 'Min 0%').max(100, 'Max 100%').optional(),
    region: z.string().max(50, 'Max 50 characters').optional(),
  }).refine((data) => !data.validTo || new Date(data.validTo) >= new Date(data.validFrom), {
    message: 'Valid to date must be after valid from date',
    path: ['validTo'],
  }),
};

/**
 * Validate form data against schema
 * @param {string} schemaName - Name of schema from validationSchemas
 * @param {object} data - Data to validate
 * @returns {object} { valid: boolean, errors: object, data: object }
 */
export const validateFormData = (schemaName, data) => {
  try {
    const schema = validationSchemas[schemaName];
    if (!schema) {
      return {
        valid: false,
        errors: { form: `Unknown schema: ${schemaName}` },
        data: null,
      };
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      return {
        valid: false,
        errors,
        data: null,
      };
    }

    return {
      valid: true,
      errors: {},
      data: result.data,
    };
  } catch (error) {
    return {
      valid: false,
      errors: { form: error.message },
      data: null,
    };
  }
};

/**
 * Get field error if exists
 * @param {object} errors - Errors object
 * @param {string} fieldName - Field name
 * @returns {string|null}
 */
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName] || null;
};

/**
 * Check if form has any errors
 * @param {object} errors - Errors object
 * @returns {boolean}
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

export default validationSchemas;
