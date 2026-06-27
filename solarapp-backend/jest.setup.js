/**
 * Jest Setup File
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'solar_app_test';

// Suppress console logs during tests (can be overridden per test)
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  // Optional: Suppress logs during tests
  // console.log = jest.fn();
  // console.error = jest.fn();
});

afterAll(() => {
  // Restore console
  console.log = originalLog;
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);

// Mock fetch if needed
global.fetch = jest.fn();
