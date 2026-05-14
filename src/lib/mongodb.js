import mongoose from 'mongoose';
import ToolHistory from '@/models/ToolHistory';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect when MONGODB_URI is set. Returns null if not configured (does not throw).
 */
async function dbConnect() {
  if (!MONGODB_URI) return null;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Optional usage logging. No-op when MONGODB_URI is unset.
 * @param {{ url?: string, domain?: string, toolName: string, result?: unknown }} data
 */
export async function logToolHistory(data) {
  if (!MONGODB_URI) return;
  try {
    await dbConnect();
    await ToolHistory.create({
      url: data.url ?? data.domain ?? '',
      toolName: data.toolName,
      result: data.result,
    });
  } catch (err) {
    console.warn(`[ToolHistory] ${data.toolName}:`, err?.message);
  }
}

export default dbConnect;
