import mongoose from "mongoose";

declare global {
  var _mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const mongooseCache =
  global._mongooseCache ??
  (global._mongooseCache = { conn: null, promise: null });

async function dbConnect() {
  if (mongooseCache.conn) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  try {
    if (!mongooseCache.promise) {
      mongooseCache.promise = mongoose.connect(mongoUri);
    }

    mongooseCache.conn = await mongooseCache.promise;
  } catch (error) {
    mongooseCache.promise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default dbConnect;
