/**
 * testDb.ts — In-memory MongoDB helpers for Jest tests.
 *
 * Uses mongodb-memory-server to spin up a real MongoDB instance in-process.
 * This gives us:
 *  - Full Mongoose behaviour (indexes, validation, aggregation pipelines)
 *  - No dependency on an external database in CI
 *  - Full isolation: each test suite connects to a fresh instance
 *
 * Usage in a test file:
 *   beforeAll(() => testDb.connect())
 *   afterEach(() => testDb.clearCollections())
 *   afterAll(() => testDb.disconnect())
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export const testDb = {
  async connect(): Promise<void> {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  },

  /** Drop all documents between tests to prevent state leakage. */
  async clearCollections(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key]?.deleteMany({});
    }
  },

  async disconnect(): Promise<void> {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  },
};
