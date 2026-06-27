# Integration Examples - Ready to Use

## 1. Form Validation Integration

### Example 1: Login Screen with Validation

```jsx
import React from 'react';
import { useForm, FormInput, Form } from '../components/FormInput';
import { useDispatch } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import api from '../api';

export const LoginScreen = () => {
  const dispatch = useDispatch();
  const [generalError, setGeneralError] = React.useState('');

  const {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit: handleFormSubmit,
  } = useForm(
    { email: '', password: '' },
    'login',
    async (data) => {
      try {
        setGeneralError('');
        await dispatch(loginUser(data));
      } catch (error) {
        setGeneralError(error.message || 'Login failed. Please try again.');
      }
    }
  );

  return (
    <div className="login-container">
      <h1>Solar App Login</h1>

      {generalError && (
        <div className="alert alert-error">{generalError}</div>
      )}

      <Form onSubmit={handleFormSubmit} errors={errors} loading={loading}>
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="your@email.com"
          required
        />

        <FormInput
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter password"
          required
        />
      </Form>

      <a href="/forgot-password" className="forgot-link">
        Forgot Password?
      </a>
    </div>
  );
};
```

### Example 2: Lead Creation with All Validations

```jsx
import React from 'react';
import { useForm, FormInput, Form } from '../components/FormInput';
import api from '../api';

export const LeadCreationScreen = () => {
  const [successMessage, setSuccessMessage] = React.useState('');

  const {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
    handleReset,
  } = useForm(
    {
      name: '',
      email: '',
      phoneNumber: '',
      location: '',
      state: '',
      district: '',
      pincode: '',
      powerConsumption: '',
      roofType: '',
      budget: '',
      source: '',
      remarks: '',
    },
    'leadCreation',
    async (data) => {
      try {
        const response = await api.post('/api/leads', data);
        setSuccessMessage('Lead created successfully! ID: ' + response.data.id);
        handleReset();
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error) {
        alert('Failed to create lead: ' + error.message);
      }
    }
  );

  return (
    <div className="lead-creation-container">
      <h2>Create New Lead</h2>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>

          <FormInput
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="John Doe"
            required
          />

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="john@example.com"
            required
          />

          <FormInput
            name="phoneNumber"
            label="Phone Number"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
            placeholder="9876543210"
            required
          />
        </div>

        {/* Location Information */}
        <div className="form-section">
          <h3>Location Information</h3>

          <FormInput
            name="location"
            label="Address"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
            placeholder="Street address"
            required
          />

          <FormInput
            name="state"
            label="State"
            value={formData.state}
            onChange={handleChange}
            error={errors.state}
            placeholder="State name"
            required
          />

          <FormInput
            name="district"
            label="District"
            value={formData.district}
            onChange={handleChange}
            error={errors.district}
            placeholder="District name"
            required
          />

          <FormInput
            name="pincode"
            label="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            error={errors.pincode}
            placeholder="6-digit pincode"
            required
          />
        </div>

        {/* System Requirements */}
        <div className="form-section">
          <h3>System Requirements</h3>

          <FormInput
            name="powerConsumption"
            label="Monthly Power Consumption (kWh)"
            type="number"
            value={formData.powerConsumption}
            onChange={handleChange}
            error={errors.powerConsumption}
            placeholder="0"
            required
          />

          <FormInput
            name="roofType"
            label="Roof Type"
            type="select"
            options={[
              { value: 'RCC', label: 'RCC' },
              { value: 'Metal', label: 'Metal Sheet' },
              { value: 'Tile', label: 'Concrete Tile' },
              { value: 'Asbestos', label: 'Asbestos' },
              { value: 'Other', label: 'Other' },
            ]}
            value={formData.roofType}
            onChange={handleChange}
            error={errors.roofType}
            required
          />

          <FormInput
            name="budget"
            label="Budget (₹)"
            type="number"
            value={formData.budget}
            onChange={handleChange}
            error={errors.budget}
            placeholder="0"
            required
          />
        </div>

        {/* Lead Source */}
        <div className="form-section">
          <h3>Lead Source</h3>

          <FormInput
            name="source"
            label="How did you hear about us?"
            type="select"
            options={[
              { value: 'Website', label: 'Website' },
              { value: 'Facebook', label: 'Facebook' },
              { value: 'Google Ads', label: 'Google Ads' },
              { value: 'Referral', label: 'Referral' },
              { value: 'Field Team', label: 'Field Team' },
              { value: 'Other', label: 'Other' },
            ]}
            value={formData.source}
            onChange={handleChange}
            error={errors.source}
            required
          />
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <h3>Additional Information</h3>

          <FormInput
            name="remarks"
            label="Remarks / Notes"
            type="textarea"
            rows={4}
            value={formData.remarks}
            onChange={handleChange}
            error={errors.remarks}
            placeholder="Any additional information..."
          />
        </div>
      </Form>
    </div>
  );
};
```

