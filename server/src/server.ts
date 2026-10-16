/**
 * server.ts — Process entry point.
 *
 * Connects to MongoDB then starts the HTTP server. Separated from app.ts
 * so the Express app can be imported by tests without binding a port.
 */
import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

async function start(): Promise<void> {
  try {
    await connectDB(env.MONGODB_URI);

    app.listen(env.PORT, () => {
      console.log(`LeadFlow API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

void start();
