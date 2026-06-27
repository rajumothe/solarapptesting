# 🔗 Quick Reference Guide - All Features

## Form Validation

### Import
```javascript
import { useForm, FormInput, Form } from '../components/FormInput';
import { validationSchemas, validateFormData } from '../utils/validation';
```

### Use Hook
```jsx
const { formData, errors, loading, handleChange, handleSubmit } = useForm(
  initialValues,    // Object with form fields
  'schemaName',     // Schema name from validationSchemas
  onSubmitCallback  // Async function to handle submit
);
```

### Schemas Available
- `login` - Email + Password
- `register` - Email, Password, Name, Phone, Role
- `resetPassword` - Email only
- `updatePassword` - Current + New password
- `leadCreation` - 11 fields for new lead
- `leadUpdate` - Partial lead update
- `orderCreation` - 8 fields for order
- `orderUpdate` - Order status + date
- `serviceTicketCreation` - 7 fields for ticket
- `serviceTicketUpdate` - Ticket status update
- `leaveApplication` - Leave type + dates
- `expenseClaim` - Expense details

---

## Error Tracking

### Backend Setup
```javascript
import { initializeSentry, attachSentryErrorHandler } from './services/sentryService';

// In server.js - BEFORE other middleware
initializeSentry(app);

// AFTER all routes
attachSentryErrorHandler(app);
```

### Frontend Setup
```jsx
import { initializeSentry, ErrorBoundary } from './utils/sentry';

// In main.jsx - Before rendering
initializeSentry();

// Wrap App
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Functions
```javascript
// Set user context (on login)
import { setUserContext } from './utils/sentry';
setUserContext(userId, email, fullName, role);

// Clear context (on logout)
import { clearUserContext } from './utils/sentry';
clearUserContext();

// Log breadcrumb
import { addBreadcrumb } from './utils/sentry';
addBreadcrumb('Action performed', 'category', { data: 'value' });

// Capture exception
import { captureException } from './utils/sentry';
captureException(error, { context: 'value' });
```

### Environment Variables
```env
# Backend
SENTRY_DSN=https://key@sentry.io/project

# Frontend (.env.local)
VITE_SENTRY_DSN=https://key@sentry.io/project
```

---

## APM & Monitoring

### Backend Setup
```javascript
import { initializeDataDog, metricsMiddleware } from './services/apmService';

const metrics = initializeDataDog();
app.use(metricsMiddleware(metrics));
```

### Track Metrics
```javascript
import { 
  trackLeadMetric, 
  trackOrderMetric, 
  trackAuthMetric,
  trackDatabaseQuery
} from './services/apmService';

// Track lead creation
trackLeadMetric(metrics, 'created', leadId, { source: 'web' });

// Track order
trackOrderMetric(metrics, 'paid', orderId, amount, { method: 'razorpay' });

// Track auth
trackAuthMetric(metrics, 'login', true, duration);

// Track query
const startTime = Date.now();
const result = await Lead.findAll();
trackDatabaseQuery(metrics, 'Lead.findAll', Date.now() - startTime, true);
```

### Environment Variables
```env
DATADOG_API_KEY=your-api-key
DATADOG_AGENT_HOST=localhost
DATADOG_AGENT_PORT=8125
```

---

## Dashboard & Analytics

### Setup
```jsx
import Dashboard from './screens/Dashboard';

// In router
<Route path="/dashboard" element={<Dashboard />} />
```

### Features
- 6 KPI cards with trends
- 7 interactive charts
- Real-time data updates
- Territory filtering
- Time range selection (Week/Month/Year)

### Endpoint
```
GET /api/dashboard/metrics?timeRange=month&region=north
```

---

## Search Component

### Import & Use
```jsx
import { SearchComponent } from './components/SearchFilterPagination';

<SearchComponent
  placeholder="Search..."
  searchFields={['name', 'email', 'phoneNumber']}
  onSearch={(result) => console.log(result)}
  debounceTime={300}
/>
```

### Features
- Debounced search (300ms default)
- Real-time suggestions
- Multi-field search
- Loading indicator

---

## Filter Component

### Import & Use
```jsx
import { FilterComponent } from './components/SearchFilterPagination';

<FilterComponent
  onFilter={(filters) => console.log(filters)}
  filterConfig={[
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'converted', label: 'Converted' }
      ]
    },
    {
      name: 'date',
      label: 'Date',
      type: 'dateRange'
    }
  ]}
/>
```

### Filter Types
- `select` - Dropdown
- `dateRange` - Date picker range
- `checkbox` - Multi-select checkboxes
- `text` - Text input

---

## Data Table

### Import & Use
```jsx
import { DataTable } from './components/SearchFilterPagination';

<DataTable
  data={leads}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' }
  ]}
  onRowClick={(row) => console.log(row)}
  loading={false}
  sortable={true}
  searchable={true}
/>
```

### Features
- Sortable columns (click header)
- Global search
- Click handlers
- Loading state
- Empty state

---

## Pagination

### Import & Use
```jsx
import { Pagination } from './components/SearchFilterPagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
  itemsPerPage={10}
  totalItems={totalCount}