---

## 2. Error Tracking Integration

### Example 1: Manual Error Capture

```jsx
import { captureException, addBreadcrumb } from '../utils/sentry';

const handlePayment = async (orderId, amount) => {
  try {
    addBreadcrumb('Payment initiated', 'payment', { orderId, amount });
    
    const response = await api.post('/api/payments', { orderId, amount });
    
    addBreadcrumb('Payment successful', 'payment', { paymentId: response.data.id });
    return response.data;
  } catch (error) {
    // Capture error with context
    captureException(error, {
      orderId,
      amount,
      step: 'payment_processing',
    });
    
    throw error;
  }
};
```

### Example 2: User Context Setup

```jsx
import { setUserContext, clearUserContext } from '../utils/sentry';

// On successful login
const handleLoginSuccess = (user) => {
  setUserContext(user.id, user.email, user.fullName, user.role);
  console.log('Error tracking context set for:', user.email);
};

// On logout
const handleLogout = () => {
  clearUserContext();
  console.log('Error tracking context cleared');
};
```

---

## 3. Search, Filter & Pagination Integration

### Example: Lead Management Screen with All Features

```jsx
import React, { useState, useEffect } from 'react';
import {
  SearchComponent,
  FilterComponent,
  DataTable,
  Pagination,
} from '../components/SearchFilterPagination';
import api from '../api';

export const LeadManagementScreen = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const itemsPerPage = 10;

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/leads', { params: filters });
      setLeads(response.data);
      setFilteredLeads(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (result) => {
    console.log('Search result:', result);
    setFilteredLeads([result]);
  };

  // Handle filter
  const handleFilter = (activeFilters) => {
    setFilters(activeFilters);
  };

  // Paginate data
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (lead) => {
    console.log('Opening lead details:', lead.id);
    // Navigate to lead details screen
  };

  return (
    <div className="lead-management-container">
      <h2>Lead Management</h2>

      {/* Search */}
      <SearchComponent
        placeholder="Search by name, email, or phone..."
        searchFields={['name', 'email', 'phoneNumber']}
        onSearch={handleSearch}
      />

      {/* Filters */}
      <FilterComponent
        onFilter={handleFilter}
        filterConfig={[
          {
            name: 'status',
            label: 'Lead Status',
            type: 'select',
            options: [
              { value: 'New', label: 'New' },
              { value: 'Contacted', label: 'Contacted' },
              { value: 'Site Survey', label: 'Site Survey' },
              { value: 'Quotation', label: 'Quotation' },
              { value: 'Negotiation', label: 'Negotiation' },
              { value: 'Converted', label: 'Converted' },
              { value: 'Rejected', label: 'Rejected' },
            ],
          },
          {
            name: 'createdDate',
            label: 'Created Date',
            type: 'dateRange',
          },
          {
            name: 'assignedTo',
            label: 'Assigned To',
            type: 'select',
            options: [
              { value: 'me', label: 'My Leads' },
              { value: 'team', label: 'Team Leads' },
            ],
          },
          {
            name: 'priority',
            label: 'Priority',
            type: 'checkbox',
            options: [
              { value: 'hot', label: 'Hot Lead' },
              { value: 'warm', label: 'Warm Lead' },
              { value: 'cold', label: 'Cold Lead' },
            ],
          },
        ]}
      />

      {/* Data Table */}
      <DataTable
        data={paginatedLeads}
        columns={[
          { key: 'name', label: 'Customer Name' },
          { key: 'email', label: 'Email' },
          { key: 'phoneNumber', label: 'Phone' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status' },
          { key: 'budget', label: 'Budget (₹)' },
          { key: 'createdAt', label: 'Created' },
        ]}
        onRowClick={handleRowClick}
        loading={loading}
        sortable={true}
        searchable={false} // Already have search component
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredLeads.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={filteredLeads.length}
      />
    </div>
  );
};
```

