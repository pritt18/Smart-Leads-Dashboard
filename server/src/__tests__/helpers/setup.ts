/**
 * setup.ts — Jest global setup run before each test file.
 *
 * Sets the minimum required environment variables so config/env.ts doesn't
 * throw "Missing required environment variable" when the test process starts.
 * The MONGODB_URI is a placeholder — tests override the actual connection
 * via testDb.connect() which uses the in-memory server's URI.
 */

// Must be set BEFORE any module that imports config/env.ts is loaded
process.env['NODE_ENV'] = 'test';
process.env['MONGODB_URI'] = 'mongodb://localhost:27017/leadflow-test'; // overridden by testDb
process.env['JWT_SECRET'] = 'test_secret_that_is_at_least_32_chars_long!!';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['CLIENT_ORIGIN'] = 'http://localhost:5173';