/>
```

### Features
- First/Previous/Next/Last buttons
- Smart page display (max 5)
- Item count info
- Responsive design

---

## Redux Integration

### Store Setup
```jsx
// Already configured in src/redux/store.js
import { store } from './redux/store';
import { Provider } from 'react-redux';

<Provider store={store}>
  <App />
</Provider>
```

### Use in Components
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logoutUser } from './redux/slices/authSlice';

const { user, loading } = useSelector(state => state.auth);
const dispatch = useDispatch();

dispatch(loginUser({ email, password }));
dispatch(logoutUser());
```

### Available Slices
- `auth` - Authentication state
- `leads` - Leads management
- `orders` - Orders management
- `ui` - UI state (modals, sidebar)
- `notifications` - Toast notifications

---

## API Integration

### Axios Setup
```javascript
// Already configured in src/api.js
import api from '../api';

// GET
const response = await api.get('/api/leads');

// POST
const response = await api.post('/api/leads', data);

// PUT
const response = await api.put(`/api/leads/${id}`, data);

// DELETE
const response = await api.delete(`/api/leads/${id}`);
```

### Endpoints (Preview)
```
Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

Leads
GET    /api/leads
GET    /api/leads/:id
POST   /api/leads
PUT    /api/leads/:id

Orders
GET    /api/orders
POST   /api/orders
PUT    /api/orders/:id

Dashboard
GET    /api/dashboard/metrics
```

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service]

# Access services
Frontend:    http://localhost:3000
API:         http://localhost:5000
DB Admin:    http://localhost:8080
Cache:       http://localhost:8081
API Docs:    http://localhost:5000/api/docs
```

---

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_USER=solar_user
DB_PASSWORD=strong_password
DB_NAME=solarapp_db

# JWT
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret

# Services
SENTRY_DSN=https://...
DATADOG_API_KEY=...

# Providers
NODEMAILER_EMAIL=your@email.com
NODEMAILER_PASSWORD=app_password
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
RAZORPAY_KEY_ID=...
RAZORPAY_SECRET=...
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
VITE_SENTRY_DSN=https://...
```

---

## Testing

### Run Tests
```bash
cd solarapp-backend

# All tests
npm test

# Watch mode
npm test:watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- __tests__/auth.test.js
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Start production server
npm start

# Seed database
npm run seed
```

---

## Common Tasks

### Add New Validation Schema
```javascript
// In src/utils/validation.js
export const validationSchemas = {
  // ... existing schemas
  myNewSchema: z.object({
    field1: z.string().min(1, 'Required'),
    field2: z.number().min(0, 'Must be positive'),
  })
};
```

### Create New API Endpoint
```javascript
// In routes file
router.get('/path', authenticateToken, authorizeRoles('role'), async (req, res) => {
  try {
    // Implementation
    res.json(result);
  } catch (error) {
    captureException(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Add New Redux Slice
```javascript
// In redux/slices/newSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchData = createAsyncThunk('slice/fetchData', async (id) => {
  const response = await api.get(`/api/endpoint/${id}`);
  return response.data;
});

export const newSlice = createSlice({
  name: 'newslice',
  initialState: { data: null, loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => { state.loading = true; })
      .addCase(fetchData.fulfilled, (state, action) => { 
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default newSlice.reducer;
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5000
npx kill-port 5000
```

### Database Connection Error
```bash
# Check MySQL is running
docker ps | grep mysql

# Verify credentials in .env
# Reset database
docker-compose down -v
docker-compose up -d
```

### Sentry Not Capturing Errors
```javascript
// Verify SENTRY_DSN is set
console.log(process.env.SENTRY_DSN);

// Test capture
captureMessage('Test message', 'info');
```

### Validation Not Working
```javascript
// Verify schema name is correct
console.log(validationSchemas.yourSchema);

// Test validation directly
const result = validateFormData('yourSchema', testData);
console.log(result);
```

---

## Performance Tips

1. **Debounce Search**: Already set to 300ms
2. **Pagination**: Use 10 items per page by default
3. **Lazy Loading**: Import components with React.lazy()
4. **Memoization**: Use React.memo() for expensive components
5. **Database**: Use indexes on frequently queried fields
6. **Cache**: Enable Redis caching for frequently accessed data

---

## Security Checklist

- ✅ HTTPS in production
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Input validation active
- ✅ JWT tokens secured
- ✅ Passwords hashed
- ✅ Error messages generic
- ✅ Audit logging enabled
- ✅ Sentry error tracking
- ✅ Database backups configured

---

## Resources

- API Docs: http://localhost:5000/api/docs
- Dashboard: http://localhost:3000/dashboard
- Sentry Dashboard: https://sentry.io
- DataDog Dashboard: https://datadoghq.com
- Documentation Files:
  - COMPLETE_IMPLEMENTATION_GUIDE.md
  - INTEGRATION_EXAMPLES.md
  - PROJECT_COMPLETION_SUMMARY.md

---

**Last Updated**: 2026-06-26
**Version**: 1.0.0