---

## 4. Dashboard Integration

### Example: Add Dashboard to Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './screens/Dashboard';
import LeadManagementScreen from './screens/LeadManagementScreen';
import OrderManagementScreen from './screens/OrderManagementScreen';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<LeadManagementScreen />} />
        <Route path="/orders" element={<OrderManagementScreen />} />
        {/* ... other routes */}
      </Routes>
    </BrowserRouter>
  );
};
```

---

## 5. Redux Integration with Forms

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { useForm, FormInput, Form } from '../components/FormInput';

// In Redux slice
export const createLead = createAsyncThunk(
  'leads/create',
  async (leadData) => {
    const response = await api.post('/api/leads', leadData);
    return response.data;
  }
);

// In component
export const CreateLeadModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.leads);

  const { formData, errors, handleChange, handleSubmit } = useForm(
    { name: '', email: '', phoneNumber: '', budget: '' },
    'leadCreation',
    async (data) => {
      await dispatch(createLead(data));
      onClose();
    }
  );

  return (
    <div className="modal">
      <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
        <FormInput
          name="name"
          label="Lead Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        {/* ... more fields */}
      </Form>
    </div>
  );
};
```

---

## 6. APM Metric Tracking

### Example: Track Lead Creation Metric

```jsx
import { trackLeadMetric } from '../services/apmService';

const handleCreateLead = async (leadData, metrics) => {
  try {
    const response = await api.post('/api/leads', leadData);
    
    // Track success
    trackLeadMetric(metrics, 'created', response.data.id, {
      source: leadData.source,
      budget_range: leadData.budget > 500000 ? 'high' : 'low',
    });
    
    return response.data;
  } catch (error) {
    // Track failure
    trackLeadMetric(metrics, 'creation_failed', null, {
      error: error.message,
    });
    
    throw error;
  }
};
```

---

## Installation Steps

### 1. Update Main Entry Point

**main.jsx**:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeSentry, ErrorBoundary } from './utils/sentry'

// Initialize Sentry before rendering
initializeSentry()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

### 2. Install All Dependencies

```bash
# Backend
cd solarapp-backend
npm install

# Frontend
cd ../solarapp-web
npm install

# Mobile
cd ../solarapp-mobile
npm install
```

### 3. Configure Environment

```bash
# Backend .env
SENTRY_DSN=https://your-key@sentry.io/project
DATADOG_API_KEY=your-api-key
NODE_ENV=development

# Frontend .env.local
VITE_SENTRY_DSN=https://your-key@sentry.io/project
VITE_API_URL=http://localhost:5000
```

### 4. Run Applications

```bash
# Backend
cd solarapp-backend
npm run dev

# Frontend (in new terminal)
cd solarapp-web
npm run dev

# Mobile (in new terminal)
cd solarapp-mobile
npm start
```

---

**Ready for Integration!** ✅  
All components are production-ready and fully documented.
