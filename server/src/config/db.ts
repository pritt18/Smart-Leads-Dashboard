/**
 * db.ts — Mongoose connection helper.
 *
 * Exported as a function so tests can pass an in-memory URI without touching
 * the real DATABASE. The function is idempotent: if Mongoose is already
 * connected it returns immediately.
 */
import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    // Already connected or connecting — nothing to do
    return;
  }

  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
