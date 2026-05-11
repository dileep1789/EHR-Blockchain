/**
 * Jest Setup File
 * Runs before all tests to configure the testing environment
 */

// Increase timeout for database operations
jest.setTimeout(30000);

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('MongoDB') || args[0].includes('deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
