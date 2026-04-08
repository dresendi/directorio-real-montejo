import "server-only";

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

export function isMongoConfigured() {
  return Boolean(mongoUri);
}

export async function getMongoClient() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(mongoUri);
    global.__mongoClientPromise__ = client.connect();
  }

  return global.__mongoClientPromise__;
}
